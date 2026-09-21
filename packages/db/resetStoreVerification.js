const { PrismaClient } = require('./prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.store.updateMany({
    data: {
      isVerified: false,
      verificationStatus: 'NOT_APPLIED',
      verificationRequestedAt: null
    }
  });
  console.log(`Reset ${updated.count} stores to isVerified: false, verificationStatus: 'NOT_APPLIED'`);
  const stores = await prisma.store.findMany({ select: { id: true, name: true, status: true, isVerified: true, verificationStatus: true } });
  console.log('Stores after reset:', JSON.stringify(stores, null, 2));
}

main().finally(() => prisma.$disconnect());
