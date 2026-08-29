import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from './index';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
const adapter = new PrismaPg({ connectionString: config.db.url });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: config.env === 'development' ? ['error', 'warn'] : ['error'],
  });

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;