import { prisma } from '../src/lib/prisma.js';
import { findExistingMedicine } from '../src/utils/helpers.js';

async function testMatch() {
  console.log('Running backend stock restocking validation tests...');

  // Setup test environment
  const targetId = 'MED-TST-FZY';
  
  // Cleanup any old test matches first
  await prisma.medicine.deleteMany({
    where: {
      OR: [
        { medicineId: targetId },
        { medicineId: 'MED-TST-INT' },
        { name: { contains: 'Test Amoxicillin' } },
        { name: { contains: 'Test Amoxillin' } }
      ]
    }
  });

  // 1. Create a base medicine representing the existing out of stock/low stock quantity
  const original = await prisma.medicine.create({
    data: {
      medicineId: targetId,
      name: 'Test Amoxicillin 500mg',
      category: 'Antibiotic',
      qty: 0,
      expiry: '2026-12-31',
      supplier: 'MediSupply',
      price: 40.0,
      minThreshold: 50
    }
  });

  console.log('Created base test medicine:', original);

  // 2. Perform a fuzzy/spelling check restock query
  // Let the user restock "Test Amoxillin" (missing "ci", case mismatch) with a different ID (MED-TST-INT)
  const queryId = 'MED-TST-INT';
  const queryName = 'test amoxillin'; // Typos and lowercase
  
  const existing = await findExistingMedicine(prisma, queryId, queryName);

  if (!existing) {
    throw new Error('Verification failed: Failed to detect existing medicine under fuzzy check "test amoxillin"');
  }
  
  console.log('Validation success: matched fuzzy name to existing record UID:', existing.uid);

  // 3. Simulate Postgres update matching POST / behavior
  const updated = await prisma.medicine.update({
    where: { uid: existing.uid },
    data: {
      medicineId: queryId, // update to new ID
      qty: existing.qty + 400, // add stock
      price: 40.0,
      expiry: '2026-12-31',
      supplier: 'MediSupply',
      minThreshold: 50,
      category: 'Antibiotic'
    }
  });

  console.log('Restocked medicine record in database:', updated);

  // Assertions
  if (updated.medicineId !== 'MED-TST-INT') {
    throw new Error(`Verification failed: Expected ID to update to MED-TST-INT, got ${updated.medicineId}`);
  }
  if (updated.qty !== 400) {
    throw new Error(`Verification failed: Expected quantity to merge to 400, got ${updated.qty}`);
  }

  // Double check that database doesn't have duplicate records
  const allTestMeds = await prisma.medicine.findMany({
    where: {
      name: { contains: 'Test Amox' }
    }
  });

  if (allTestMeds.length !== 1) {
    throw new Error(`Verification failed: Expected only 1 test medicine record to exist, found ${allTestMeds.length}`);
  }

  console.log('Verification Success: Restocked successfully, ID updated, no duplicates created.');

  // Clean up
  await prisma.medicine.delete({
    where: { uid: updated.uid }
  });
  console.log('Cleaned up verification test records.');
}

testMatch()
  .then(() => console.log('All tests passed successfully!'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
