import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'snapshaksha@gmail.com';
  const user = await prisma.user.findUnique({ where: { email } });
  console.log('User:', user);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
