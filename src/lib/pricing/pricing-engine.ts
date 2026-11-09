import { prisma } from "@/lib/db/prisma";
import {
  ClassroomStatus,
  PackageStatus,
  PricingOfferType,
  UserRole,
  NotificationEventType,
  NotificationPriority,
} from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";

export class PricingEngineError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "PricingEngineError";
    this.statusCode = statusCode;
  }
}

export interface SessionAllocationBreakdown {
  sessionIndex: number; // 1-based (1, 2, 3...)
  allocatedAmountGnf: number; // Gross amount for this session in GNF
  platformCommissionGnf: number; // Platform share (15%) in GNF
  teacherNetGnf: number; // Teacher net share (85%) in GNF
}

export interface CalculatedPackagePricing {
  pricingType: PricingOfferType;
  hourlyRateGnf?: number | null;
  totalAmountGnf: number;
  sessionsCount: number;
  minutesPerSession: number;
  totalPlannedMinutes: number;
  baseSessionRateGnf: number;
  remainderGnf: number;
  effectiveCostPerSessionGnf: number;
  commissionRatePercent: number;
  totalPlatformCommissionGnf: number;
  totalTeacherShareGnf: number;
  allocations: SessionAllocationBreakdown[];
}

export interface HourlyCalculationParams {
  hourlyRateGnf: number;
  durationMinutes: number;
  sessionsCount: number;
  commissionRatePercent?: number;
}

export interface MonthlyCalculationParams {
  totalAmountGnf: number;
  sessionsCount: number;
  durationMinutes: number;
  commissionRatePercent?: number;
}

export interface SetupClassroomPackageParams {
  classroomId: string;
  userId: string;
  userRole: UserRole;
  pricingType: PricingOfferType;
  amountGnf: number; // hourly rate if HOURLY, total package price if MONTHLY_PACKAGE
  sessionsCount: number;
  minutesPerSession: number;
  notes?: string | null;
}

/**
 * Core Financial Pricing Engine for Monsieur Fanyi
 * Implements strict integer GNF arithmetic, deterministic remainder reconciliation,
 * and immutable commission snapshots.
 */
export class PricingEngine {
  public static readonly DEFAULT_COMMISSION_PERCENT = 15;

  /**
   * Calculates an hourly tutoring package with safe integer math and exact session allocation.
   * Total = round(hourlyRateGnf * durationMinutes / 60) * sessionsCount
   */
  static calculateHourlyPackage({
    hourlyRateGnf,
    durationMinutes,
    sessionsCount,
    commissionRatePercent = PricingEngine.DEFAULT_COMMISSION_PERCENT,
  }: HourlyCalculationParams): CalculatedPackagePricing {
    PricingEngine.validateIntegerParam("hourlyRateGnf", hourlyRateGnf, 1);
    PricingEngine.validateIntegerParam("durationMinutes", durationMinutes, 15, 480);
    PricingEngine.validateIntegerParam("sessionsCount", sessionsCount, 1, 100);
    PricingEngine.validateCommissionRate(commissionRatePercent);

    // Exact per-session rate calculated at the agreed duration
    const baseSessionRateGnf = Math.round((hourlyRateGnf * durationMinutes) / 60);
    const totalAmountGnf = baseSessionRateGnf * sessionsCount;
    const totalPlannedMinutes = durationMinutes * sessionsCount;

    // Platform and Teacher share calculation at package level
    const totalPlatformCommissionGnf = Math.round(
      (totalAmountGnf * commissionRatePercent) / 100
    );
    const totalTeacherShareGnf = totalAmountGnf - totalPlatformCommissionGnf;

    // Distribute commission deterministically across sessions
    const baseCommission = Math.floor(totalPlatformCommissionGnf / sessionsCount);
    const remainderCommission = totalPlatformCommissionGnf % sessionsCount;

    const allocations: SessionAllocationBreakdown[] = [];
    for (let i = 0; i < sessionsCount; i++) {
      const sessionCommission =
        i < remainderCommission ? baseCommission + 1 : baseCommission;
      const sessionTeacherNet = baseSessionRateGnf - sessionCommission;

      allocations.push({
        sessionIndex: i + 1,
        allocatedAmountGnf: baseSessionRateGnf,
        platformCommissionGnf: sessionCommission,
        teacherNetGnf: sessionTeacherNet,
      });
    }

    PricingEngine.verifyAggregateReconciliation(
      totalAmountGnf,
      totalPlatformCommissionGnf,
      totalTeacherShareGnf,
      allocations
    );

    return {
      pricingType: PricingOfferType.HOURLY,
      hourlyRateGnf,
      totalAmountGnf,
      sessionsCount,
      minutesPerSession: durationMinutes,
      totalPlannedMinutes,
      baseSessionRateGnf,
      remainderGnf: 0,
      effectiveCostPerSessionGnf: baseSessionRateGnf,
      commissionRatePercent,
      totalPlatformCommissionGnf,
      totalTeacherShareGnf,
      allocations,
    };
  }

