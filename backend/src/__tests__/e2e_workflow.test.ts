import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../prisma';
import {
  Role,
  UserStatus,
  OnboardingStatus,
  AccountStatus,
  AccountType,
  TransactionStatus,
  LedgerEntryType,
  AuditOutcome,
  Prisma,
} from '@prisma/client';
import { signAccessToken } from '../utils/security';
import { config } from '../config';

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

describe('BalanceVault End-to-End Complete Lifecycle Simulation (Phase 18)', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Step 1: System Liveness & Deep Readiness probes respond accurately', async () => {
    // Liveness
    const healthRes = await request(app).get('/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body.status).toBe('UP');
    expect(healthRes.body.service).toBe('BalanceVault-API');

    // Readiness
    const readyRes = await request(app).get('/ready');
    expect(readyRes.status).toBe(200);
    expect(readyRes.body.status).toBe('UP');
    expect(readyRes.body.dependencies.database.status).toBe('UP');
  });

  it('Step 2: Customer Public Registration & Account Holder Role Enforcement', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      passwordHash: 'hashed_pw',
      role: Role.ACCOUNT_HOLDER,
      status: UserStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        id: 'prof-1',
        userId: 'e2e-user-1',
        fullName: 'Charlie Davis',
        phoneNumber: '+15559876543',
        dateOfBirth: null,
        address: null,
        nationalIdMasked: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      onboardingApplication: {
        id: 'onboard-1',
        userId: 'e2e-user-1',
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

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Charlie Davis',
        email: 'charlie@vault.com',
        phoneNumber: '+15559876543',
        password: 'VaultUser@2026!',
        passwordConfirmation: 'VaultUser@2026!',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.role).toBe('ACCOUNT_HOLDER');
    expect(regRes.body.data.token).toBeDefined();
  });

  it('Step 3: Customer Privilege Escalation Protection (Blocked with HTTP 403 on Admin Routes)', async () => {
    const customerToken = signAccessToken({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      role: Role.ACCOUNT_HOLDER,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      role: Role.ACCOUNT_HOLDER,
      status: UserStatus.ACTIVE,
    } as any);

    // Attempt to access admin metrics
    const unauthorizedRes = await request(app)
      .get('/api/admin/metrics')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.success).toBe(false);
    expect(unauthorizedRes.body.error).toContain("Access denied. Role 'ACCOUNT_HOLDER' lacks necessary privileges.");
  });

  it('Step 4: Customer KYC Submission transitions state to PENDING_REVIEW', async () => {
    const customerToken = signAccessToken({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      role: Role.ACCOUNT_HOLDER,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      role: Role.ACCOUNT_HOLDER,
      status: UserStatus.PENDING,
    } as any);

    vi.mocked(prisma.onboardingApplication.findUnique).mockResolvedValueOnce({
      id: 'onboard-1',
      userId: 'e2e-user-1',
      status: OnboardingStatus.REGISTERED,
      user: { id: 'e2e-user-1' },
    } as any);

    vi.mocked(prisma.onboardingApplication.update).mockResolvedValueOnce({
      id: 'onboard-1',
      userId: 'e2e-user-1',
      status: OnboardingStatus.PENDING_REVIEW,
      submittedAt: new Date(),
    } as any);

    const submitRes = await request(app)
      .post('/api/onboarding/submit')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Charlie Davis',
        dateOfBirth: '1990-05-20',
        address: '77 Market Boulevard, Austin, TX',
        nationalIdNumber: '987-65-4321',
        employmentStatus: 'EMPLOYED',
        annualIncome: '$75,000 - $150,000',
        sourceOfFunds: 'Software Development Salary',
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.status).toBe('PENDING_REVIEW');
  });

  it('Step 5: Admin Review & Approval automatically provisions an active Checking Account', async () => {
    const adminToken = signAccessToken({
      id: 'e2e-admin-1',
      email: 'admin@vault.com',
      role: Role.ADMIN,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'e2e-admin-1',
      email: 'admin@vault.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    } as any);

    // Application belongs to applicant Charlie (e2e-user-1)
    vi.mocked(prisma.onboardingApplication.findUnique).mockResolvedValueOnce({
      id: 'onboard-1',
      userId: 'e2e-user-1',
      status: OnboardingStatus.PENDING_REVIEW,
      user: { id: 'e2e-user-1' },
    } as any);

    vi.mocked(prisma.onboardingApplication.update).mockResolvedValueOnce({
      id: 'onboard-1',
      userId: 'e2e-user-1',
      status: OnboardingStatus.APPROVED,
      reviewerId: 'e2e-admin-1',
      reviewNotes: 'Identity confirmed via state records.',
    } as any);

    vi.mocked(prisma.account.create).mockResolvedValueOnce({
      id: 'acc-charlie-1',
      accountNumber: 'BV-9876-1234',
      userId: 'e2e-user-1',
      accountType: AccountType.CHECKING,
      status: AccountStatus.ACTIVE,
      currency: 'USD',
      balance: new Prisma.Decimal(0.00),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const reviewRes = await request(app)
      .patch('/api/onboarding/admin/applications/onboard-1/review')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVE',
        notes: 'Identity confirmed via state records.',
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.data.account).toHaveProperty('accountNumber', 'BV-9876-1234');
    expect(reviewRes.body.data.account).toHaveProperty('status', 'ACTIVE');
  });

  it('Step 6: Double-Entry Ledger Transfer & Idempotency Key Deduplication', async () => {
    const customerToken = signAccessToken({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      role: Role.ACCOUNT_HOLDER,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'e2e-user-1',
      email: 'charlie@vault.com',
      role: Role.ACCOUNT_HOLDER,
      status: UserStatus.ACTIVE,
    } as any);

    // First attempt: Transaction does not exist
    vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce(null);

    const sourceAcc = {
      id: 'acc-charlie-1',
      userId: 'e2e-user-1',
      status: AccountStatus.ACTIVE,
      balance: new Prisma.Decimal(1000.00),
    };
    const destAcc = {
      id: 'acc-dest-2',
      userId: 'other-user',
      status: AccountStatus.ACTIVE,
      balance: new Prisma.Decimal(500.00),
    };

    vi.mocked(prisma.account.findUnique)
      .mockResolvedValueOnce(sourceAcc as any)
      .mockResolvedValueOnce(destAcc as any);

    vi.mocked(prisma.account.update)
      .mockResolvedValueOnce({ ...sourceAcc, balance: new Prisma.Decimal(750.00) } as any)
      .mockResolvedValueOnce({ ...destAcc, balance: new Prisma.Decimal(750.00) } as any);

    vi.mocked(prisma.transaction.create).mockResolvedValueOnce({
      id: 'tx-e2e-1',
      idempotencyKey: 'idem-charlie-999',
      referenceNumber: 'TX-CHARLIE1',
      description: 'Vendor payment',
      status: TransactionStatus.POSTED,
      createdAt: new Date(),
      entries: [
        {
          id: 'entry-1',
          accountId: 'acc-charlie-1',
          entryType: LedgerEntryType.DEBIT,
          amount: new Prisma.Decimal(250.00),
          balanceAfter: new Prisma.Decimal(750.00),
        },
        {
          id: 'entry-2',
          accountId: 'acc-dest-2',
          entryType: LedgerEntryType.CREDIT,
          amount: new Prisma.Decimal(250.00),
          balanceAfter: new Prisma.Decimal(750.00),
        },
      ],
    } as any);

    // Initial Transfer
    const transferRes = await request(app)
      .post('/api/accounts/transfer')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
        destinationAccountId: '660e8400-e29b-41d4-a716-446655440000',
        amount: 250.00,
        description: 'Vendor payment',
        idempotencyKey: 'idem-charlie-999',
      });

    expect(transferRes.status).toBe(200);
    expect(transferRes.body.success).toBe(true);
    expect(transferRes.body.idempotentReplay).toBe(false);
    expect(transferRes.body.data.referenceNumber).toBe('TX-CHARLIE1');

    // Second attempt with SAME idempotency key (Replay simulation)
    vi.mocked(prisma.transaction.findUnique).mockResolvedValueOnce({
      id: 'tx-e2e-1',
      idempotencyKey: 'idem-charlie-999',
      referenceNumber: 'TX-CHARLIE1',
      description: 'Vendor payment',
      status: TransactionStatus.POSTED,
      entries: [],
    } as any);

    const replayRes = await request(app)
      .post('/api/accounts/transfer')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        sourceAccountId: '550e8400-e29b-41d4-a716-446655440000',
        destinationAccountId: '660e8400-e29b-41d4-a716-446655440000',
        amount: 250.00,
        description: 'Vendor payment',
        idempotencyKey: 'idem-charlie-999',
      });

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.idempotentReplay).toBe(true);
    expect(replayRes.body.data.id).toBe('tx-e2e-1');
  });

  it('Step 7: Admin queries Append-Only Audit Trail and inspects redacted events', async () => {
    const adminToken = signAccessToken({
      id: 'e2e-admin-1',
      email: 'admin@vault.com',
      role: Role.ADMIN,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'e2e-admin-1',
      email: 'admin@vault.com',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    } as any);

    vi.mocked(prisma.auditLog.count).mockResolvedValueOnce(3);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValueOnce([
      {
        id: 'audit-3',
        actorId: 'e2e-user-1',
        actorRole: 'ACCOUNT_HOLDER',
        action: 'FUNDS_TRANSFERRED',
        targetEntity: 'Transaction',
        targetId: 'tx-e2e-1',
        metadata: { amount: 250.00 },
        ipAddress: '127.0.0.1',
        correlationId: 'trace-1',
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(),
      },
      {
        id: 'audit-2',
        actorId: 'e2e-admin-1',
        actorRole: 'ADMIN',
        action: 'ONBOARDING_APPROVED',
        targetEntity: 'OnboardingApplication',
        targetId: 'onboard-1',
        metadata: { decision: 'APPROVE' },
        ipAddress: '127.0.0.1',
        correlationId: 'trace-2',
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(),
      },
      {
        id: 'audit-1',
        actorId: 'e2e-user-1',
        actorRole: 'ACCOUNT_HOLDER',
        action: 'USER_REGISTERED',
        targetEntity: 'User',
        targetId: 'e2e-user-1',
        metadata: { email: 'charlie@vault.com' },
        ipAddress: '127.0.0.1',
        correlationId: 'trace-3',
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(),
      },
    ] as any);

    const auditRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.data.length).toBe(3);
    expect(auditRes.body.data[0].action).toBe('FUNDS_TRANSFERRED');
  });
});
