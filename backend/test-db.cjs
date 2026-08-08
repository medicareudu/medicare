const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleMeds = [
  {
    medicineId: 'MED-001',
    name: 'Paracetamol',
    genericName: 'Paracetamol',
    tradeName: 'Panadol 500mg',
    category: 'Analgesic / Antipyretic',
    qty: 250,
    expiry: '2027-12-31',
    supplier: 'PharmaCo',
    price: 25.00,
    minThreshold: 50,
  },
  {
    medicineId: 'MED-002',
    name: 'Paracetamol',
    genericName: 'Paracetamol',
    tradeName: 'Paincare 500mg',
    category: 'Analgesic / Antipyretic',
    qty: 180,
    expiry: '2027-10-15',
    supplier: 'MediSupply',
    price: 15.00,
    minThreshold: 50,
  },
  {
    medicineId: 'MED-003',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    tradeName: 'Moxilin 500mg',
    category: 'Antibiotic',
    qty: 120,
    expiry: '2026-11-30',
    supplier: 'MedPlus',
    price: 45.00,
    minThreshold: 30,
  },
  {
    medicineId: 'MED-004',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin',
    tradeName: 'Lipitor 20mg',
    category: 'Statin / Cholesterol',
    qty: 90,
    expiry: '2027-08-20',
    supplier: 'PharmaCo',
    price: 65.00,
    minThreshold: 20,
  },
  {
    medicineId: 'MED-005',
    name: 'Metformin',
    genericName: 'Metformin',
    tradeName: 'Glucophage 500mg',
    category: 'Antidiabetic',
    qty: 300,
    expiry: '2028-01-15',
    supplier: 'MediSupply',
    price: 30.00,
    minThreshold: 50,
  }
];

async function seed() {
  console.log('Seeding initial medicines into database...');
  for (const item of sampleMeds) {
    await prisma.medicine.upsert({
      where: { medicineId: item.medicineId },
      update: item,
      create: item,
    });
  }
  const count = await prisma.medicine.count();
  console.log(`SUCCESS: ${count} medicines in database!`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
