import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../lib/prisma.js';
import * as xlsx from 'xlsx';
import { addHistoryLog } from '../utils/helpers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/income/download',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          gte: new Date(startDate as string),
          lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999))
        }
      };
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        status: 'Completed',
        ...dateFilter
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalConsultation = 0;
    let totalMedicines = 0;
    let totalOther = 0;
    let totalAmount = 0;

    const rows = prescriptions.map((p) => {
      let medsCost = 0;
      if (Array.isArray(p.medicines)) {
        p.medicines.forEach((m: any) => {
          medsCost += (m.price || 0) * (m.qty || 0);
        });
      }
      
      let otherCost = 0;
      if (Array.isArray(p.additionalCharges)) {
        p.additionalCharges.forEach((c: any) => {
          otherCost += (c.amount || 0);
        });
      }

      totalConsultation += p.consultationFee;
      totalMedicines += medsCost;
      totalOther += otherCost;
      totalAmount += p.totalAmount;

      return {
        'Date': new Date(p.createdAt).toLocaleDateString(),
        'Time': new Date(p.createdAt).toLocaleTimeString(),
        'Token': p.token,
        'Patient Name': p.patientName || 'Walk-in',
        'Doctor': p.doctor || '-',
        'Consultation Fee': p.consultationFee,
        'Medicine Sales': medsCost,
        'Other Charges': otherCost,
        'Total Bill Amount': p.totalAmount
      };
    });

    // Add a summary row at the end
    rows.push({
      'Date': 'TOTALS',
      'Time': '',
      'Token': '',
      'Patient Name': '',
      'Doctor': '',
      'Consultation Fee': totalConsultation,
      'Medicine Sales': totalMedicines,
      'Other Charges': totalOther,
      'Total Bill Amount': totalAmount
    });

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Income Ledger');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    await addHistoryLog('Settings', 'INCOME_DOWNLOAD', `Downloaded Income Ledger Excel Report`, req.user!.name);

    res.setHeader('Content-Disposition', `attachment; filename=Income_Ledger_${new Date().toISOString().slice(0, 10)}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  })
);

export default router;
