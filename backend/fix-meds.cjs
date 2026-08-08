const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const meds = await prisma.medicine.findMany();
  for (const m of meds) {
    // We only swap if the name starts with MED- (because they got swapped)
    if (m.name.startsWith('MED-') || m.name.startsWith('OTC-')) {
      await prisma.medicine.update({
        where: { uid: m.uid },
        data: {
          medicineId: m.name,
          name: m.medicineId
        }
      });
      console.log(`Swapped ${m.medicineId} <-> ${m.name}`);
    }
  }
  console.log('Done!');
}
fix().catch(console.error).finally(() => prisma.$disconnect());
