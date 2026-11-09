import { Request, Response, NextFunction } from 'express';
import { redis, isRedisConnected } from '../redis';
import { logger } from '../utils/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyPrefix: string;
}

// In-memory fallback sliding window cache for resilience
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

// Periodic cleanup of expired memoryStore entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}, 300000);

export const createRateLimiter = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Generate identity key: combine user ID (if authenticated) or IP address
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const identifier = req.user ? `user:${req.user.id}` : `ip:${clientIp}`;
    const rateLimitKey = `ratelimit:${options.keyPrefix}:${identifier}`;
    const windowSecs = Math.ceil(options.windowMs / 1000);

    let currentHits = 0;

    if (isRedisConnected) {
      try {
        const hits = await redis.incr(rateLimitKey);
        if (hits === 1) {
          await redis.expire(rateLimitKey, windowSecs);
        }
        currentHits = hits;
      } catch (err) {
        logger.warn('Redis rate limit command failed, using memory fallback', {
          error: (err as Error).message,
        });
        currentHits = incrementMemoryStore(rateLimitKey, options.windowMs);
      }
    } else {
      // Fail-secure: use in-memory rate limiting so endpoints are still protected
      currentHits = incrementMemoryStore(rateLimitKey, options.windowMs);
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - currentHits));

    if (currentHits > options.max) {
      logger.warn('Rate limit exceeded', {
        identifier,
        keyPrefix: options.keyPrefix,
        hits: currentHits,
        limit: options.max,
        correlationId: req.correlationId,
      });

      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds: windowSecs,
        correlationId: req.correlationId,
      });
      return;
    }

    next();
  };
};

function incrementMemoryStore(key: string, windowMs: number): number {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.expiresAt <= now) {
    memoryStore.set(key, { count: 1, expiresAt: now + windowMs });
    return 1;
  }

  existing.count += 1;
  return existing.count;
}
