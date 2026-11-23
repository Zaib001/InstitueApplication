/**
 * MONSIEUR FANYI — FINANCIAL AUDIT SERVICE
 * Enterprise-grade append-only financial audit logging with credential redaction.
 */

import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";

export interface LogFinancialAuditParams {
  correlationId?: string;
  actorId: string;
  actorRole?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

const REDACTED_KEYS = new Set([
  "cardnumber",
  "pan",
  "cvv",
  "cvc",
  "password",
  "secret",
  "apikey",
  "token",
  "accesstoken",
  "authorization",
  "clientsecret",
  "privatekey",
  "pin",
  "otp",
]);

/**
 * Deep redaction of sensitive payment credentials
 */
export function sanitizeFinancialData<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeFinancialData(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (REDACTED_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeFinancialData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export class FinancialAuditService {
  /**
   * Records an immutable financial audit event.
   */
  static async logEvent(
    params: LogFinancialAuditParams,
    txClient: any = prisma
  ) {
    const correlationId =
      params.correlationId || `fcor_${crypto.randomBytes(8).toString("hex")}`;
    const sanitizedPrev = params.previousState
      ? sanitizeFinancialData(params.previousState)
      : null;
    const sanitizedNew = params.newState
      ? sanitizeFinancialData(params.newState)
      : null;
    const sanitizedMeta = params.metadata
      ? sanitizeFinancialData(params.metadata)
      : null;

    return await txClient.financialAuditEvent.create({
      data: {
        correlationId,
        actorId: params.actorId || params.actorUserId || "SYSTEM",
        actorRole: params.actorRole || "SYSTEM",
        actorUserId: params.actorUserId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousStateJson: sanitizedPrev ? JSON.stringify(sanitizedPrev) : null,
        newStateJson: sanitizedNew ? JSON.stringify(sanitizedNew) : null,
        ipAddress: params.ipAddress || null,
        metadataJson: sanitizedMeta ? JSON.stringify(sanitizedMeta) : null,
      },
    });
  }

  /**
   * Retrieves audit trail for a given entity (e.g. classroom funding, intent, payout).
   */
  static async getEntityAuditTrail(
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    return await prisma.financialAuditEvent.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        actorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}

