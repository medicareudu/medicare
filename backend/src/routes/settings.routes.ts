import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  addHistoryLog,
  mapBranch,
  mapPharmacyInfo,
  mapServiceFee,
} from '../utils/helpers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [pharmacyInfo, branches, serviceFees] = await Promise.all([
      prisma.pharmacySettings.findFirst(),
      prisma.pharmacyBranch.findMany({ orderBy: { name: 'asc' } }),
      prisma.serviceFee.findMany({ orderBy: { name: 'asc' } }),
    ]);

    res.json({
      pharmacyInfo: pharmacyInfo ? mapPharmacyInfo(pharmacyInfo) : null,
      branches: branches.map(mapBranch),
      serviceFees: serviceFees.map(mapServiceFee),
    });
  })
);

router.put(
  '/pharmacy',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      name: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      defaultConsultationFee: z.number().optional(),
      lowStockThreshold: z.number().int().optional(),
      enableQrCode: z.boolean().optional(),
      taxRate: z.number().optional(),
      expiryReminderDays: z.number().int().optional(),
      emailNotifications: z.boolean().optional(),
      systemAlerts: z.boolean().optional(),
      tokenPrefix: z.string().optional(),
      currency: z.string().optional(),
      dateFormat: z.string().optional(),
      timeZone: z.string().optional(),
      autoBackup: z.boolean().optional(),
      autoBackupFrequency: z.string().optional(),
      printerPaperSize: z.string().optional(),
      printerMargins: z.string().optional(),
      sessionTimeout: z.number().int().optional(),
      enable2Fa: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const updated = await prisma.pharmacySettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        name: data.name || 'MediCare Clinic & Pharmacy',
        address: data.address || '',
        phone: data.phone || '',
        website: data.website || '',
        ...data,
      },
    });

    await addHistoryLog('Settings', 'PHARMACY_INFO_UPDATE', 'Updated pharmacy settings & credentials', req.user!.name);
    res.json(mapPharmacyInfo(updated));
  })
);

const branchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().default(''),
  phone: z.string().default(''),
  isMain: z.boolean().default(false),
});

router.post(
  '/branches',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = branchSchema.parse(req.body);
    const branch = await prisma.pharmacyBranch.create({
      data: {
        branchId: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        isMain: data.isMain,
      },
    });
    await addHistoryLog('Settings', data.id, `Created pharmacy branch: ${data.name}`, req.user!.name);
    res.status(201).json(mapBranch(branch));
  })
);

router.put(
  '/branches/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = branchSchema.partial().parse(req.body);
    const existing = await prisma.pharmacyBranch.findUnique({ where: { branchId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    const branch = await prisma.pharmacyBranch.update({
      where: { branchId: req.params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.isMain !== undefined && { isMain: data.isMain }),
      },
    });

    await addHistoryLog('Settings', req.params.id, `Updated details for pharmacy branch: ${existing.name}`, req.user!.name);
    res.json(mapBranch(branch));
  })
);

router.delete(
  '/branches/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await prisma.pharmacyBranch.findUnique({ where: { branchId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Branch not found' });
      return;
    }

    await prisma.pharmacyBranch.delete({ where: { branchId: req.params.id } });
    await addHistoryLog('Settings', req.params.id, `Removed pharmacy branch: ${existing.name}`, req.user!.name);
    res.json({ message: 'Deleted' });
  })
);

const serviceFeeSchema = z.object({
  name: z.string().min(1),
  defaultFee: z.number().min(0),
});

router.post(
  '/service-fees',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = serviceFeeSchema.parse(req.body);
    const feeId = `fee-${Math.floor(100 + Math.random() * 900)}`;
    const fee = await prisma.serviceFee.create({
      data: { feeId, name: data.name, defaultFee: data.defaultFee },
    });
    await addHistoryLog('Settings', feeId, `Added additional service fee type: ${data.name}`, req.user!.name);
    res.status(201).json(mapServiceFee(fee));
  })
);

router.put(
  '/service-fees/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = serviceFeeSchema.partial().parse(req.body);
    const existing = await prisma.serviceFee.findUnique({ where: { feeId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Service fee not found' });
      return;
    }

    const fee = await prisma.serviceFee.update({
      where: { feeId: req.params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.defaultFee !== undefined && { defaultFee: data.defaultFee }),
      },
    });

    await addHistoryLog('Settings', req.params.id, `Updated service fee type: ${existing.name}`, req.user!.name);
    res.json(mapServiceFee(fee));
  })
);

router.delete(
  '/service-fees/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const existing = await prisma.serviceFee.findUnique({ where: { feeId: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Service fee not found' });
      return;
    }

    await prisma.serviceFee.delete({ where: { feeId: req.params.id } });
    await addHistoryLog('Settings', req.params.id, `Deleted service fee type: ${existing.name}`, req.user!.name);
    res.json({ message: 'Deleted' });
  })
);

export default router;
