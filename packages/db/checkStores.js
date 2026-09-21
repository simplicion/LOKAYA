const { PrismaClient } = require('./prisma/client');
const prisma = new PrismaClient();

prisma.store.findMany({ select: { id: true, name: true, status: true, isVerified: true, verificationStatus: true } }).then(stores => {
  console.log(JSON.stringify(stores, null, 2));
}).finally(() => prisma.$disconnect());
