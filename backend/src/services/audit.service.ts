import { prisma } from '../prisma';
import { logger } from '../utils/logger';
import { AuditOutcome } from '@prisma/client';

export interface AuditLogInput {
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetEntity: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  correlationId?: string | null;
  outcome?: AuditOutcome;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordconfirm',
  'token',
  'jwt',
  'refreshtoken',
  'secret',
  'bootstrapsecret',
  'authorization',
]);

export const sanitizeMetadata = (obj: unknown): unknown => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeMetadata);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export class AuditService {
  public static async record(entry: AuditLogInput): Promise<void> {
    try {
      const sanitizedMeta = entry.metadata ? (sanitizeMetadata(entry.metadata) as object) : undefined;
      
      await prisma.auditLog.create({
        data: {
          actorId: entry.actorId || null,
          actorRole: entry.actorRole || null,
          action: entry.action,
          targetEntity: entry.targetEntity,
          targetId: entry.targetId,
          metadata: sanitizedMeta || undefined,
          ipAddress: entry.ipAddress || null,
          correlationId: entry.correlationId || null,
          outcome: entry.outcome || AuditOutcome.SUCCESS,
        },
      });
    } catch (error) {
      logger.error('Failed to persist audit log entry', error, {
        action: entry.action,
        targetEntity: entry.targetEntity,
        targetId: entry.targetId,
        correlationId: entry.correlationId || undefined,
      });
      // Do not silently suppress in high-integrity workflows
    }
  }
}
