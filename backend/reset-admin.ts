import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.updateMany({
    where: { username: 'admin' },
    data: { passwordHash: hash }
  });
  console.log('Admin password reset to admin123');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