  /**
   * Calculates a fixed-price monthly tutoring package with exact integer division
   * and deterministic remainder absorption on the earliest sessions.
   * Invariant: Sum of session allocations === totalAmountGnf down to the exact GNF.
   */
  static calculateMonthlyPackage({
    totalAmountGnf,
    sessionsCount,
    durationMinutes,
    commissionRatePercent = PricingEngine.DEFAULT_COMMISSION_PERCENT,
  }: MonthlyCalculationParams): CalculatedPackagePricing {
    PricingEngine.validateIntegerParam("totalAmountGnf", totalAmountGnf, 1);
    PricingEngine.validateIntegerParam("sessionsCount", sessionsCount, 1, 100);
    PricingEngine.validateIntegerParam("durationMinutes", durationMinutes, 15, 480);
    PricingEngine.validateCommissionRate(commissionRatePercent);

    const totalPlannedMinutes = durationMinutes * sessionsCount;
    const baseSessionRateGnf = Math.floor(totalAmountGnf / sessionsCount);
    const remainderGnf = totalAmountGnf % sessionsCount;

    // Package level commission
    const totalPlatformCommissionGnf = Math.round(
      (totalAmountGnf * commissionRatePercent) / 100
    );
    const totalTeacherShareGnf = totalAmountGnf - totalPlatformCommissionGnf;

    // Deterministic commission distribution across sessions
    const baseCommission = Math.floor(totalPlatformCommissionGnf / sessionsCount);
    const remainderCommission = totalPlatformCommissionGnf % sessionsCount;

    const allocations: SessionAllocationBreakdown[] = [];
    for (let i = 0; i < sessionsCount; i++) {
      const sessionGross =
        i < remainderGnf ? baseSessionRateGnf + 1 : baseSessionRateGnf;
      const sessionCommission =
        i < remainderCommission ? baseCommission + 1 : baseCommission;
      const sessionTeacherNet = sessionGross - sessionCommission;

      allocations.push({
        sessionIndex: i + 1,
        allocatedAmountGnf: sessionGross,
        platformCommissionGnf: sessionCommission,
        teacherNetGnf: sessionTeacherNet,
      });
    }

    PricingEngine.verifyAggregateReconciliation(
      totalAmountGnf,
      totalPlatformCommissionGnf,
      totalTeacherShareGnf,
      allocations
    );

    return {
      pricingType: PricingOfferType.MONTHLY_PACKAGE,
      hourlyRateGnf: null,
      totalAmountGnf,
      sessionsCount,
      minutesPerSession: durationMinutes,
      totalPlannedMinutes,
      baseSessionRateGnf,
      remainderGnf,
      effectiveCostPerSessionGnf: Math.round(totalAmountGnf / sessionsCount),
      commissionRatePercent,
      totalPlatformCommissionGnf,
      totalTeacherShareGnf,
      allocations,
    };
  }

  /**
   * Universal calculation entrypoint handling both pricing models
   */
  static calculatePackage({
    pricingType,
    amountGnf,
    sessionsCount,
    minutesPerSession,
    commissionRatePercent = PricingEngine.DEFAULT_COMMISSION_PERCENT,
  }: {
    pricingType: PricingOfferType;
    amountGnf: number;
    sessionsCount: number;
    minutesPerSession: number;
    commissionRatePercent?: number;
  }): CalculatedPackagePricing {
    if (pricingType === PricingOfferType.HOURLY) {
      return PricingEngine.calculateHourlyPackage({
        hourlyRateGnf: amountGnf,
        durationMinutes: minutesPerSession,
        sessionsCount,
        commissionRatePercent,
      });
    }

    return PricingEngine.calculateMonthlyPackage({
      totalAmountGnf: amountGnf,
      sessionsCount,
      durationMinutes: minutesPerSession,
      commissionRatePercent,
    });
  }

