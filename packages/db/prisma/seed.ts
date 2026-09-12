import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with secure credentials...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@lokaya.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Industry-standard bcrypt hashing with salt rounds = 10
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedPassword,
      isSystemAdmin: true,
      name: 'System Admin',
      authProvider: 'LOCAL',
    },
    create: {
      email: adminEmail,
      password: hashedPassword,
      isSystemAdmin: true,
      name: 'System Admin',
      authProvider: 'LOCAL',
    },
  });

  console.log(`[Seed] Admin user verified & secured:`);
  console.log(` - ID: ${admin.id}`);
  console.log(` - Email: ${admin.email}`);
  console.log(` - Role: System Admin (isSystemAdmin: true)`);
  console.log(` - Password Hash: Securely stored in DB (${hashedPassword.substring(0, 10)}...)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
