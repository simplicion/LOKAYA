const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const stores = await prisma.store.count();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, isSystemAdmin: true }
    });
    console.log('Total stores in DB:', stores);
    console.log('Total users in DB:', users.length);
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();

