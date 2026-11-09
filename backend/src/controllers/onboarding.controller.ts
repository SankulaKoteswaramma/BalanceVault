import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from '../services/onboarding.service';
import { submitOnboardingSchema, reviewOnboardingSchema } from '../validators/onboarding.validator';
import { OnboardingStatus } from '@prisma/client';

export class OnboardingController {
  public static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validated = submitOnboardingSchema.parse(req.body);

      const result = await OnboardingService.submit({
        userId: req.user.id,
        ...validated,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        message: 'Onboarding application submitted for review',
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const result = await OnboardingService.getMyOnboarding(req.user.id);

      res.status(200).json({
        success: true,
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as OnboardingStatus | undefined;
      const result = await OnboardingService.listApplications(status ? { status } : undefined);

      res.status(200).json({
        success: true,
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const result = await OnboardingService.getApplicationById(id);

      res.status(200).json({
        success: true,
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const validated = reviewOnboardingSchema.parse(req.body);

      const result = await OnboardingService.review({
        reviewerId: req.user.id,
        reviewerRole: req.user.role,
        applicationId: id,
        decision: validated.decision,
        notes: validated.notes,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        message: `Application successfully ${validated.decision.toLowerCase()}ed`,
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }
}
