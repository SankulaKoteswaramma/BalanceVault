import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../prisma';
import { Role, UserStatus, OnboardingStatus } from '@prisma/client';
import { hashPassword, signAccessToken } from '../utils/security';

vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      update: vi.fn(),
    },
    onboardingApplication: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Authentication & RBAC Security Test Suite', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration if passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alice Walker',
          email: 'alice@example.com',
          phoneNumber: '+15551112233',
          password: 'Password123!',
          passwordConfirmation: 'MismatchPassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject registration if password is weak (missing special character)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alice Walker',
          email: 'alice@example.com',
          phoneNumber: '+15551112233',
          password: 'WeakPassword1',
          passwordConfirmation: 'WeakPassword1',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should successfully register an account holder with role ACCOUNT_HOLDER', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.user.create).mockResolvedValueOnce({
        id: 'user-uuid-1',
        email: 'alice@example.com',
        passwordHash: 'hashed',
        role: Role.ACCOUNT_HOLDER,
        status: UserStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: {
          id: 'prof-1',
          userId: 'user-uuid-1',
          fullName: 'Alice Walker',
          phoneNumber: '+15551112233',
          dateOfBirth: null,
          address: null,
          nationalIdMasked: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        onboardingApplication: {
          id: 'onboard-1',
          userId: 'user-uuid-1',
          status: OnboardingStatus.REGISTERED,
          submittedData: null,
          reviewerId: null,
          reviewNotes: null,
          reviewedAt: null,
          submittedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      } as any);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Alice Walker',
          email: 'alice@example.com',
          phoneNumber: '+15551112233',
          password: 'SecurePassword123!',
          passwordConfirmation: 'SecurePassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(Role.ACCOUNT_HOLDER);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('RBAC & Privilege Escalation Prevention', () => {
    it('should deny ACCOUNT_HOLDER access to admin metrics endpoint with 403', async () => {
      const userToken = signAccessToken({
        id: 'user-1',
        email: 'user@example.com',
        role: Role.ACCOUNT_HOLDER,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'user-1',
        email: 'user@example.com',
        role: Role.ACCOUNT_HOLDER,
        status: UserStatus.ACTIVE,
      } as any);

      const response = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Access denied. Role 'ACCOUNT_HOLDER' lacks necessary privileges.");
    });

    it('should deny ADMIN access to SUPER_ADMIN role assignment endpoint with 403', async () => {
      const adminToken = signAccessToken({
        id: 'admin-1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: 'admin-1',
        email: 'admin@example.com',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      } as any);

      const response = await request(app)
        .patch('/api/admin/users/target-user-id/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'ADMIN',
          reason: 'Attempted privilege escalation by normal admin',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Access denied. Role 'ADMIN' lacks necessary privileges.");
    });

    it('should allow SUPER_ADMIN access to role assignment', async () => {
      const superAdminToken = signAccessToken({
        id: 'super-1',
        email: 'super@example.com',
        role: Role.SUPER_ADMIN,
      });

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce({
          id: 'super-1',
          email: 'super@example.com',
          role: Role.SUPER_ADMIN,
          status: UserStatus.ACTIVE,
        } as any)
        .mockResolvedValueOnce({
          id: 'target-1',
          email: 'staff@example.com',
          role: Role.ACCOUNT_HOLDER,
          status: UserStatus.ACTIVE,
        } as any);

      vi.mocked(prisma.user.update).mockResolvedValueOnce({
        id: 'target-1',
        email: 'staff@example.com',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      } as any);

      const response = await request(app)
        .patch('/api/admin/users/target-1/role')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          role: 'ADMIN',
          reason: 'Legitimate promotion to staff admin',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe(Role.ADMIN);
    });
  });
});
