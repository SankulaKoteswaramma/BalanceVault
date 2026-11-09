import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './middleware/correlationId';
import { errorHandler } from './middleware/errorHandler';
import { createRateLimiter } from './middleware/rateLimiter';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { onboardingRouter } from './routes/onboarding.routes';
import { accountRouter } from './routes/account.routes';
import { adminRouter } from './routes/admin.routes';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  // 1. Edge & Transport Security Headers
  app.use(helmet({
    contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
  }));

  // 2. Strict Cross-Origin Resource Sharing with automatic trailing slash normalization
  const allowedOrigin = config.FRONTEND_URL ? config.FRONTEND_URL.replace(/\/+$/, '') : '*';

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, health probes)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');

      // Allow configured frontend URL or wildcard
      if (allowedOrigin === '*' || cleanOrigin === allowedOrigin) {
        return callback(null, true);
      }
      // Allow localhost and 127.0.0.1 on any port for local development
      if (cleanOrigin.startsWith('http://localhost:') || cleanOrigin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      // Allow any Vercel deployment domains
      if (cleanOrigin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID', 'Idempotency-Key'],
  }));

  // 3. Body parsers with payload size limits to guard against DoS
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 4. Traceability & Correlation Tracking
  app.use(correlationIdMiddleware);

  // 5. System Probes
  app.use(healthRouter);

  // 6. Rate Limiters
  const authRateLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_AUTH_WINDOW_MS,
    max: config.RATE_LIMIT_AUTH_MAX,
    keyPrefix: 'auth',
    message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
  });

  const apiRateLimiter = createRateLimiter({
    windowMs: config.RATE_LIMIT_API_WINDOW_MS,
    max: config.RATE_LIMIT_API_MAX,
    keyPrefix: 'api',
  });

  // 7. API Routes
  app.use('/api/auth', authRateLimiter, authRouter);
  app.use('/api/onboarding', apiRateLimiter, onboardingRouter);
  app.use('/api/accounts', apiRateLimiter, accountRouter);
  app.use('/api/admin', apiRateLimiter, adminRouter);

  // 8. 404 Route Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Endpoint '${req.method} ${req.path}' not found`,
      correlationId: req.correlationId,
    });
  });

  // 9. Centralized Error Handling
  app.use(errorHandler);

  return app;
};