  /**
   * Retrieves active platform commission percentage from database or default 15%
   */
  static async getActiveCommissionRate(): Promise<number> {
    try {
      const activeRule = await prisma.commissionRule.findFirst({
        where: {
          effectiveFrom: { lte: new Date() },
        },
        orderBy: { effectiveFrom: "desc" },
      });
      return activeRule?.ratePercentage ?? PricingEngine.DEFAULT_COMMISSION_PERCENT;
    } catch {
      return PricingEngine.DEFAULT_COMMISSION_PERCENT;
    }
  }

  /**
   * Sets up or updates an agreed tutoring package for a classroom.
   * Atomically validates authorization, takes an immutable commission snapshot,
   * stores exact per-session allocations, and ensures zero premature earnings.
   */
  static async setupClassroomPackage({
    classroomId,
    userId,
    userRole,
    pricingType,
    amountGnf,
    sessionsCount,
    minutesPerSession,
    notes,
  }: SetupClassroomPackageParams) {
    // 1. Fetch classroom and verify permissions
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        student: {
          include: { parent: true },
        },
        teacherProfile: true,
      },
    });

    if (!classroom) {
      throw new PricingEngineError("Classe introuvable", 404);
    }

    // Authorization: Admin, Parent owner, or assigned Teacher
    const isParent =
      userRole === UserRole.PARENT &&
      classroom.student.parent.userId === userId;
    const isTeacher =
      userRole === UserRole.TEACHER &&
      classroom.teacherProfile.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isParent && !isTeacher && !isAdmin) {
      throw new PricingEngineError(
        "Vous n'êtes pas autorisé à configurer la tarification de cette classe",
        403
      );
    }

    // Ineligible states check: CANCELLED or COMPLETED classrooms cannot receive new package
    if (
      classroom.status === ClassroomStatus.CANCELLED ||
      classroom.status === ClassroomStatus.COMPLETED
    ) {
      throw new PricingEngineError(
        `Impossible de modifier la tarification d'une classe ${classroom.status.toLowerCase()}`,
        400
      );
    }

    // 2. Fetch active commission snapshot
    const activeCommissionRate = await PricingEngine.getActiveCommissionRate();

    // 3. Compute exact pricing with engine
    const pricing = PricingEngine.calculatePackage({
      pricingType,
      amountGnf,
      sessionsCount,
      minutesPerSession,
      commissionRatePercent: activeCommissionRate,
    });

    // 4. Atomically persist package in transaction
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // Check if a pending package already exists for this classroom
      const existingPackage = await tx.tutoringPackage.findFirst({
        where: {
          classroomId,
          status: { in: [PackageStatus.DRAFT, PackageStatus.PROPOSED, PackageStatus.PENDING_PAYMENT] },
        },
        orderBy: { version: "desc" },
      });

      const nextVersion = existingPackage ? existingPackage.version + 1 : 1;

      // Create new package record (or update)
      const newPackage = await tx.tutoringPackage.create({
        data: {
          classroomId,
          pricingType,
          hourlyRateGnf: pricing.hourlyRateGnf,
          totalAmountGnf: pricing.totalAmountGnf,
          sessionsCount: pricing.sessionsCount,
          minutesPerSession: pricing.minutesPerSession,
          totalPlannedMinutes: pricing.totalPlannedMinutes,
          baseSessionRateGnf: pricing.baseSessionRateGnf,
          remainderGnf: pricing.remainderGnf,
          commissionRatePercent: pricing.commissionRatePercent,
          totalPlatformCommissionGnf: pricing.totalPlatformCommissionGnf,
          totalTeacherShareGnf: pricing.totalTeacherShareGnf,
          allocationsJson: JSON.stringify(pricing.allocations),
          status: PackageStatus.PENDING_PAYMENT,
          notes: notes || null,
          version: nextVersion,
          agreedAt: now,
        },
      });

      // Update Classroom rates for quick reference
      await tx.classroom.update({
        where: { id: classroomId },
        data: {
          hourlyRateGnf: pricing.hourlyRateGnf || null,
          monthlyRateGnf:
            pricingType === PricingOfferType.MONTHLY_PACKAGE
              ? pricing.totalAmountGnf
              : null,
        },
      });

      // Dispatches notification to counterparty
      const notifyUserId = isParent
        ? classroom.teacherProfile.userId
        : classroom.student.parent.userId;

      await NotificationService.publishNotificationEvent(
        {
          eventType: NotificationEventType.PACKAGE_CONFIRMED,
          recipientUserId: notifyUserId,
          entityType: "TutoringPackage",
          entityId: newPackage.id,
          title: "Conditions tarifaires du cours configurées",
          message: `Le forfait pour ${classroom.student.fullName} en ${classroom.subjectName} a été défini (${pricing.sessionsCount} séances • ${pricing.totalAmountGnf.toLocaleString("fr-GN")} GNF). Statut : En attente de paiement.`,
          linkUrl: isParent ? `/teacher/classes` : `/parent/classes`,
          priority: NotificationPriority.HIGH,
          emailPayload: {
            sessionsCount: pricing.sessionsCount,
            totalAmountGnf: pricing.totalAmountGnf,
            studentName: classroom.student.fullName,
            subjectName: classroom.subjectName,
          },
        },
        tx
      );

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: "SETUP_CLASSROOM_PACKAGE",
          entityType: "TutoringPackage",
          entityId: newPackage.id,
          detailsJson: JSON.stringify({
            classroomId,
            pricingType,
            totalAmountGnf: pricing.totalAmountGnf,
            sessionsCount: pricing.sessionsCount,
            commissionRatePercent: pricing.commissionRatePercent,
            totalPlatformCommissionGnf: pricing.totalPlatformCommissionGnf,
            totalTeacherShareGnf: pricing.totalTeacherShareGnf,
            version: nextVersion,
            status: PackageStatus.PENDING_PAYMENT,
          }),
        },
      });

      return newPackage;
    });

    return {
      success: true,
      package: result,
      pricing,
    };
  }

  // =========================================================================
  // ARITHMETIC INVARIANT VERIFICATION & VALIDATION
  // =========================================================================

  private static verifyAggregateReconciliation(
    expectedTotalGross: number,
    expectedTotalCommission: number,
    expectedTotalTeacher: number,
    allocations: SessionAllocationBreakdown[]
  ): void {
    let sumGross = 0;
    let sumCommission = 0;
    let sumTeacher = 0;

    for (const alloc of allocations) {
      // Invariant 1: Session gross must equal commission + net
      if (alloc.platformCommissionGnf + alloc.teacherNetGnf !== alloc.allocatedAmountGnf) {
        throw new PricingEngineError(
          `Violation d'invariant à la séance ${alloc.sessionIndex}: Commission (${alloc.platformCommissionGnf}) + Net (${alloc.teacherNetGnf}) !== Brut (${alloc.allocatedAmountGnf})`
        );
      }

      sumGross += alloc.allocatedAmountGnf;
      sumCommission += alloc.platformCommissionGnf;
      sumTeacher += alloc.teacherNetGnf;
    }

    // Invariant 2: Sum of session gross must equal package total
    if (sumGross !== expectedTotalGross) {
      throw new PricingEngineError(
        `Violation d'agrégation : Somme des séances (${sumGross} GNF) !== Total forfait (${expectedTotalGross} GNF)`
      );
    }

    // Invariant 3: Sum of platform commissions must equal package platform commission
    if (sumCommission !== expectedTotalCommission) {
      throw new PricingEngineError(
        `Violation d'agrégation : Somme des commissions (${sumCommission} GNF) !== Commission totale (${expectedTotalCommission} GNF)`
      );
    }

    // Invariant 4: Sum of teacher shares must equal package teacher allocation
    if (sumTeacher !== expectedTotalTeacher) {
      throw new PricingEngineError(
        `Violation d'agrégation : Somme des parts professeur (${sumTeacher} GNF) !== Part totale (${expectedTotalTeacher} GNF)`
      );
    }

    // Invariant 5: Package platform commission + package teacher share must equal package total
    if (expectedTotalCommission + expectedTotalTeacher !== expectedTotalGross) {
      throw new PricingEngineError(
        `Violation d'intégrité : Commission totale (${expectedTotalCommission}) + Part professeur (${expectedTotalTeacher}) !== Total brut (${expectedTotalGross})`
      );
    }
  }

  private static validateIntegerParam(
    name: string,
    value: unknown,
    min = 1,
    max = 500_000_000
  ): void {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      throw new PricingEngineError(
        `Le paramètre '${name}' doit être un entier strict (reçu: ${value})`,
        400
      );
    }
    if (value < min || value > max) {
      throw new PricingEngineError(
        `Le paramètre '${name}' (${value}) doit être compris entre ${min} et ${max}`,
        400
      );
    }
  }

  private static validateCommissionRate(rate: unknown): void {
    if (typeof rate !== "number" || !Number.isInteger(rate) || rate < 0 || rate > 100) {
      throw new PricingEngineError(
        `Le taux de commission doit être un pourcentage entier entre 0 et 100 (reçu: ${rate})`,
        400
      );
    }
  }
}
