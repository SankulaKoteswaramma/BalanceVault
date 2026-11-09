import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createRateLimiter } from '../middleware/rateLimiter';

describe('Rate Limiter Resilience & Protection Test Suite', () => {
  const app = express();
  
  // Custom test limiter with limit of 3 requests
  const testLimiter = createRateLimiter({
    windowMs: 10000,
    max: 3,
    keyPrefix: 'test-limiter',
    message: 'Test rate limit exceeded',
  });

  app.get('/test-limit', testLimiter, (req, res) => {
    res.status(200).json({ success: true, message: 'OK' });
  });

  it('should allow requests within limit and block with 429 when threshold exceeded', async () => {
    // Attempt 1
    const res1 = await request(app).get('/test-limit');
    expect(res1.status).toBe(200);
    expect(res1.headers['x-ratelimit-remaining']).toBe('2');

    // Attempt 2
    const res2 = await request(app).get('/test-limit');
    expect(res2.status).toBe(200);
    expect(res2.headers['x-ratelimit-remaining']).toBe('1');

    // Attempt 3
    const res3 = await request(app).get('/test-limit');
    expect(res3.status).toBe(200);
    expect(res3.headers['x-ratelimit-remaining']).toBe('0');

    // Attempt 4 - should trigger 429 Too Many Requests
    const res4 = await request(app).get('/test-limit');
    expect(res4.status).toBe(429);
    expect(res4.body.success).toBe(false);
    expect(res4.body.error).toBe('Test rate limit exceeded');
    expect(res4.body.retryAfterSeconds).toBeDefined();
  });
});
