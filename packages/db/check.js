const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findUnique({ where: { id: '2f2c4a78-4257-4f9e-ad0b-68c4b2129567' } }).then(u => console.dir(u)).finally(() => prisma.$disconnect());
