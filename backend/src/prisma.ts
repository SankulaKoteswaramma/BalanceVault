import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.prismaClient ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaClient = prisma;
}

// Log unexpected database errors
// @ts-expect-error Prisma event typing
prisma.$on('error', (e: { message: string; target: string }) => {
  logger.error('Database Error', undefined, { message: e.message, target: e.target });
});
