import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset inventory — medicines are populated via Admin Excel import
  await prisma.historyLog.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.medicine.deleteMany();

  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff456', 10);

  // Remove old users to ensure clean state with correct passwords
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      staffId: 'STF-001',
      name: 'Admin',
      username: 'admin',
      email: 'admin@medicare.com',
      passwordHash: adminHash,
      role: 'Admin',
      status: 'Active',
    },
  });

  await prisma.user.create({
    data: {
      staffId: 'STF-002',
      name: 'Staff',
      username: 'staff',
      email: 'staff@medicare.com',
      passwordHash: staffHash,
      role: 'Staff',
      status: 'Active',
    },
  });

  const suppliers = [
    { supplierId: 'SUP-001', name: 'PharmaCo', contactPerson: 'Saman Kumara', phone: '077-1234567', email: 'saman@pharmaco.com', status: 'Active' as const },
    { supplierId: 'SUP-002', name: 'MediSupply', contactPerson: 'Anura Bandara', phone: '071-7654321', email: 'anura@medisupply.lk', status: 'Active' as const },
    { supplierId: 'SUP-003', name: 'MedPlus', contactPerson: 'Nisha Perera', phone: '076-9876543', email: 'nisha@medplus.lk', status: 'Active' as const },
  ];

  for (const sup of suppliers) {
    await prisma.supplier.upsert({
      where: { supplierId: sup.supplierId },
      update: sup,
      create: sup,
    });
  }

  await prisma.pharmacySettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'MediCare Clinic & Pharmacy',
      address: '123 Hospital Road, Kandy, Sri Lanka',
      phone: '081-234-5678',
      website: 'medicareclinic.lk',
      defaultConsultationFee: 1500,
      lowStockThreshold: 50,
      enableQrCode: true,
      taxRate: 2.5,
      expiryReminderDays: 30,
      emailNotifications: true,
      systemAlerts: true,
      tokenPrefix: 'TKN',
      currency: 'LKR',
      dateFormat: 'YYYY-MM-DD HH:mm',
      timeZone: 'Asia/Colombo',
      autoBackup: true,
      autoBackupFrequency: 'Daily',
      printerPaperSize: '80mm',
      printerMargins: '0.5in',
      sessionTimeout: 30,
      enable2Fa: false,
    },
  });

  const branches = [
    { branchId: 'BR-001', name: 'MediCare Main Pharmacy', address: '123 Hospital Road, Kandy', phone: '081-234-5678', isMain: true },
    { branchId: 'BR-002', name: 'MediCare Town Branch', address: '45 Colombo Street, Kandy', phone: '081-234-9988', isMain: false },
  ];

  for (const branch of branches) {
    await prisma.pharmacyBranch.upsert({
      where: { branchId: branch.branchId },
      update: branch,
      create: branch,
    });
  }

  const serviceFees = [
    { feeId: 'fee-1', name: 'Nebulizer treatment', defaultFee: 800 },
    { feeId: 'fee-2', name: 'ECG service', defaultFee: 1200 },
    { feeId: 'fee-3', name: 'EEG service', defaultFee: 1800 },
    { feeId: 'fee-4', name: 'Medical procedure', defaultFee: 2000 },
    { feeId: 'fee-5', name: 'Other services', defaultFee: 1000 },
  ];

  for (const fee of serviceFees) {
    await prisma.serviceFee.upsert({
      where: { feeId: fee.feeId },
      update: fee,
      create: fee,
    });
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
  await prisma.historyLog.create({
    data: {
      historyId: 'HIST-00001',
      time: now,
      type: 'Settings',
      reference: 'SYSTEM_INIT',
      detail: 'System initialized. Medicine inventory is empty — use Excel Import to load supplier records.',
      user: 'System',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Medicine inventory: EMPTY (use Admin → Medicines → Excel Import)');
  console.log('Login credentials: admin / admin123  or  staff / staff456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
