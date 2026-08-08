import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { addHistoryLog, mapMedicine, findExistingMedicine } from '../utils/helpers.js';

const router = Router();

const medicineSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
  genericName: z.string().min(1, 'Generic Name is required'),
  tradeName: z.string().min(1, 'Trade Name is required'),
  category: z.string().default('General'),
  qty: z.number().int().min(0),
  expiry: z.string().min(1),
  supplier: z.string().default(''),
  price: z.number().min(0),
  minThreshold: z.number().int().min(0).default(50),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const medicines = await prisma.medicine.findMany({ orderBy: { uid: 'asc' } });
    res.json(medicines.map(mapMedicine));
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = medicineSchema.parse(req.body);
    const existing = await findExistingMedicine(prisma, data.id, data.name);

    if (existing) {
      const updated = await prisma.medicine.update({
        where: { uid: existing.uid },
        data: {
          medicineId: data.id,
          name: (data.genericName || data.name || '').trim(),
          genericName: data.genericName.trim(),
          tradeName: data.tradeName.trim(),
          qty: existing.qty + data.qty,
          price: data.price,
          expiry: data.expiry,
          supplier: data.supplier.trim(),
          minThreshold: data.minThreshold,
          category: data.category,
        }
      });
      await addHistoryLog(
        'Stock',
        data.id,
        `Restocked medicine via manual add: ${existing.name} (+${data.qty} units, total: ${existing.qty + data.qty})`,
        req.user!.name
      );
      res.status(200).json(mapMedicine(updated));
      return;
    }

    const medicine = await prisma.medicine.create({
      data: {
        medicineId: data.id,
        name: (data.genericName || data.name || '').trim(),
        genericName: data.genericName.trim(),
        tradeName: data.tradeName.trim(),
        category: data.category,
        qty: data.qty,
        expiry: data.expiry,
        supplier: data.supplier.trim(),
        price: data.price,
        minThreshold: data.minThreshold,
      },
    });

    await addHistoryLog('Stock', data.id, `Added new medicine: ${data.name} (${data.qty} units)`, req.user!.name);
    res.status(201).json(mapMedicine(medicine));
  })
);

router.put(
  '/:uid',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const uid = parseInt(req.params.uid, 10);
    const data = medicineSchema.partial().parse(req.body);

    const existing = await prisma.medicine.findUnique({ where: { uid } });
    if (!existing) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }

    const medicine = await prisma.medicine.update({
      where: { uid },
      data: {
        ...(data.id && { medicineId: data.id }),
        ...(data.genericName && { name: data.genericName }),
        ...(data.genericName && { genericName: data.genericName }),
        ...(data.tradeName && { tradeName: data.tradeName }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.qty !== undefined && { qty: data.qty }),
        ...(data.expiry && { expiry: data.expiry }),
        ...(data.supplier !== undefined && { supplier: data.supplier }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.minThreshold !== undefined && { minThreshold: data.minThreshold }),
      },
    });

    if (data.qty !== undefined && data.qty !== existing.qty) {
      await addHistoryLog(
        'Stock',
        existing.medicineId,
        `Manual stock update for ${existing.name}: ${existing.qty} → ${data.qty}`,
        req.user!.name
      );
    } else {
      await addHistoryLog('Stock', existing.medicineId, `Updated details for ${existing.name}`, req.user!.name);
    }

    res.json(mapMedicine(medicine));
  })
);

router.delete(
  '/:uid',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const uid = parseInt(req.params.uid, 10);
    const existing = await prisma.medicine.findUnique({ where: { uid } });
    if (!existing) {
      res.status(404).json({ error: 'Medicine not found' });
      return;
    }

    await prisma.medicine.delete({ where: { uid } });
    await addHistoryLog('Stock', existing.medicineId, `Deleted medicine record: ${existing.name}`, req.user!.name);
    res.json({ message: 'Deleted' });
  })
);

router.post(
  '/import',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const importItemSchema = z.object({
      id: z.string().min(1, 'Medicine ID is required'),
      name: z.string().optional(),
      genericName: z.string().min(1, 'Generic name is required'),
      tradeName: z.string().min(1, 'Trade name is required'),
      category: z.string().default('General'),
      qty: z.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative'),
      expiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry must be YYYY-MM-DD'),
      supplier: z.string().min(1, 'Supplier is required'),
      price: z.number().min(0, 'Price cannot be negative').default(0),
      minThreshold: z.number().int().min(0).default(50),
      action: z.enum(['update', 'skip']).optional().default('update'),
    });

    const parseResult = z.array(importItemSchema).safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten(),
      });
      return;
    }

    const items = parseResult.data;
    if (items.length === 0) {
      res.status(400).json({ error: 'No records to import' });
      return;
    }

    let addCount = 0;
    let updateCount = 0;
    let skipCount = 0;

    const medicines = await prisma.$transaction(async (tx) => {
      const allMeds = await tx.medicine.findMany();
      for (const item of items) {
        const medicineId = (item.id || '').toUpperCase().trim();
        const genericNameStr = (item.genericName || item.name || item.tradeName || 'Unknown').trim();
        const tradeNameStr = (item.tradeName || item.genericName || item.name || 'Unknown').trim();
        const supplierStr = (item.supplier || 'PharmaCo').trim();
        const searchName = genericNameStr;
        const existing = await findExistingMedicine(tx, medicineId, searchName, allMeds, genericNameStr, tradeNameStr);

        if (existing) {
          if (item.action === 'skip') {
            skipCount++;
            continue;
          }
          await tx.medicine.update({
            where: { uid: existing.uid },
            data: {
              medicineId,
              name: genericNameStr,
              genericName: genericNameStr,
              tradeName: tradeNameStr,
              category: item.category || 'General',
              qty: (existing.qty ?? 0) + (item.qty ?? 0),
              expiry: item.expiry || '2027-12-31',
              supplier: supplierStr,
              price: item.price ?? 0,
              minThreshold: item.minThreshold ?? 50,
            },
          });
          updateCount++;
        } else {
          await tx.medicine.create({
            data: {
              medicineId,
              name: genericNameStr,
              genericName: genericNameStr,
              tradeName: tradeNameStr,
              category: item.category || 'General',
              qty: item.qty ?? 0,
              expiry: item.expiry || '2027-12-31',
              supplier: supplierStr,
              price: item.price ?? 0,
              minThreshold: item.minThreshold ?? 50,
            },
          });
          addCount++;
        }
      }

      return tx.medicine.findMany({ orderBy: { uid: 'asc' } });
    }, {
      timeout: 30000 // 30 seconds
    });

    const supplierName = items[0]?.supplier || 'supplier';
    await addHistoryLog(
      'Import',
      `IMPORT-${Date.now().toString().substring(8)}`,
      `${items.length} medicine records imported from ${supplierName} Excel file (${addCount} new, ${updateCount} stock merged, ${skipCount} skipped)`,
      req.user!.name
    );

    res.json({
      medicines: medicines.map(mapMedicine),
      addCount,
      updateCount,
      skipCount,
      totalImported: items.length,
    });
  })
);

export default router;
