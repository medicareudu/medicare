const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const meds = await prisma.medicine.findMany();
  console.log(meds);
}
check();
