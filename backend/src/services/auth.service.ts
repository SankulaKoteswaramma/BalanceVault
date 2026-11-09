import { prisma } from '../prisma';
import { hashPassword, verifyPassword, signAccessToken } from '../utils/security';
import { AuditService } from './audit.service';
import { Role, UserStatus, OnboardingStatus, AuditOutcome } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface RegisterDTO {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
  ipAddress?: string;
  correlationId?: string;
}

export class AuthService {
  public static async register(dto: RegisterDTO) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError('An account with this email address already exists.', 409);
    }

    const passwordHash = await hashPassword(dto.password);

    // Create user, profile, and initial onboarding application in atomic transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.ACCOUNT_HOLDER, // STRICT: Public registration can NEVER create an Admin!
          status: UserStatus.PENDING,
          profile: {
            create: {
              fullName: dto.fullName.trim(),
              phoneNumber: dto.phoneNumber.trim(),
            },
          },
          onboardingApplication: {
            create: {
              status: OnboardingStatus.REGISTERED,
            },
          },
        },
        include: {
          profile: true,
          onboardingApplication: true,
        },
      });

      return newUser;
    });

    // Record audit event
    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: 'USER_REGISTERED',
      targetEntity: 'User',
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
      ipAddress: dto.ipAddress,
      correlationId: dto.correlationId,
      outcome: AuditOutcome.SUCCESS,
    });

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        onboardingStatus: user.onboardingApplication?.status,
      },
    };
  }

  public static async login(dto: LoginDTO) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        profile: true,
        onboardingApplication: true,
      },
    });

    if (!user) {
      await AuditService.record({
        actorId: null,
        actorRole: null,
        action: 'LOGIN_FAILED',
        targetEntity: 'User',
        targetId: 'UNKNOWN',
        metadata: { attemptedEmail: normalizedEmail },
        ipAddress: dto.ipAddress,
        correlationId: dto.correlationId,
        outcome: AuditOutcome.FAILURE,
      });
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status === UserStatus.SUSPENDED) {
      await AuditService.record({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_BLOCKED_SUSPENDED',
        targetEntity: 'User',
        targetId: user.id,
        ipAddress: dto.ipAddress,
        correlationId: dto.correlationId,
        outcome: AuditOutcome.FAILURE,
      });
      throw new AppError('Account is suspended. Please contact customer support.', 403);
    }

    const isValid = await verifyPassword(dto.password, user.passwordHash);

    if (!isValid) {
      await AuditService.record({
        actorId: user.id,
        actorRole: user.role,
        action: 'LOGIN_FAILED_BAD_PASSWORD',
        targetEntity: 'User',
        targetId: user.id,
        ipAddress: dto.ipAddress,
        correlationId: dto.correlationId,
        outcome: AuditOutcome.FAILURE,
      });
      throw new AppError('Invalid email or password.', 401);
    }

    await AuditService.record({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGIN_SUCCESS',
      targetEntity: 'User',
      targetId: user.id,
      ipAddress: dto.ipAddress,
      correlationId: dto.correlationId,
      outcome: AuditOutcome.SUCCESS,
    });

    const token = signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile,
        onboardingStatus: user.onboardingApplication?.status,
      },
    };
  }

  public static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        onboardingApplication: true,
        accounts: true,
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile,
      onboardingStatus: user.onboardingApplication?.status,
      accounts: user.accounts,
    };
  }
}
