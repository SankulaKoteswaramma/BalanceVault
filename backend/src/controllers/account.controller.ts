import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/account.service';
import { updateAccountStatusSchema, transferFundsSchema } from '../validators/account.validator';
import { AccountStatus } from '@prisma/client';

export class AccountController {
  public static async getMyAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const accounts = await AccountService.getAccountsForUser(req.user.id);

      res.status(200).json({
        success: true,
        data: accounts,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const account = await AccountService.getAccountById(id, req.user.id, req.user.role);

      res.status(200).json({
        success: true,
        data: account,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listAllAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = req.query.status as AccountStatus | undefined;
      const search = req.query.search as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await AccountService.listAllAccounts({ status, search, page, limit });

      res.status(200).json({
        success: true,
        data: result.accounts,
        meta: result.meta,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const validated = updateAccountStatusSchema.parse(req.body);

      const result = await AccountService.updateAccountStatus(
        id,
        validated.status,
        validated.reason,
        req.user.id,
        req.user.role,
        req.ip,
        req.correlationId
      );

      res.status(200).json({
        success: true,
        message: `Account status updated to ${validated.status}`,
        data: result,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const validated = transferFundsSchema.parse(req.body);

      const result = await AccountService.executeTransfer({
        actorUserId: req.user.id,
        actorRole: req.user.role,
        ...validated,
        ipAddress: req.ip,
        correlationId: req.correlationId,
      });

      res.status(200).json({
        success: true,
        message: result.idempotentReplay ? 'Transfer replayed idempotently' : 'Transfer posted successfully',
        data: result.transaction,
        idempotentReplay: result.idempotentReplay,
        correlationId: req.correlationId,
      });
    } catch (error) {
      next(error);
    }
  }
}
