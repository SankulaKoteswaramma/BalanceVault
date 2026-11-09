import { PrismaClient, Role, UserStatus, OnboardingStatus, AccountStatus, AccountType, TransactionStatus, LedgerEntryType, AuditOutcome } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BalanceVault demonstration data...');

  // 1. Clean existing records in developmental environment
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.account.deleteMany();
  await prisma.onboardingApplication.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const superAdminPasswordHash = await bcrypt.hash('VaultAdmin@2026!', 12);
  const complianceAdminPasswordHash = await bcrypt.hash('Compliance@2026!', 12);
  const customerPasswordHash = await bcrypt.hash('CustomerPass@2026!', 12);
  const applicantPasswordHash = await bcrypt.hash('ApplicantPass@2026!', 12);

  // 2. Create Super Administrator
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@balancevault.com',
      passwordHash: superAdminPasswordHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          fullName: 'Chief Systems Administrator',
          phoneNumber: '+1-555-0100',
          address: '100 Security Boulevard, Suite 500, New York, NY',
        },
      },
    },
  });

  // 3. Create Compliance Administrator
  const complianceAdmin = await prisma.user.create({
    data: {
      email: 'compliance.officer@balancevault.com',
      passwordHash: complianceAdminPasswordHash,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          fullName: 'Senior Compliance Officer',
          phoneNumber: '+1-555-0101',
          address: '100 Security Boulevard, Suite 510, New York, NY',
        },
      },
    },
  });

  // 4. Create Fully Approved Customer with Active Account
  const approvedCustomer = await prisma.user.create({
    data: {
      email: 'alice.customer@balancevault.com',
      passwordHash: customerPasswordHash,
      role: Role.ACCOUNT_HOLDER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          fullName: 'Alice Walker',
          phoneNumber: '+1-555-0102',
          dateOfBirth: '1992-04-18',
          address: '742 Evergreen Terrace, Springfield, OR',
          nationalIdMasked: '***-**-8492',
        },
      },
      onboardingApplication: {
        create: {
          status: OnboardingStatus.APPROVED,
          submittedAt: new Date(Date.now() - 86400000 * 3),
          reviewedAt: new Date(Date.now() - 86400000 * 2),
          reviewerId: complianceAdmin.id,
          reviewNotes: 'Verified national passport and utility statement. KYC passed.',
          submittedData: {
            employmentStatus: 'EMPLOYED',
            annualIncome: '$75,000 - $150,000',
            sourceOfFunds: 'Software Engineering Salary',
            maskedId: '***-**-8492',
          },
        },
      },
      accounts: {
        create: [
          {
            accountNumber: 'BV-8492-1001',
            accountType: AccountType.CHECKING,
            status: AccountStatus.ACTIVE,
            currency: 'USD',
            balance: 24500.00,
          },
          {
            accountNumber: 'BV-8492-1002',
            accountType: AccountType.SAVINGS,
            status: AccountStatus.ACTIVE,
            currency: 'USD',
            balance: 50000.00,
          },
        ],
      },
    },
    include: { accounts: true },
  });

  // 5. Create Pending Applicant awaiting Review
  const pendingCustomer = await prisma.user.create({
    data: {
      email: 'bob.applicant@balancevault.com',
      passwordHash: applicantPasswordHash,
      role: Role.ACCOUNT_HOLDER,
      status: UserStatus.PENDING,
      profile: {
        create: {
          fullName: 'Robert Bob Martinez',
          phoneNumber: '+1-555-0103',
          dateOfBirth: '1988-11-23',
          address: '42 Wallaby Way, Sydney, TX',
          nationalIdMasked: '***-**-1928',
        },
      },
      onboardingApplication: {
        create: {
          status: OnboardingStatus.PENDING_REVIEW,
          submittedAt: new Date(Date.now() - 3600000 * 2),
          submittedData: {
            employmentStatus: 'SELF_EMPLOYED',
            annualIncome: '$150,000+',
            sourceOfFunds: 'Consulting Practice',
            maskedId: '***-**-1928',
          },
        },
      },
    },
  });

  // 6. Record Double-Entry Demonstration Transaction
  const checkingAcc = approvedCustomer.accounts[0];
  const savingsAcc = approvedCustomer.accounts[1];

  const demoTx = await prisma.transaction.create({
    data: {
      idempotencyKey: 'idem_seed_demo_transfer_001',
      referenceNumber: 'TX-INIT8492',
      description: 'Initial demonstration liquidity transfer from Checking to Savings',
      status: TransactionStatus.POSTED,
      entries: {
        create: [
          {
            accountId: checkingAcc.id,
            entryType: LedgerEntryType.DEBIT,
            amount: 500.00,
            balanceAfter: 24500.00,
          },
          {
            accountId: savingsAcc.id,
            entryType: LedgerEntryType.CREDIT,
            amount: 500.00,
            balanceAfter: 50000.00,
          },
        ],
      },
    },
  });

  // 7. Seed Initial Immutable Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: superAdmin.id,
        actorRole: Role.SUPER_ADMIN,
        action: 'ADMIN_BOOTSTRAPPED',
        targetEntity: 'User',
        targetId: superAdmin.id,
        metadata: { email: superAdmin.email },
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        actorId: complianceAdmin.id,
        actorRole: Role.ADMIN,
        action: 'ONBOARDING_APPROVED',
        targetEntity: 'OnboardingApplication',
        targetId: approvedCustomer.id,
        metadata: { applicantEmail: approvedCustomer.email, provisionedAccounts: 2 },
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        actorId: approvedCustomer.id,
        actorRole: Role.ACCOUNT_HOLDER,
        action: 'FUNDS_TRANSFERRED',
        targetEntity: 'Transaction',
        targetId: demoTx.id,
        metadata: { amount: 500.00, referenceNumber: demoTx.referenceNumber },
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        actorId: pendingCustomer.id,
        actorRole: Role.ACCOUNT_HOLDER,
        action: 'ONBOARDING_SUBMITTED',
        targetEntity: 'OnboardingApplication',
        targetId: pendingCustomer.id,
        metadata: { email: pendingCustomer.email },
        outcome: AuditOutcome.SUCCESS,
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    ],
  });

  console.log('Demonstration data seeded successfully!');
  console.log('\n--- BalanceVault Demo Credentials ---');
  console.log('Super Administrator: superadmin@balancevault.com / VaultAdmin@2026!');
  console.log('Compliance Officer:   compliance.officer@balancevault.com / Compliance@2026!');
  console.log('Approved Customer:    alice.customer@balancevault.com / CustomerPass@2026!');
  console.log('Pending Applicant:    bob.applicant@balancevault.com / ApplicantPass@2026!');
  console.log('-------------------------------------\n');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
