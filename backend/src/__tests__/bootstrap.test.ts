import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BootstrapService } from '../services/bootstrap.service';
import { prisma } from '../prisma';
import { Role, UserStatus } from '@prisma/client';
import { config } from '../config';

vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('First-Administrator Bootstrap Security Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject bootstrap when secret is invalid', async () => {
    await expect(
      BootstrapService.bootstrapFirstAdmin({
        email: 'admin@vault.com',
        password: 'Password123!',
        fullName: 'Admin User',
        phoneNumber: '+15551234567',
        bootstrapSecret: 'INVALID_SECRET_KEY',
      })
    ).rejects.toThrow('Unauthorized bootstrap: Invalid bootstrap secret.');
  });

  it('should reject bootstrap when an administrator already exists in the system', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({
      id: 'existing-admin-uuid',
      email: 'existing@vault.com',
      passwordHash: 'hash',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      BootstrapService.bootstrapFirstAdmin({
        email: 'newadmin@vault.com',
        password: 'Password123!',
        fullName: 'New Admin',
        phoneNumber: '+15551234567',
        bootstrapSecret: config.BOOTSTRAP_SECRET,
      })
    ).rejects.toThrow('Bootstrap disabled: An administrator already exists in the system.');
  });

  it('should reject bootstrap if password is less than 8 characters', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    await expect(
      BootstrapService.bootstrapFirstAdmin({
        email: 'admin@vault.com',
        password: 'short',
        fullName: 'Admin User',
        phoneNumber: '+15551234567',
        bootstrapSecret: config.BOOTSTRAP_SECRET,
      })
    ).rejects.toThrow('Password must be at least 8 characters long.');
  });

  it('should successfully bootstrap initial Super Admin when system is clean and secret is valid', async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'admin-123',
      email: 'superadmin@vault.com',
      passwordHash: 'hashed_pw',
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await BootstrapService.bootstrapFirstAdmin({
      email: 'superadmin@vault.com',
      password: 'StrongAdminPassword@2026',
      fullName: 'Chief Security Officer',
      phoneNumber: '+15550001111',
      bootstrapSecret: config.BOOTSTRAP_SECRET,
    });

    expect(result).toHaveProperty('id', 'admin-123');
    expect(result).toHaveProperty('role', Role.SUPER_ADMIN);
    expect(result.email).toBe('superadmin@vault.com');
  });
});
