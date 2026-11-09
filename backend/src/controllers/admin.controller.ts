import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { Role, UserStatus, AuditOutcome, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from '../services/audit.service';
import { z } from 'zod';

const updateUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.SUSPENDED, UserStatus.PENDING]),
  reason: z.string().min(3).max(255),
}).strict();

const updateUserRoleSchema = z.object({
  role: z.enum([Role.ADMIN, Role.ACCOUNT_HOLDER]),
  reason: z.string().min(3).max(255),
}).strict();

export class AdminController {
  public static async getMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [
        totalUsers,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        activeAccounts,
        suspendedAccounts,
        recentAudits,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.onboardingApplication.count({ where: { status: 'PENDING_REVIEW' } }),
        prisma.onboardingApplication.count({ where: { status: 'APPROVED' } }),
        prisma.onboardingApplication.count({ where: { status: 'REJECTED' } }),
        prisma.account.count({ where: { status: 'ACTIVE' } }),
        prisma.account.count({ where: { status: 'SUSPENDED' } }),
        prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            pendingApplications,
            approvedApplications,
            rejectedApplications,
            activeAccounts,
            suspendedAccounts,
          },
          recentActivity: recentAudits,
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const skip = (page - 1) * limit;

      const role = req.query.role as Role | undefined;
      const status = req.query.status as UserStatus | undefined;
      const search = req.query.search as string | undefined;

      const where: Prisma.UserWhereInput = {};
      if (role) where.role = role;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { fullName: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            profile: true,
            onboardingApplication: {
              select: { status: true, submittedAt: true, reviewedAt: true },
            },
            accounts: {
              select: { id: true, accountNumber: true, status: true, balance: true },
            },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: users,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          profile: true,
          onboardingApplication: true,
          accounts: true,
        },
      });

      if (!user) {
        throw new AppError('User not found.', 404);
      }

      res.status(200).json({
        success: true,
        data: user,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const validated = updateUserStatusSchema.parse(req.body);

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        throw new AppError('User not found.', 404);
      }

      // Protection: cannot suspend SUPER_ADMIN unless actor is SUPER_ADMIN and not self
      if (targetUser.role === Role.SUPER_ADMIN && req.user.role !== Role.SUPER_ADMIN) {
        throw new AppError('Access denied: Cannot modify Super Administrator account.', 403);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { status: validated.status },
      });

      await AuditService.record({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'USER_STATUS_CHANGED',
        targetEntity: 'User',
        targetId: id,
        metadata: {
          previousStatus: targetUser.status,
          newStatus: validated.status,
          reason: validated.reason,
        },
        ipAddress: req.ip,
        correlationId: req.correlationId,
        outcome: AuditOutcome.SUCCESS,
      });

      res.status(200).json({
        success: true,
        message: `User status changed to ${validated.status}`,
        data: updated,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Strict requirement: Only SUPER_ADMIN can assign/modify roles
      if (req.user.role !== Role.SUPER_ADMIN) {
        throw new AppError('Access denied: Only Super Administrators can alter user roles.', 403);
      }

      const id = req.params.id as string;
      const validated = updateUserRoleSchema.parse(req.body);

      const targetUser = await prisma.user.findUnique({ where: { id } });
      if (!targetUser) {
        throw new AppError('User not found.', 404);
      }

      if (targetUser.role === Role.SUPER_ADMIN) {
        throw new AppError('Cannot demote or alter primary Super Administrator.', 403);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role: validated.role },
      });

      await AuditService.record({
        actorId: req.user.id,
        actorRole: req.user.role,
        action: 'ROLE_CHANGED',
        targetEntity: 'User',
        targetId: id,
        metadata: {
          previousRole: targetUser.role,
          newRole: validated.role,
          reason: validated.reason,
        },
        ipAddress: req.ip,
        correlationId: req.correlationId,
        outcome: AuditOutcome.SUCCESS,
      });

      res.status(200).json({
        success: true,
        message: `User role updated to ${validated.role}`,
        data: updated,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
      const skip = (page - 1) * limit;

      const action = req.query.action as string | undefined;
      const targetEntity = req.query.targetEntity as string | undefined;

      const where: Prisma.AuditLogWhereInput = {};
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (targetEntity) where.targetEntity = targetEntity;

      const [total, logs] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }
}
