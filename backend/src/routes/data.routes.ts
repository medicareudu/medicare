import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import {
  mapBranch,
  mapHistory,
  mapMedicine,
  mapPharmacyInfo,
  mapPrescription,
  mapServiceFee,
  mapStaff,
  mapSupplier,
} from '../utils/helpers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const [medicines, suppliers, staff, pharmacyInfo, branches, prescriptions, history, serviceFees] =
      await Promise.all([
        prisma.medicine.findMany({ orderBy: { uid: 'asc' } }),
        prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
        prisma.user.findMany({ orderBy: { name: 'asc' } }),
        prisma.pharmacySettings.findFirst(),
        prisma.pharmacyBranch.findMany({ orderBy: { name: 'asc' } }),
        prisma.prescription.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.historyLog.findMany({ orderBy: { createdAt: 'desc' } }),
        prisma.serviceFee.findMany({ orderBy: { name: 'asc' } }),
      ]);

    res.json({
      medicines: medicines.map(mapMedicine),
      suppliers: suppliers.map(mapSupplier),
      staff: staff.map(mapStaff),
      pharmacyInfo: pharmacyInfo ? mapPharmacyInfo(pharmacyInfo) : null,
      branches: branches.map(mapBranch),
      prescriptions: prescriptions.map(mapPrescription),
      history: history.map(mapHistory),
      serviceFees: serviceFees.map(mapServiceFee),
    });
  })
);

export default router;
