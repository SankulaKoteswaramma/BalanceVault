import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { config } from '../config';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const correlationId = req.correlationId || 'unknown';

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      correlationId,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      correlationId,
    });
    return;
  }

  logger.error('Unhandled Server Exception', err, {
    path: req.path,
    method: req.method,
    correlationId,
  });

  const message = config.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(500).json({
    success: false,
    error: message,
    correlationId,
  });
};
