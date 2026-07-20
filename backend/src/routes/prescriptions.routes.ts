import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, requireAdmin, requireStaff } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { addHistoryLog, mapPrescription } from '../utils/helpers.js';

const router = Router();

const prescriptionItemSchema = z.object({
  medicineId: z.string(),
  name: z.string(),
  qty: z.number().int().min(1),
  price: z.number(),
  unit: z.string().default('tablets'),
});

const additionalChargeSchema = z.object({
  name: z.string(),
  fee: z.number(),
  checked: z.boolean(),
});

const prescriptionSchema = z.object({
  patientName: z.string().default(''),
  patientNo: z.string().min(1),
  doctor: z.string().min(1),
  date: z.string().min(1),
  medicines: z.array(prescriptionItemSchema).default([]),
  consultationFee: z.number().default(0),
  additionalCharges: z.array(additionalChargeSchema).default([]),
  totalAmount: z.number(),
  discount: z.number().default(0),
  status: z.enum(['Pending', 'Completed', 'Overdue']).default('Pending'),
});

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const prescriptions = await prisma.prescription.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(prescriptions.map(mapPrescription));
  })
);

router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = prescriptionSchema.parse(req.body);
    const settings = await prisma.pharmacySettings.findFirst();
    const prefix = settings?.tokenPrefix || 'TKN';

    const allPrescriptions = await prisma.prescription.findMany({ select: { token: true } });
    const lastTokenNum = allPrescriptions
      .map((pr) => {
        const cleaned = pr.token.replace(`${prefix}-`, '').replace('TKN-', '').replace('MED-', '');
        return parseInt(cleaned, 10) || 0;
      })
      .reduce((max, current) => Math.max(max, current), 127);

    const token = `${prefix}-${(lastTokenNum + 1).toString().padStart(5, '0')}`;

    const prescription = await prisma.prescription.create({
      data: {
        token,
        patientName: data.patientName,
        patientNo: data.patientNo,
        doctor: data.doctor,
        date: data.date,
        medicines: data.medicines,
        consultationFee: data.consultationFee,
        additionalCharges: data.additionalCharges,
        totalAmount: data.totalAmount,
        discount: data.discount,
        status: 'Pending',
      },
    });

    const medCount = data.medicines.length;
    const tests = data.additionalCharges.filter((c) => c.checked).map((c) => c.name);
    const testInfo = tests.length > 0 ? ` Tests: ${tests.join(', ')}.` : '';
    await addHistoryLog(
      'Request',
      token,
      `Medicine request created — ${medCount} medicine(s), ref ${data.patientNo}.${testInfo} Token ${token} sent to Staff dashboard.`,
      req.user!.name
    );

    res.status(201).json(mapPrescription(prescription));
  })
);

router.post(
  '/:token/dispense',
  requireStaff,
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const prescription = await prisma.prescription.findUnique({ where: { token } });

    if (!prescription) {
      res.status(404).json({ error: 'Request not found' });
      return;
    }

    if (prescription.status === 'Completed') {
      res.status(400).json({ error: 'Request already completed' });
      return;
    }

    const medicines = prescription.medicines as Array<{ medicineId: string; name: string; qty: number }>;
    const settings = await prisma.pharmacySettings.findFirst();
    const lowStockThreshold = settings?.lowStockThreshold ?? 50;

    const updatedMeds = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const item of medicines) {
        const med = await tx.medicine.findUnique({ where: { medicineId: item.medicineId } });
        if (med) {
          const updated = await tx.medicine.update({
            where: { uid: med.uid },
            data: { qty: Math.max(0, med.qty - item.qty) },
          });
          results.push(updated);
        }
      }
      return results;
    });

    const now = new Date();
    const formattedDate = now.toLocaleString('sv-SE', { timeZone: 'Asia/Colombo' }).substring(0, 16);

    const updated = await prisma.prescription.update({
      where: { token },
      data: {
        status: 'Completed',
        issuedAt: formattedDate,
        issuedBy: req.user!.name,
      },
    });

    const medNames = medicines.map((m) => `${m.name} (x${m.qty})`).join(', ');
    await addHistoryLog(
      'Issued',
      token,
      `Medicines issued for request ${token}. Items: ${medNames}. Stock deducted from inventory.`,
      req.user!.name
    );

    await addHistoryLog(
      'Request',
      token,
      `Request ${token} marked as Completed by ${req.user!.name}.`,
      req.user!.name
    );

    for (const med of updatedMeds) {
      const threshold = med.minThreshold ?? lowStockThreshold;
      if (med.qty <= threshold) {
        await addHistoryLog(
          'Alert',
          med.medicineId,
          `Low stock alert — ${med.name} is at ${med.qty} units (threshold: ${threshold}). Admin notified to reorder.`,
          'System'
        );
      }
    }

    res.json(mapPrescription(updated));
  })
);

router.patch(
  '/:token/status',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { status } = z.object({ status: z.enum(['Pending', 'Completed', 'Overdue']) }).parse(req.body);
    const updated = await prisma.prescription.update({
      where: { token: req.params.token },
      data: { status },
    });
    res.json(mapPrescription(updated));
  })
);

export default router;
