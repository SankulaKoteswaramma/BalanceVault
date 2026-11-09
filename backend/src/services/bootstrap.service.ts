import { prisma } from '../prisma';
import { hashPassword } from '../utils/security';
import { AuditService } from './audit.service';
import { Role, UserStatus, AuditOutcome } from '@prisma/client';
import { config } from '../config';

export interface BootstrapInput {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  bootstrapSecret: string;
}

export class BootstrapService {
  public static async bootstrapFirstAdmin(input: BootstrapInput): Promise<{
    id: string;
    email: string;
    role: Role;
  }> {
    // 1. Verify Secret
    if (!input.bootstrapSecret || input.bootstrapSecret !== config.BOOTSTRAP_SECRET) {
      await AuditService.record({
        actorId: null,
        actorRole: null,
        action: 'BOOTSTRAP_FAILED_INVALID_SECRET',
        targetEntity: 'System',
        targetId: 'BOOTSTRAP',
        metadata: { attemptedEmail: input.email },
        outcome: AuditOutcome.FAILURE,
      });
      throw new Error('Unauthorized bootstrap: Invalid bootstrap secret.');
    }

    // 2. Atomic check: verify NO admin or super_admin exists in database
    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
      },
    });

    if (existingAdmin) {
      await AuditService.record({
        actorId: null,
        actorRole: null,
        action: 'BOOTSTRAP_REJECTED_ADMIN_EXISTS',
        targetEntity: 'System',
        targetId: 'BOOTSTRAP',
        metadata: { existingAdminId: existingAdmin.id },
        outcome: AuditOutcome.FAILURE,
      });
      throw new Error('Bootstrap disabled: An administrator already exists in the system.');
    }

    // 3. Check if email is already taken
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Bootstrap failed: Specified email is already registered.');
    }

    // 4. Strong Password Policy validation
    if (input.password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const passwordHash = await hashPassword(input.password);

    // 5. Execute creation within a transaction
    const newAdmin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
          profile: {
            create: {
              fullName: input.fullName,
              phoneNumber: input.phoneNumber,
            },
          },
        },
      });

      return user;
    });

    // 6. Record audit event
    await AuditService.record({
      actorId: newAdmin.id,
      actorRole: Role.SUPER_ADMIN,
      action: 'ADMIN_BOOTSTRAPPED',
      targetEntity: 'User',
      targetId: newAdmin.id,
      metadata: { email: newAdmin.email, role: Role.SUPER_ADMIN },
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      id: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role,
    };
  }
}
