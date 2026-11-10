import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

// Ensure .env is loaded from backend directory or project root
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const fallbackDbUrl =
  'postgresql://neondb_owner:npg_oYBzu5sdZA3G@ep-muddy-tooth-besapw0o-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = fallbackDbUrl;
}

declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

export const prisma =
  global.prismaClient ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || fallbackDbUrl,
      },
    },
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
