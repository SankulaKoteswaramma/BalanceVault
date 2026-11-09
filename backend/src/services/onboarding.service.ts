import { prisma } from '../prisma';
import { OnboardingStatus, UserStatus, AccountStatus, AccountType, Role, AuditOutcome } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';

export interface SubmitOnboardingDTO {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  nationalIdNumber: string;
  employmentStatus: string;
  annualIncome: string;
  sourceOfFunds: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface ReviewOnboardingDTO {
  reviewerId: string;
  reviewerRole: Role;
  applicationId: string;
  decision: 'APPROVE' | 'REJECT';
  notes: string;
  ipAddress?: string;
  correlationId?: string;
}

export class OnboardingService {
  public static async submit(dto: SubmitOnboardingDTO) {
    const app = await prisma.onboardingApplication.findUnique({
      where: { userId: dto.userId },
      include: { user: true },
    });

    if (!app) {
      throw new AppError('Onboarding record not found for user.', 404);
    }

    if (app.status === OnboardingStatus.PENDING_REVIEW) {
      throw new AppError('An onboarding application is already pending review.', 400);
    }

    if (app.status === OnboardingStatus.APPROVED) {
      throw new AppError('Onboarding is already approved for this account.', 400);
    }

    // Mask National ID for storage security
    const maskedId = dto.nationalIdNumber.length > 4 
      ? `***-**-${dto.nationalIdNumber.slice(-4)}`
      : '***-**-****';

    const updatedApp = await prisma.$transaction(async (tx) => {
      // Update UserProfile
      await tx.userProfile.update({
        where: { userId: dto.userId },
        data: {
          fullName: dto.fullName.trim(),
          dateOfBirth: dto.dateOfBirth,
          address: dto.address.trim(),
          nationalIdMasked: maskedId,
        },
      });

      // Update Onboarding Application state to PENDING_REVIEW
      const updated = await tx.onboardingApplication.update({
        where: { userId: dto.userId },
        data: {
          status: OnboardingStatus.PENDING_REVIEW,
          submittedAt: new Date(),
          submittedData: {
            employmentStatus: dto.employmentStatus,
            annualIncome: dto.annualIncome,
            sourceOfFunds: dto.sourceOfFunds,
            maskedId,
          },
        },
      });

      return updated;
    });

    await AuditService.record({
      actorId: dto.userId,
      actorRole: Role.ACCOUNT_HOLDER,
      action: 'ONBOARDING_SUBMITTED',
      targetEntity: 'OnboardingApplication',
      targetId: updatedApp.id,
      ipAddress: dto.ipAddress,
      correlationId: dto.correlationId,
      outcome: AuditOutcome.SUCCESS,
    });

    return updatedApp;
  }

  public static async getMyOnboarding(userId: string) {
    const app = await prisma.onboardingApplication.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!app) {
      throw new AppError('Onboarding record not found.', 404);
    }

    return app;
  }

  public static async listApplications(filter?: { status?: OnboardingStatus }) {
    return prisma.onboardingApplication.findMany({
      where: filter?.status ? { status: filter.status } : undefined,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  public static async getApplicationById(id: string) {
    const app = await prisma.onboardingApplication.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
      },
    });

    if (!app) {
      throw new AppError('Onboarding application not found.', 404);
    }

    return app;
  }

  public static async review(dto: ReviewOnboardingDTO) {
    const app = await prisma.onboardingApplication.findUnique({
      where: { id: dto.applicationId },
      include: { user: true },
    });

    if (!app) {
      throw new AppError('Onboarding application not found.', 404);
    }

    if (app.userId === dto.reviewerId) {
      throw new AppError('Forbidden: Administrators cannot approve or reject their own onboarding application.', 403);
    }

    if (app.status !== OnboardingStatus.PENDING_REVIEW) {
      throw new AppError(`Cannot review application with status '${app.status}'. Must be PENDING_REVIEW.`, 400);
    }

    const isApproval = dto.decision === 'APPROVE';
    const nextStatus = isApproval ? OnboardingStatus.APPROVED : OnboardingStatus.REJECTED;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update application status
      const updatedApp = await tx.onboardingApplication.update({
        where: { id: app.id },
        data: {
          status: nextStatus,
          reviewerId: dto.reviewerId,
          reviewNotes: dto.notes.trim(),
          reviewedAt: new Date(),
        },
      });

      // 2. If approved, activate user and create an initial Account
      if (isApproval) {
        await tx.user.update({
          where: { id: app.userId },
          data: { status: UserStatus.ACTIVE },
        });

        // Generate synthetic account number: BV-XXXX-XXXX
        const randPart = Math.floor(10000000 + Math.random() * 90000000).toString();
        const accountNumber = `BV-${randPart.slice(0, 4)}-${randPart.slice(4)}`;

        const createdAccount = await tx.account.create({
          data: {
            accountNumber,
            userId: app.userId,
            accountType: AccountType.CHECKING,
            status: AccountStatus.ACTIVE,
            currency: 'USD',
            balance: 0.00,
          },
        });

        return { app: updatedApp, account: createdAccount };
      }

      return { app: updatedApp, account: null };
    });

    await AuditService.record({
      actorId: dto.reviewerId,
      actorRole: dto.reviewerRole,
      action: isApproval ? 'ONBOARDING_APPROVED' : 'ONBOARDING_REJECTED',
      targetEntity: 'OnboardingApplication',
      targetId: app.id,
      metadata: {
        applicantUserId: app.userId,
        decision: dto.decision,
        notes: dto.notes,
        createdAccountId: result.account?.id,
      },
      ipAddress: dto.ipAddress,
      correlationId: dto.correlationId,
      outcome: AuditOutcome.SUCCESS,
    });

    return result;
  }
}
