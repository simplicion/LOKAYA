import { PrismaClient } from './prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isProd = process.env.NODE_ENV === 'production';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProd ? ['error', 'warn'] : ['error', 'warn'],
  });

if (!isProd) globalForPrisma.prisma = prisma;

export async function warmupDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[Database] Connection pool warmed up and ready.');
  } catch (err: any) {
    console.warn('[Database] Warmup notice:', err.message);
  }
}

export * from './prisma/client';
