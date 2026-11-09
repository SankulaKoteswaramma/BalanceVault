import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('System Health & Readiness Probes', () => {
  const app = createApp();

  it('GET /health should return 200 with service UP status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('service', 'BalanceVault-API');
    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('GET /ready should return 200 and dependencies status', async () => {
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('dependencies');
  });
});
