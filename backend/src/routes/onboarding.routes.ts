import { Router } from 'express';
import { OnboardingController } from '../controllers/onboarding.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const onboardingRouter = Router();

// Account Holder endpoints
onboardingRouter.post('/submit', authenticate, OnboardingController.submit);
onboardingRouter.get('/me', authenticate, OnboardingController.getMyOnboarding);

// Admin endpoints
onboardingRouter.get(
  '/admin/applications',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  OnboardingController.listApplications
);

onboardingRouter.get(
  '/admin/applications/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  OnboardingController.getApplicationById
);

onboardingRouter.patch(
  '/admin/applications/:id/review',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  OnboardingController.review
);
