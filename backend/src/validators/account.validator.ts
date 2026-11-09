import { z } from 'zod';
import { AccountStatus, AccountType } from '@prisma/client';

export const updateAccountStatusSchema = z.object({
  status: z.enum([AccountStatus.ACTIVE, AccountStatus.SUSPENDED, AccountStatus.CLOSED]),
  reason: z.string().min(3).max(255),
}).strict();

export const transferFundsSchema = z.object({
  sourceAccountId: z.string().uuid(),
  destinationAccountId: z.string().uuid(),
  amount: z.number().positive('Transfer amount must be positive'),
  description: z.string().min(1).max(255),
  idempotencyKey: z.string().min(8).max(64),
}).strict().refine((data) => data.sourceAccountId !== data.destinationAccountId, {
  message: 'Source and destination accounts must be different',
  path: ['destinationAccountId'],
});
