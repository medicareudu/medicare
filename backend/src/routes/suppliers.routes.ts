import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { addHistoryLog, mapSupplier } from '../utils/helpers.js';

const router = Router();

const supplierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  contactPerson: z.string().default(''),
  phone: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  status: z.enum(['Active', 'Inactive']).default('Active'),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    res.json(suppliers.map(mapSupplier));
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = supplierSchema.parse(req.body);
    const existing = await prisma.supplier.findUnique({ where: { supplierId: data.id } });
    if (existing) {
      res.status(409).json({ error: 'Supplier ID already exists' });
      return;
    }

    const supplier = await prisma.supplier.create({
      data: {
        supplierId: data.id,
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        status: data.status,
      },
    });

    await addHistoryLog('Supplier', data.id, `Created supplier: ${data.name}`, req.user!.name);
    res.status(201).json(mapSupplier(supplier));
  })
);

router.put(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = supplierSchema.partial().parse(req.body);
    const existing = await prisma.supplier.findUnique({ where: { supplierId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    const supplier = await prisma.supplier.update({
      where: { supplierId: req.params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.contactPerson !== undefined && { contactPerson: data.contactPerson }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.status && { status: data.status }),
      },
    });

    await addHistoryLog('Supplier', req.params.id, `Updated details for supplier: ${existing.name}`, req.user!.name);
    res.json(mapSupplier(supplier));
  })
);

router.delete(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await prisma.supplier.findUnique({ where: { supplierId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Supplier not found' });
      return;
    }

    await prisma.supplier.delete({ where: { supplierId: req.params.id } });
    await addHistoryLog('Supplier', req.params.id, `Removed supplier: ${existing.name}`, req.user!.name);
    res.json({ message: 'Deleted' });
  })
);

export default router;
