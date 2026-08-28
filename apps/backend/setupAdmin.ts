import { prisma } from '@workspace/db';
import bcrypt from 'bcryptjs';

async function setupAdmin() {
  const adminEmail = 'admin@snapick.com';
  const password = await bcrypt.hash('admin123', 10);

  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password,
        role: 'SYSTEM_ADMIN',
        name: 'System Admin',
        authProvider: 'LOCAL'
      }
    });
    console.log('Created new admin user');
  } else {
    admin = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        password,
        role: 'SYSTEM_ADMIN'
      }
    });
    console.log('Updated existing admin user password');
  }
  
  console.log('Admin Credentials:');
  console.log('Email:', adminEmail);
  console.log('Password:', 'admin123');
}

setupAdmin().catch(console.error);
