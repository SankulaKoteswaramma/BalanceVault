import { prisma } from '../prisma';
import { AccountStatus, Role, LedgerEntryType, TransactionStatus, AuditOutcome, Prisma } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { AuditService } from './audit.service';
import { v4 as uuidv4 } from 'uuid';

export interface TransferDTO {
  actorUserId: string;
  actorRole: Role;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: number;
  description: string;
  idempotencyKey: string;
  ipAddress?: string;
  correlationId?: string;
}

export class AccountService {
  public static async getAccountsForUser(userId: string) {
    return prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        ledgerEntries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  public static async getAccountById(accountId: string, requesterUserId: string, requesterRole: Role) {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { fullName: true } },
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    // IDOR Protection: regular user can only view their own account
    if (requesterRole === Role.ACCOUNT_HOLDER && account.userId !== requesterUserId) {
      throw new AppError('Access denied: You do not have permission to view this account.', 403);
    }

    return account;
  }

  public static async listAllAccounts(options?: {
    status?: AccountStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AccountWhereInput = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.search) {
      where.OR = [
        { accountNumber: { contains: options.search, mode: 'insensitive' } },
        { user: { email: { contains: options.search, mode: 'insensitive' } } },
      ];
    }

    const [total, accounts] = await Promise.all([
      prisma.account.count({ where }),
      prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    return {
      accounts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async updateAccountStatus(
    accountId: string,
    status: AccountStatus,
    reason: string,
    adminId: string,
    adminRole: Role,
    ipAddress?: string,
    correlationId?: string
  ) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    if (account.status === AccountStatus.CLOSED) {
      throw new AppError('Cannot alter status of a closed account.', 400);
    }

    const updated = await prisma.account.update({
      where: { id: accountId },
      data: { status },
    });

    await AuditService.record({
      actorId: adminId,
      actorRole: adminRole,
      action: 'ACCOUNT_STATUS_CHANGED',
      targetEntity: 'Account',
      targetId: account.id,
      metadata: {
        previousStatus: account.status,
        newStatus: status,
        reason,
      },
      ipAddress,
      correlationId,
      outcome: AuditOutcome.SUCCESS,
    });

    return updated;
  }

  public static async executeTransfer(dto: TransferDTO) {
    // 1. Check idempotency: if key already processed, return existing transaction
    const existingTx = await prisma.transaction.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: { entries: true },
    });

    if (existingTx) {
      return {
        transaction: existingTx,
        idempotentReplay: true,
      };
    }

    // 2. Fetch source & destination
    const [source, destination] = await Promise.all([
      prisma.account.findUnique({ where: { id: dto.sourceAccountId } }),
      prisma.account.findUnique({ where: { id: dto.destinationAccountId } }),
    ]);

    if (!source || !destination) {
      throw new AppError('Source or destination account does not exist.', 404);
    }

    // IDOR verification: Actor must own source account unless admin
    if (dto.actorRole === Role.ACCOUNT_HOLDER && source.userId !== dto.actorUserId) {
      throw new AppError('Forbidden: You can only transfer funds from your own account.', 403);
    }

    if (source.status !== AccountStatus.ACTIVE) {
      throw new AppError(`Source account is not active (status: ${source.status}).`, 400);
    }

    if (destination.status !== AccountStatus.ACTIVE) {
      throw new AppError(`Destination account is not active (status: ${destination.status}).`, 400);
    }

    const transferAmount = new Prisma.Decimal(dto.amount);

    if (source.balance.lessThan(transferAmount)) {
      throw new AppError('Insufficient funds for transfer.', 400);
    }

    const referenceNumber = `TX-${uuidv4().substring(0, 8).toUpperCase()}`;

    // 3. Atomic double-entry execution
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from source
      const newSourceBalance = source.balance.minus(transferAmount);
      const updatedSource = await tx.account.update({
        where: { id: source.id },
        data: { balance: newSourceBalance },
      });

      // Add to destination
      const newDestBalance = destination.balance.plus(transferAmount);
      const updatedDest = await tx.account.update({
        where: { id: destination.id },
        data: { balance: newDestBalance },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          idempotencyKey: dto.idempotencyKey,
          referenceNumber,
          description: dto.description,
          status: TransactionStatus.POSTED,
          entries: {
            create: [
              {
                accountId: source.id,
                entryType: LedgerEntryType.DEBIT,
                amount: transferAmount,
                balanceAfter: newSourceBalance,
              },
              {
                accountId: destination.id,
                entryType: LedgerEntryType.CREDIT,
                amount: transferAmount,
                balanceAfter: newDestBalance,
              },
            ],
          },
        },
        include: { entries: true },
      });

      return {
        transaction,
        source: updatedSource,
        destination: updatedDest,
      };
    });

    await AuditService.record({
      actorId: dto.actorUserId,
      actorRole: dto.actorRole,
      action: 'FUNDS_TRANSFERRED',
      targetEntity: 'Transaction',
      targetId: result.transaction.id,
      metadata: {
        sourceAccountId: source.id,
        destinationAccountId: destination.id,
        amount: dto.amount,
        referenceNumber,
      },
      ipAddress: dto.ipAddress,
      correlationId: dto.correlationId,
      outcome: AuditOutcome.SUCCESS,
    });

    return {
      transaction: result.transaction,
      idempotentReplay: false,
    };
  }
}
