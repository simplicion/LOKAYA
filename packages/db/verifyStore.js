const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.store.update({ where: { id: '75c6a3f1-9cd3-4c64-ae6c-881b94c6d55f' }, data: { status: 'VERIFIED' } });
  await prisma.user.update({ where: { id: '43d25e87-ade0-4f97-9c5a-d60238a110ea' }, data: { role: 'STORE_PARTNER' } });
  console.log('done');
}
main().finally(() => prisma.$disconnect());
