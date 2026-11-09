import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incomingId = req.headers['x-correlation-id'];
  const correlationId = typeof incomingId === 'string' && incomingId.trim() !== '' ? incomingId : uuidv4();
  
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);
  next();
};
