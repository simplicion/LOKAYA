const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.store.findMany({ include: { users: { include: { user: true } } } }).then(stores => {
  console.log(JSON.stringify(stores, null, 2));
}).finally(() => prisma.$disconnect());
