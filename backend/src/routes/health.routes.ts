import { Router, Request, Response } from 'express';

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

  // Check 1: Process responsiveness
  checks.process = { status: 'UP' };

  // We will attach dynamic checks for PostgreSQL and Redis as those clients are initialized
  if (!isReady) {
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      dependencies: checks,
    });
    return;
  }

  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    dependencies: checks,
  });
});
