import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { AuditService } from '../services/audit.service';
import { AuditOutcome } from '@prisma/client';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      
      const result = await AuthService.register({
        fullName: validated.fullName,
        email: validated.email,
        phoneNumber: validated.phoneNumber,
        password: validated.password,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);

      const result = await AuthService.login({
        email: validated.email,
        password: validated.password,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized', correlationId: req.correlationId });
        return;
      }

      const user = await AuthService.getMe(req.user.id);

      res.status(200).json({
        success: true,
        data: user,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await AuditService.record({
          actorId: req.user.id,
          actorRole: req.user.role,
          action: 'LOGOUT',
          targetEntity: 'User',
          targetId: req.user.id,
          ipAddress: req.ip,
          correlationId: req.correlationId,
          outcome: AuditOutcome.SUCCESS,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }
}
