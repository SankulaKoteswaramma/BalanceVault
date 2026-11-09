import Redis from 'ioredis';
import { config } from './config';
import { logger } from './utils/logger';

export let isRedisConnected = false;

export const redis = new Redis(config.REDIS_URL, {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD || undefined,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    // Retry every 5 seconds, up to 10 attempts
    if (times > 10) {
      return null;
    }
    return Math.min(times * 500, 5000);
  },
});

redis.on('connect', () => {
  isRedisConnected = true;
  logger.info('Connected to Redis cluster successfully.');
});

redis.on('ready', () => {
  isRedisConnected = true;
});

redis.on('error', (err) => {
  isRedisConnected = false;
  // Non-fatal warning in development to avoid crashing if Redis is not started
  logger.warn('Redis connection event error; falling back to in-memory rate limiting', {
    message: err.message,
  });
});

redis.on('close', () => {
  isRedisConnected = false;
});

// Attempt connection asynchronously on boot
redis.connect().catch((err) => {
  logger.warn('Initial Redis connection not established (will retry or use fallback cache)', {
    error: err.message,
  });
});
