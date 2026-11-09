import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../prisma';
import { Role, UserStatus, OnboardingStatus, AccountStatus, AccountType, TransactionStatus, LedgerEntryType, Prisma } from '@prisma/client';
import { signAccessToken } from '../utils/security';

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

describe('Onboarding & Financial Account Integrity Test Suite', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Onboarding Self-Approval Prevention', () => {
    it('should block an admin from approving their own onboarding application with 403', async () => {
      const adminId = 'admin-user-id';
      const token = signAccessToken({
        id: adminId,
        email: 'admin@vault.com',
        role: Role.ADMIN,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: adminId,
        email: 'admin@vault.com',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      } as any);

      // Application belongs to the same adminId
      vi.mocked(prisma.onboardingApplication.findUnique).mockResolvedValueOnce({
        id: 'app-1',
        userId: adminId,
        status: OnboardingStatus.PENDING_REVIEW,
      } as any);

      const response = await request(app)
        .patch('/api/onboarding/admin/applications/app-1/review')
        .set('Authorization', `Bearer ${token}`)
        .send({
          decision: 'APPROVE',
          notes: 'Self approval attempt',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Administrators cannot approve or reject their own onboarding application.');
    });
  });

  describe('Double-Entry Ledger Transfers & Idempotency', () => {
    it('should prevent double deduction when identical idempotency key is replayed', async () => {
      const userId = 'user-123';
      const token = signAccessToken({
        id: userId,
        email: 'sender@vault.com',
        role: Role.ACCOUNT_HOLDER,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: userId,
        email: 'sender@vault.com',
        role: Role.ACCOUNT_HOLDER,
        status: UserStatus.ACTIVE,
      } as any);

      // Simulate transaction already exists in database
      const existingTx = {
        id: 'tx-existing-uuid',
        idempotencyKey: 'idem-key-99999',
        referenceNumber: 'TX-ABC12345',
        description: 'Payment for invoice',
        status: TransactionStatus.POSTED,
        createdAt: new Date(),
        entries: [],
      };

      vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce(existingTx as any);

      const response = await request(app)
        .post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
          destinationAccountId: '660e8400-e29b-41d4-a716-446655440000',
          amount: 50.0,
          description: 'Payment for invoice',
          idempotencyKey: 'idem-key-99999',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.idempotentReplay).toBe(true);
      expect(response.body.data.id).toBe('tx-existing-uuid');
      // Verify no new transaction was created and balances were not updated
      expect(prisma.account.update).not.toHaveBeenCalled();
    });

    it('should reject transfer when source account has insufficient funds', async () => {
      const userId = 'user-123';
      const token = signAccessToken({
        id: userId,
        email: 'sender@vault.com',
        role: Role.ACCOUNT_HOLDER,
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: userId,
        email: 'sender@vault.com',
        role: Role.ACCOUNT_HOLDER,
        status: UserStatus.ACTIVE,
      } as any);

      vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce(null);

      // Source account only has 10.00
      vi.mocked(prisma.account.findUnique)
        .mockResolvedValueOnce({
          id: '550e8400-e29b-41d4-a716-446655440000',
          userId: userId,
          status: AccountStatus.ACTIVE,
          balance: new Prisma.Decimal(10.0),
        } as any)
        .mockResolvedValueOnce({
          id: '660e8400-e29b-41d4-a716-446655440000',
          userId: 'other-user',
          status: AccountStatus.ACTIVE,
          balance: new Prisma.Decimal(100.0),
        } as any);

      const response = await request(app)
        .post('/api/accounts/transfer')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
          destinationAccountId: '660e8400-e29b-41d4-a716-446655440000',
          amount: 500.0, // Attempting to transfer more than balance
          description: 'Excessive transfer attempt',
          idempotencyKey: 'idem-key-insufficient',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient funds for transfer.');
    });
  });
});
