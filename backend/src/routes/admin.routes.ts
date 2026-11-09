import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';

export const adminRouter = Router();

// Dashboard overview
adminRouter.get(
  '/metrics',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getMetrics
);

// User Management
adminRouter.get(
  '/users',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.listUsers
);

adminRouter.get(
  '/users/:id',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.getUserById
);

adminRouter.patch(
  '/users/:id/status',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.updateUserStatus
);

adminRouter.patch(
  '/users/:id/role',
  authenticate,
  requireRole(Role.SUPER_ADMIN), // Super Admin ONLY
  AdminController.updateUserRole
);

// Audit Log Viewer
adminRouter.get(
  '/audit-logs',
  authenticate,
  requireRole(Role.ADMIN, Role.SUPER_ADMIN),
  AdminController.listAuditLogs
);
