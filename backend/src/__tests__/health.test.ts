import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../prisma';

vi.mock('../prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('System Health & Readiness Probes', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /health should return 200 with service UP status (Shallow liveness)', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('service', 'BalanceVault-API');
    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('GET /ready should return 200 when database dependency is healthy', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ 1: 1 }]);

    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body.dependencies.database.status).toBe('UP');
    expect(response.body.dependencies.process.status).toBe('UP');
  });

  it('GET /ready should return 503 when database dependency is disconnected', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('Connection timeout to Postgres'));

    const response = await request(app).get('/ready');
    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'DOWN');
    expect(response.body.dependencies.database.status).toBe('DOWN');
  });
});
