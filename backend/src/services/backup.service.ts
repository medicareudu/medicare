import fs from 'fs/promises';
import path from 'path';
import cron from 'node-cron';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
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

let currentJob: any = null;

export async function generateBackupData(exportedBy: string = 'System Administrator') {
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

  const mappedMedicines = medicines.map(mapMedicine);
  const mappedSuppliers = suppliers.map(mapSupplier);
  const mappedStaff = staff.map(mapStaff);
  const mappedBranches = branches.map(mapBranch);
  const mappedPrescriptions = prescriptions.map(mapPrescription);

  const backupPayload = {
    medicines: mappedMedicines,
    suppliers: mappedSuppliers,
    staff: mappedStaff,
    pharmacyInfo: pharmacyInfo ? mapPharmacyInfo(pharmacyInfo) : null,
    branches: mappedBranches,
    prescriptions: mappedPrescriptions,
    history: history.map(mapHistory),
    serviceFees: serviceFees.map(mapServiceFee),
    backupMeta: {
      exportedAt: new Date().toISOString(),
      exportedBy,
      recordsCount: {
        medicines: mappedMedicines.length,
        suppliers: mappedSuppliers.length,
        prescriptions: mappedPrescriptions.length,
        staff: mappedStaff.length,
        branches: mappedBranches.length,
      },
    },
  };

  return backupPayload;
}

export async function performAutoBackup() {
  try {
    const data = await generateBackupData('Auto Scheduler');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `medicare_backup_${timestamp}.json`;
    const backupsDir = path.resolve(process.cwd(), 'backups');

    await fs.mkdir(backupsDir, { recursive: true });
    await fs.writeFile(path.join(backupsDir, filename), JSON.stringify(data, null, 2), 'utf-8');
    logger.info(`Automated backup successfully saved to ${filename}`);
  } catch (error) {
    logger.error(error, 'Failed to perform automated backup');
  }
}

export async function scheduleAutoBackups() {
  try {
    const settings = await prisma.pharmacySettings.findFirst();
    if (currentJob) {
      currentJob.stop();
      currentJob = null;
    }

    if (!settings || !settings.autoBackup) {
      logger.info('Auto backup is disabled in settings.');
      return;
    }

    let cronExpression = '0 0 * * *'; // Default: Daily at midnight

    switch (settings.autoBackupFrequency) {
      case 'Hourly':
        cronExpression = '0 * * * *';
        break;
      case 'Daily':
        cronExpression = '0 0 * * *';
        break;
      case 'Weekly':
        cronExpression = '0 0 * * 0'; // Sunday at midnight
        break;
      case 'Monthly':
        cronExpression = '0 0 1 * *'; // 1st of every month
        break;
    }

    currentJob = cron.schedule(cronExpression, async () => {
      logger.info('Executing scheduled auto backup...');
      await performAutoBackup();
    });

    logger.info(`Auto backup scheduled with frequency: ${settings.autoBackupFrequency} (${cronExpression})`);
  } catch (err) {
    logger.error(err, 'Failed to schedule auto backups');
  }
}
