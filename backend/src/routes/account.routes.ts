import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const accountRouter = Router();

// Account Holder endpoints
accountRouter.get('/my', authenticate, AccountController.getMyAccounts);
accountRouter.get('/:id', authenticate, AccountController.getAccountById);
accountRouter.post('/transfer', authenticate, AccountController.transfer);

// Admin endpoints
accountRouter.get(
  '/admin/all',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AccountController.listAllAccounts
);

accountRouter.patch(
  '/admin/:id/status',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AccountController.updateStatus
);
