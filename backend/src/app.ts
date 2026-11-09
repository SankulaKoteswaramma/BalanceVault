import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { correlationIdMiddleware } from './middleware/correlationId';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './routes/health.routes';
import { config } from './config';

export const createApp = (): Express => {
  const app = express();

  // 1. Edge & Transport Security Headers
  app.use(helmet({
    contentSecurityPolicy: config.NODE_ENV === 'production' ? undefined : false,
  }));

  // 2. Strict Cross-Origin Resource Sharing
  app.use(cors({
    origin: config.FRONTEND_URL,
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

  // 6. Centralized Error Handling
  app.use(errorHandler);

  return app;
};
