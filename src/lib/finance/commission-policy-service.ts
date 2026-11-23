/**
 * MONSIEUR FANYI — COMMISSION POLICY SERVICE
 * Dynamic policy versioning, immutable snapshots, and integer commission calculations.
 */

import { prisma } from "@/lib/db/prisma";
import { FinancialError } from "./types";
import { FinancialAuditService } from "./audit-service";

export interface CommissionSplitResult {
  grossAmountGnf: number;
  platformCommissionGnf: number;
  teacherNetGnf: number;
  platformPercent: number;
  teacherPercent: number;
  policyVersion: string;
}

export class CommissionPolicyService {
  public static readonly DEFAULT_VERSION = "POL-2026-V1";
  public static readonly DEFAULT_PLATFORM_PERCENT = 15;
  public static readonly DEFAULT_TEACHER_PERCENT = 85;

  /**
   * Pure integer calculation of commission split ensuring no franc is lost or duplicated.
   */
  static calculateSplit(
    grossAmountGnf: number,
    platformPercent: number
  ): { platformCommissionGnf: number; teacherNetGnf: number } {
    if (grossAmountGnf < 0) {
      throw new FinancialError(
        "Le montant brut ne peut pas être négatif.",
        "INVALID_AMOUNT",
        400
      );
    }
    if (platformPercent < 0 || platformPercent > 100) {
      throw new FinancialError(
        "Le taux de commission doit être compris entre 0 et 100%.",
        "INVALID_COMMISSION_RATE",
        400
      );
    }

    // Exact integer rounding
    const platformCommissionGnf = Math.round(
      (grossAmountGnf * platformPercent) / 100
    );
    const teacherNetGnf = grossAmountGnf - platformCommissionGnf;

    return { platformCommissionGnf, teacherNetGnf };
  }

  /**
   * Ensures at least one active commission policy exists in the database.
   */
  static async bootstrapDefaultPolicy(adminId = "SYSTEM_SEED") {
    const existing = await prisma.commissionPolicy.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return existing;
    }

    return await prisma.commissionPolicy.create({
      data: {
        version: CommissionPolicyService.DEFAULT_VERSION,
        platformPercent: CommissionPolicyService.DEFAULT_PLATFORM_PERCENT,
        teacherPercent: CommissionPolicyService.DEFAULT_TEACHER_PERCENT,
        description:
          "Politique de commission standard Monsieur Fanyi (15% plateforme / 85% enseignant - Confirmée par le client Ousman)",
        effectiveFrom: new Date(),
        isActive: true,
        isLocked: true,
        createdByAdminId: adminId,
      },
    });
  }

  /**
   * Retrieves the currently active commission policy.
   */
  static async getActivePolicy() {
    let policy = await prisma.commissionPolicy.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: "desc" },
    });

    if (!policy) {
      policy = await this.bootstrapDefaultPolicy();
    }

    return policy;
  }

  /**
   * Creates a new commission policy version and archives/deactivates the previous active policy.
   */
  static async createNewPolicyVersion(params: {
    version: string;
    platformPercent: number;
    description: string;
    adminId: string;
    effectiveFrom?: Date;
  }) {
    const { version, platformPercent, description, adminId } = params;
    const effectiveFrom = params.effectiveFrom || new Date();

    if (platformPercent < 0 || platformPercent > 100) {
      throw new FinancialError(
        "Le pourcentage de la plateforme doit être entre 0% et 100%.",
        "INVALID_COMMISSION_RATE",
        400
      );
    }

    const teacherPercent = 100 - platformPercent;

    return await prisma.$transaction(async (tx) => {
      // Check for duplicate version name
      const exists = await tx.commissionPolicy.findUnique({
        where: { version },
      });
      if (exists) {
        throw new FinancialError(
          `La version de politique ${version} existe déjà.`,
          "DUPLICATE_POLICY_VERSION",
          409
        );
      }

      // Deactivate previous active policies
      await tx.commissionPolicy.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new active policy
      const newPolicy = await tx.commissionPolicy.create({
        data: {
          version,
          platformPercent,
          teacherPercent,
          description,
          effectiveFrom,
          isActive: true,
          isLocked: true,
          createdByAdminId: adminId,
        },
      });

      await FinancialAuditService.logEvent(
        {
          actorId: adminId,
          actorRole: "ADMINISTRATOR",
          action: "COMMISSION_POLICY_CREATED",
          entityType: "COMMISSION_POLICY",
          entityId: newPolicy.id,
          newState: {
            version,
            platformPercent,
            teacherPercent,
            effectiveFrom,
          },
        },
        tx
      );

      return newPolicy;
    });
  }

  /**
   * Lists all historical commission policy versions for administrative review.
   */
  static async listPolicies() {
    return await prisma.commissionPolicy.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

