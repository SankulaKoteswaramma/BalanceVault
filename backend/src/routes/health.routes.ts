import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { isRedisConnected } from '../redis';

export const healthRouter = Router();

// Liveness check: Shallow probe indicating the Node.js server process is responsive
healthRouter.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'BalanceVault-API',
  });
});

// Readiness check: Deep probe validating external dependencies (PostgreSQL, Redis)
healthRouter.get('/ready', async (req: Request, res: Response) => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};
  let isReady = true;

  // 1. Process check
  checks.process = { status: 'UP' };

  // 2. PostgreSQL check
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'UP',
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    isReady = false;
    checks.database = {
      status: 'DOWN',
      error: 'Database connection failed',
    };
  }

  // 3. Redis check
  checks.redis = {
    status: isRedisConnected ? 'UP' : 'DEGRADED_FALLBACK_ACTIVE',
  };

  const httpStatus = isReady ? 200 : 503;

  res.status(httpStatus).json({
    status: isReady ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    dependencies: checks,
  });
});
