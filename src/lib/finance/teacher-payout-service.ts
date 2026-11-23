/**
 * MONSIEUR FANYI — TEACHER PAYOUT SERVICE (M3.05)
 * Manages destination wallets, verified payout requests, administrator authorization,
 * manual/automated mobile money disbursements, compensating reversals, and reconciliation.
 */

import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  RequestTeacherPayoutParams,
  JournalReferenceType,
  LedgerEntryDirection,
  SessionEarningsStatus,
  PayoutStatus,
  STANDARD_ACCOUNTS,
  FinancialError,
} from "./types";
import { DoubleEntryLedger } from "./double-entry-ledger";
import { FinancialAuditService } from "./audit-service";
import { validateGuineaPhoneNumber, maskPhoneNumber } from "./phone-validation";
import { NotificationService } from "@/lib/notifications/notification-service";
import { NotificationEventType, NotificationPriority } from "@prisma/client";

export interface ConfirmPayoutDisbursementParams {
  payoutId: string;
  providerDisbursementRef?: string;
  actorId: string;
}

export interface FailPayoutDisbursementParams {
  payoutId: string;
  failureReason: string;
  actorId: string;
}

export interface UpsertTeacherDestinationParams {
  teacherProfileId: string;
  operator: "ORANGE_MONEY" | "MTN_MOMO" | string;
  phone: string;
  accountHolderName: string;
  isDefault?: boolean;
  actorUserId?: string;
}

export interface ExecuteManualPayoutParams {
  payoutId: string;
  providerReference: string;
  notes?: string;
  adminUserId: string;
  targetStatus?: "PAID" | "RECONCILIATION_PENDING";
}

export class TeacherPayoutService {
  /** Technical lower limit strictly necessary for positive monetary transactions. */
  public static readonly TECHNICAL_MINIMUM_PAYOUT_GNF = 1;

  /** Operational proposal discussed with the platform, pending formal client contractual confirmation. */
  public static readonly PROPOSED_POLICY_THRESHOLD_GNF = 50000;

  /**
   * Enforced minimum payout amount.
   * If MIN_TEACHER_PAYOUT_AMOUNT_GNF is configured, respects that setting.
   * Otherwise, defaults strictly to the TECHNICAL minimum (1 GNF) to prevent imposing unapproved contractual limits.
   */
  public static get MINIMUM_PAYOUT_GNF(): number {
    const envVal = process.env.MIN_TEACHER_PAYOUT_AMOUNT_GNF;
    if (envVal !== undefined && envVal !== null && envVal !== "") {
      const parsed = parseInt(envVal, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    // Technical minimum only; no unapproved contractual limit imposed
    return TeacherPayoutService.TECHNICAL_MINIMUM_PAYOUT_GNF;
  }

  // ============================================================================
  // 1. TEACHER PAYOUT DESTINATION MANAGEMENT
  // ============================================================================

  /**
   * Retrieves all verified/saved payout destinations for a teacher.
   */
  static async getTeacherDestinations(teacherProfileId: string) {
    return await prisma.teacherPayoutDestination.findMany({
      where: { teacherProfileId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Securely saves or updates a teacher payout destination.
   * Enforces Republic of Guinea ARPT validation, logs audit trail, and sends security alert.
   */
  static async upsertTeacherDestination(params: UpsertTeacherDestinationParams) {
    const { teacherProfileId, operator, phone, accountHolderName, isDefault = false, actorUserId } = params;

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: { user: true },
    });

    if (!teacher) {
      throw new FinancialError("Profil enseignant introuvable.", "TEACHER_NOT_FOUND", 404);
    }

    if (!["ORANGE_MONEY", "MTN_MOMO"].includes(operator)) {
      throw new FinancialError(
        "Opérateur de paiement non pris en charge en Guinée (disponibles: Orange Money, MTN MoMo).",
        "INVALID_OPERATOR",
        400
      );
    }

    const phoneValidation = validateGuineaPhoneNumber(phone);
    if (!phoneValidation.isValid) {
      throw new FinancialError(
        phoneValidation.error || "Numéro de téléphone mobile money guinéen invalide.",
        "INVALID_PHONE_NUMBER",
        400
      );
    }

    if (!accountHolderName || accountHolderName.trim().length < 2) {
      throw new FinancialError(
        "Le nom complet du titulaire du compte mobile money est obligatoire.",
        "INVALID_HOLDER_NAME",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // If setting as default, clear default flag on existing destinations
      if (isDefault) {
        await tx.teacherPayoutDestination.updateMany({
          where: { teacherProfileId },
          data: { isDefault: false },
        });
      }

      // Check if this exact phone & operator exists for this teacher
      const existing = await tx.teacherPayoutDestination.findFirst({
        where: {
          teacherProfileId,
          operator,
          phone: phoneValidation.e164,
        },
      });

      let destination;
      if (existing) {
        destination = await tx.teacherPayoutDestination.update({
          where: { id: existing.id },
          data: {
            accountHolderName: accountHolderName.trim(),
            isDefault,
            verificationStatus: "VERIFIED",
            verifiedAt: new Date(),
          },
        });
      } else {
        // If this is the teacher's first destination, make it default automatically
        const count = await tx.teacherPayoutDestination.count({
          where: { teacherProfileId },
        });

        destination = await tx.teacherPayoutDestination.create({
          data: {
            teacherProfileId,
            operator,
            phone: phoneValidation.e164,
            accountHolderName: accountHolderName.trim(),
            verificationStatus: "VERIFIED",
            verifiedAt: new Date(),
            isDefault: isDefault || count === 0,
          },
        });
      }

      // Security Audit Log
      await FinancialAuditService.logEvent(
        {
          actorId: actorUserId || teacher.userId || teacherProfileId,
          actorRole: "TEACHER",
          action: "TEACHER_DESTINATION_UPDATED",
          entityType: "TEACHER_PAYOUT_DESTINATION",
          entityId: destination.id,
          newState: {
            operator,
            maskedPhone: maskPhoneNumber(phoneValidation.e164),
            accountHolderName: accountHolderName.trim(),
            isDefault: destination.isDefault,
          },
          metadata: {
            teacherProfileId,
          },
        },
        tx
      );

      // Security Notification to Teacher
      try {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.ADMIN_ALERT,
            recipientUserId: teacher.userId,
            entityType: "TEACHER_PROFILE",
            entityId: teacherProfileId,
            title: "Coordonnées de versement mises à jour",
            message: `Votre compte de versement ${operator === "ORANGE_MONEY" ? "Orange Money" : "MTN MoMo"} (${maskPhoneNumber(phoneValidation.e164)}) a été enregistré avec succès.`,
            linkUrl: "/teacher/finances",
            priority: NotificationPriority.HIGH,
          },
          tx
        );
      } catch (notifErr) {
        console.warn("Notification notice on destination update:", notifErr);
      }

      return destination;
    });
  }

  /**
   * Deletes a teacher payout destination if not locked by an active pending payout.
   */
  static async deleteTeacherDestination(destinationId: string, teacherProfileId: string, actorUserId: string) {
    const destination = await prisma.teacherPayoutDestination.findFirst({
      where: { id: destinationId, teacherProfileId },
    });

    if (!destination) {
      throw new FinancialError("Coordonnée de versement introuvable.", "DESTINATION_NOT_FOUND", 404);
    }

    // Check if locked by an active payout
    const activePayout = await prisma.payout.findFirst({
      where: {
        destinationId,
        status: { in: [PayoutStatus.REQUESTED, PayoutStatus.APPROVED, PayoutStatus.PROCESSING] },
      },
    });

    if (activePayout) {
      throw new FinancialError(
        "Impossible de supprimer un compte de versement rattaché à une demande de virement en cours.",
        "DESTINATION_LOCKED",
        400
      );
    }

    await prisma.teacherPayoutDestination.delete({
      where: { id: destinationId },
    });

    await FinancialAuditService.logEvent({
      actorId: actorUserId,
      actorRole: "TEACHER",
      action: "TEACHER_DESTINATION_DELETED",
      entityType: "TEACHER_PAYOUT_DESTINATION",
      entityId: destinationId,
      metadata: { teacherProfileId },
    });

    return { success: true };
  }

  // ============================================================================
  // 2. TEACHER EARNINGS BALANCE AUDIT
  // ============================================================================

  /**
   * Calculates the currently available, unpaid earnings balance for a teacher.
   * Strictly separates ELIGIBLE (unreserved), RESERVED_FOR_PAYOUT, and PAID balances.
   */
  static async getTeacherAvailableBalance(teacherProfileId: string) {
    const earnings = await prisma.teacherEarning.findMany({
      where: {
        teacherProfileId,
      },
      include: {
        session: {
          select: {
            id: true,
            earningsStatus: true,
          },
        },
      },
    });

    let availableBalanceGnf = 0;
    let reservedBalanceGnf = 0;
    let paidOutBalanceGnf = 0;
    let eligibleEarningsCount = 0;

    for (const e of earnings) {
      if (e.isPaidOut || e.session?.earningsStatus === SessionEarningsStatus.PAID) {
        paidOutBalanceGnf += e.teacherNetGnf;
      } else if (
        e.session?.earningsStatus === SessionEarningsStatus.RESERVED_FOR_PAYOUT ||
        e.payoutId !== null
      ) {
        reservedBalanceGnf += e.teacherNetGnf;
      } else if (
        e.session?.earningsStatus === SessionEarningsStatus.ELIGIBLE &&
        !e.isPaidOut &&
        e.payoutId === null
      ) {
        availableBalanceGnf += e.teacherNetGnf;
        eligibleEarningsCount++;
      }
    }

    const paidOutHistory = await prisma.payout.aggregate({
      where: {
        teacherProfileId,
        status: { in: [PayoutStatus.PAID, PayoutStatus.RECONCILED] },
      },
      _sum: { amountGnf: true },
    });

    return {
      teacherProfileId,
      availableBalanceGnf,
      reservedBalanceGnf,
      paidOutBalanceGnf,
      totalHistoricalEarnedGnf: availableBalanceGnf + reservedBalanceGnf + paidOutBalanceGnf,
      totalHistoricalPaidGnf: paidOutHistory._sum.amountGnf || 0,
      eligibleEarningsCount,
      unpaidEarningsCount: eligibleEarningsCount,
    };
  }

  // ============================================================================
  // 3. TEACHER PAYOUT REQUEST WORKFLOW
  // ============================================================================

  /**
   * Requests a payout. Validates teacher eligibility, minimum threshold and available balance.
   * Transitions earnings to RESERVED_FOR_PAYOUT and records the liability.
   */
  static async requestPayout(params: RequestTeacherPayoutParams) {
    const {
      teacherProfileId,
      amountGnf,
      channel,
      beneficiaryName,
      beneficiaryPhone,
      destinationId,
      requestedByUserId,
      idempotencyKey,
    } = params;

    if (!Number.isInteger(amountGnf) || amountGnf <= 0) {
      throw new FinancialError(
        "Le montant demandé doit être un entier positif strict.",
        "INVALID_PAYOUT_AMOUNT",
        400
      );
    }

    const minimumAllowed = TeacherPayoutService.MINIMUM_PAYOUT_GNF;
    if (amountGnf < minimumAllowed) {
      throw new FinancialError(
        `Le montant demandé (${amountGnf.toLocaleString("fr-FR")} GNF) est inférieur au minimum technique (${minimumAllowed.toLocaleString("fr-FR")} GNF).`,
        "MINIMUM_PAYOUT_THRESHOLD",
        400
      );
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: teacherProfileId },
      include: { user: true },
    });

    if (!teacher) {
      throw new FinancialError("Profil enseignant introuvable.", "TEACHER_NOT_FOUND", 404);
    }

    if (teacher.verificationStatus !== "APPROVED") {
      throw new FinancialError(
        "Seuls les enseignants vérifiés peuvent demander des versements.",
        "TEACHER_NOT_VERIFIED",
        403
      );
    }

    // Phone validation
    const phoneValidation = validateGuineaPhoneNumber(beneficiaryPhone);
    if (!phoneValidation.isValid) {
      throw new FinancialError(
        phoneValidation.error || "Numéro de téléphone de versement invalide.",
        "INVALID_PHONE_NUMBER",
        400
      );
    }

    // Idempotency check
    const effectiveIdempotencyKey =
      idempotencyKey ||
      `payout_${teacherProfileId}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (idempotencyKey) {
      const existingPayout = await prisma.payout.findUnique({
        where: { paymentReference: idempotencyKey },
      });
      if (existingPayout) {
        return existingPayout;
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Re-check available balance inside transaction lock
      const availableEarnings = await tx.teacherEarning.findMany({
        where: {
          teacherProfileId,
          isPaidOut: false,
          payoutId: null,
          session: {
            earningsStatus: SessionEarningsStatus.ELIGIBLE,
          },
        },
        include: {
          session: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const totalAvailable = availableEarnings.reduce((acc, e) => acc + e.teacherNetGnf, 0);

      if (amountGnf > totalAvailable) {
        throw new FinancialError(
          `Solde disponible insuffisant (${totalAvailable.toLocaleString("fr-FR")} GNF) pour un versement de ${amountGnf.toLocaleString("fr-FR")} GNF.`,
          "INSUFFICIENT_EARNINGS",
          422
        );
      }

      let remaining = amountGnf;
      const earningIdsToReserve: string[] = [];
      const sessionIdsToReserve: string[] = [];

      for (const earning of availableEarnings) {
        if (remaining <= 0) break;
        earningIdsToReserve.push(earning.id);
        if (earning.sessionId) {
          sessionIdsToReserve.push(earning.sessionId);
        }
        remaining -= earning.teacherNetGnf;
      }

      if (earningIdsToReserve.length === 0) {
        throw new FinancialError(
          "Aucun gain éligible disponible à réserver pour ce versement.",
          "NO_ELIGIBLE_EARNINGS",
          422
        );
      }

      // Create Payout record in REQUESTED status
      const payout = await tx.payout.create({
        data: {
          teacherProfileId,
          destinationId: destinationId || null,
          amountGnf,
          paymentReference: effectiveIdempotencyKey,
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryPhone: phoneValidation.e164,
          channel,
          disbursementMode: params.disbursementMode || "MANUAL_ADMIN_RECORDED",
          status: PayoutStatus.REQUESTED,
          recordedByAdmin: requestedByUserId,
          earnings: {
            connect: earningIdsToReserve.map((id) => ({ id })),
          },
        },
      });

      // Link earnings to this payout without marking as paid yet!
      await tx.teacherEarning.updateMany({
        where: { id: { in: earningIdsToReserve } },
        data: { isPaidOut: false, payoutId: payout.id },
      });

      // Transition sessions to RESERVED_FOR_PAYOUT
      await tx.lessonSession.updateMany({
        where: { id: { in: sessionIdsToReserve } },
        data: { earningsStatus: SessionEarningsStatus.RESERVED_FOR_PAYOUT },
      });

      // Post General Ledger Journal:
      // DEBIT: 2030_TEACHER_PAYABLE (Teacher liability converted to payout liability)
      // CREDIT: 2040_PAYOUT_LIABILITY (Disbursement liability acknowledged)
      await DoubleEntryLedger.postJournalEntry(
        {
          referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
          referenceId: payout.id,
          description: `Réservation versement enseignant ${teacher.user.fullName} (${channel} ${maskPhoneNumber(phoneValidation.e164)})`,
          postedBy: requestedByUserId,
          currency: "GNF",
          lines: [
            {
              accountCode: STANDARD_ACCOUNTS.TEACHER_PAYABLE,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.PAYOUT_LIABILITY,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf,
            },
          ],
        },
        tx
      );

      // Audit log
      await FinancialAuditService.logEvent(
        {
          actorId: requestedByUserId,
          actorRole: "TEACHER",
          action: "TEACHER_PAYOUT_REQUESTED",
          entityType: "PAYOUT",
          entityId: payout.id,
          newState: {
            amountGnf,
            channel,
            maskedPhone: maskPhoneNumber(phoneValidation.e164),
            earningCount: earningIdsToReserve.length,
            status: PayoutStatus.REQUESTED,
          },
        },
        tx
      );

      // Notify Teacher of request acknowledgment
      try {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.PAYOUT_REQUESTED,
            recipientUserId: teacher.userId,
            entityType: "PAYOUT",
            entityId: payout.id,
            title: "Demande de versement reçue",
            message: `Votre demande de versement de ${amountGnf.toLocaleString("fr-FR")} GNF via ${channel} est en cours d'examen par notre équipe financière.`,
            linkUrl: "/teacher/finances",
            priority: NotificationPriority.NORMAL,
            dedupKey: `payout_req_${payout.id}`,
          },
          tx
        );
      } catch (notifErr) {
        console.warn("Notification notice on payout request:", notifErr);
      }

      return payout;
    });
  }

  // ============================================================================
  // 4. ADMINISTRATOR AUTHORIZATION & PAYOUT LIFECYCLE
  // ============================================================================

  /**
   * Administrator authorizes a pending payout request.
   * Transitions status from REQUESTED to APPROVED.
   */
  static async approvePayout(
    paramOrId: string | { payoutId: string; adminUserId: string; notes?: string },
    maybeAdminId?: string
  ) {
    const payoutId = typeof paramOrId === "object" ? paramOrId.payoutId : paramOrId;
    const adminUserId = typeof paramOrId === "object" ? paramOrId.adminUserId : maybeAdminId!;
    const notes = typeof paramOrId === "object" ? paramOrId.notes : undefined;

    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        teacherProfile: { include: { user: true } },
      },
    });

    if (!payout) {
      throw new FinancialError("Demande de versement introuvable.", "PAYOUT_NOT_FOUND", 404);
    }

    if (payout.status !== PayoutStatus.REQUESTED) {
      throw new FinancialError(
        `Impossible d'approuver un versement au statut actuel : ${payout.status} (attendu: REQUESTED).`,
        "INVALID_PAYOUT_STATUS",
        400
      );
    }

    const updated = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: PayoutStatus.APPROVED,
        approvedBy: adminUserId,
        approvedAt: new Date(),
        notes: notes || undefined,
      },
    });

    await FinancialAuditService.logEvent({
      actorId: adminUserId,
      actorRole: "ADMINISTRATOR",
      action: "TEACHER_PAYOUT_APPROVED",
      entityType: "PAYOUT",
      entityId: payout.id,
      previousState: { status: PayoutStatus.REQUESTED },
      newState: { status: PayoutStatus.APPROVED, approvedBy: adminUserId },
    });

    // Notify Teacher
    try {
      await NotificationService.publishNotificationEvent({
        eventType: NotificationEventType.PAYOUT_APPROVED,
        recipientUserId: payout.teacherProfile.userId,
        entityType: "PAYOUT",
        entityId: payout.id,
        title: "Demande de versement approuvée",
        message: `Votre demande de versement de ${payout.amountGnf.toLocaleString("fr-FR")} GNF a été approuvée et est prête pour transfert.`,
        linkUrl: "/teacher/finances",
        priority: NotificationPriority.NORMAL,
        dedupKey: `payout_app_${payout.id}`,
      });
    } catch (notifErr) {
      console.warn("Notification notice on payout approval:", notifErr);
    }

    return updated;
  }

  /**
   * Rejects/cancels a payout request.
   * Restores teacher earnings back to ELIGIBLE and posts compensating double-entry journal.
   */
  static async rejectPayout(
    paramOrId: string | { payoutId: string; reason?: string; rejectionReason?: string; adminUserId: string },
    maybeReason?: string,
    maybeAdminId?: string
  ) {
    const payoutId = typeof paramOrId === "object" ? paramOrId.payoutId : paramOrId;
    const reason = typeof paramOrId === "object" ? (paramOrId.rejectionReason || paramOrId.reason || "") : maybeReason!;
    const adminUserId = typeof paramOrId === "object" ? paramOrId.adminUserId : maybeAdminId!;

    if (!reason || reason.trim().length < 5) {
      throw new FinancialError(
        "Veuillez spécifier un motif explicite pour le rejet du versement (min. 5 caractères).",
        "INVALID_REJECTION_REASON",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          earnings: true,
          teacherProfile: { include: { user: true } },
        },
      });

      if (!payout) {
        throw new FinancialError("Demande de versement introuvable.", "PAYOUT_NOT_FOUND", 404);
      }

      if (payout.status !== PayoutStatus.REQUESTED && payout.status !== PayoutStatus.APPROVED) {
        throw new FinancialError(
          `Impossible de rejeter un versement avec le statut : ${payout.status}.`,
          "CANNOT_REJECT_PAYOUT",
          400
        );
      }

      // 1. Unlink earnings and restore sessions
      const earningIds = payout.earnings.map((e) => e.id);
      const sessionIds = payout.earnings.map((e) => e.sessionId);

      await tx.teacherEarning.updateMany({
        where: { id: { in: earningIds } },
        data: { payoutId: null, isPaidOut: false },
      });

      await tx.lessonSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { earningsStatus: SessionEarningsStatus.ELIGIBLE },
      });

      // 2. Mark payout as CANCELLED
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.CANCELLED,
          rejectionReason: reason.trim(),
        },
      });

      // 3. Compensating double-entry journal entry:
      // DEBIT: 2040_PAYOUT_LIABILITY (Liability canceled)
      // CREDIT: 2030_TEACHER_PAYABLE (Liability restored to teacher)
      await DoubleEntryLedger.postJournalEntry(
        {
          referenceType: JournalReferenceType.COMPENSATING_ADJUSTMENT,
          referenceId: payout.id,
          description: `Annulation versement enseignant ${payout.id} : ${reason.trim()}`,
          postedBy: adminUserId,
          currency: "GNF",
          lines: [
            {
              accountCode: STANDARD_ACCOUNTS.PAYOUT_LIABILITY,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf: payout.amountGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.TEACHER_PAYABLE,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf: payout.amountGnf,
            },
          ],
        },
        tx
      );

      // Audit log
      await FinancialAuditService.logEvent(
        {
          actorId: adminUserId,
          actorRole: "ADMINISTRATOR",
          action: "TEACHER_PAYOUT_REJECTED",
          entityType: "PAYOUT",
          entityId: payout.id,
          previousState: { status: payout.status },
          newState: { status: PayoutStatus.CANCELLED, reason: reason.trim() },
        },
        tx
      );

      // Notify Teacher
      try {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.PAYOUT_REJECTED,
            recipientUserId: payout.teacherProfile.userId,
            entityType: "PAYOUT",
            entityId: payout.id,
            title: "Demande de versement rejetée",
            message: `Votre demande de versement a été rejetée pour le motif suivant : ${reason.trim()}. Vos gains restent disponibles dans votre solde.`,
            linkUrl: "/teacher/finances",
            priority: NotificationPriority.HIGH,
            dedupKey: `payout_rej_${payout.id}`,
          },
          tx
        );
      } catch (notifErr) {
        console.warn("Notification notice on payout rejection:", notifErr);
      }

      return updatedPayout;
    });
  }

  /**
   * Executes a manual Mobile Money transfer settlement recorded by administrator.
   * Requires authoritative transaction reference from telecom business portal (Orange/MTN).
   * Strictly transitions payout to RECONCILIATION_PENDING without premature settlement.
   * Final liability clearance and marked settlement strictly requires independent reconciliation.
   */
  static async executeManualPayout(params: ExecuteManualPayoutParams) {
    const { payoutId, providerReference, notes, adminUserId } = params;

    if (!providerReference || providerReference.trim().length < 5) {
      throw new FinancialError(
        "Veuillez fournir une référence de transaction télécom valide (min. 5 caractères).",
        "INVALID_TELECOM_REF",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Lock Payout row for update
      await tx.$queryRaw`
        SELECT id, status, "amountGnf"
        FROM "Payout"
        WHERE id = ${payoutId}
        FOR UPDATE
      `;

      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          earnings: true,
          teacherProfile: { include: { user: true } },
        },
      });

      if (!payout) {
        throw new FinancialError("Demande de versement introuvable.", "PAYOUT_NOT_FOUND", 404);
      }

      if (payout.status !== PayoutStatus.APPROVED) {
        throw new FinancialError(
          `Impossible de finaliser un versement au statut actuel : ${payout.status} (attendu: APPROVED). Une approbation préalable par un administrateur est requise.`,
          "INVALID_PAYOUT_STATUS",
          400
        );
      }

      // Check if reference was already recorded on another completed payout
      const duplicateRef = await tx.payout.findFirst({
        where: {
          providerDisbursementRef: providerReference.trim(),
          id: { not: payoutId },
        },
      });
      if (duplicateRef) {
        throw new FinancialError(
          `Cette référence de transfert (${providerReference}) a déjà été utilisée pour le versement ${duplicateRef.id}.`,
          "DUPLICATE_DISBURSEMENT_REF",
          409
        );
      }

      // 2. Update Payout record: STRICTLY RECONCILIATION_PENDING (unverified evidence)
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.RECONCILIATION_PENDING,
          providerDisbursementRef: providerReference.trim(),
          notes: notes ? notes.trim() : payout.notes,
        },
      });

      // Earnings remain reserved (RESERVED_FOR_PAYOUT); liability clearance strictly deferred to independent reconciliation

      // 3. Audit Log: Evidence recorded, awaiting independent verification
      await FinancialAuditService.logEvent(
        {
          actorId: adminUserId,
          actorRole: "ADMINISTRATOR",
          action: "MANUAL_PAYOUT_EVIDENCE_RECORDED",
          entityType: "PAYOUT",
          entityId: payout.id,
          previousState: { status: payout.status },
          newState: {
            status: PayoutStatus.RECONCILIATION_PENDING,
            providerDisbursementRef: providerReference.trim(),
            amountGnf: payout.amountGnf,
          },
        },
        tx
      );

      return updatedPayout;
    });
  }

  /**
   * Confirms payment disbursement once telecom / provider settlement notification arrives.
   * Transitions status to PAID, marks earnings as isPaidOut: true, and settles ledger liability.
   */
  static async confirmPayoutDisbursement(params: ConfirmPayoutDisbursementParams) {
    const { payoutId, providerDisbursementRef, actorId } = params;

    return await prisma.$transaction(async (tx) => {
      // 1. Acquire row lock for concurrency safety
      await tx.$queryRaw`
        SELECT id, status, "amountGnf"
        FROM "Payout"
        WHERE id = ${payoutId}
        FOR UPDATE
      `;

      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          earnings: true,
          teacherProfile: { include: { user: true } },
        },
      });

      if (!payout) {
        throw new FinancialError("Versement introuvable.", "PAYOUT_NOT_FOUND", 404);
      }

      if (payout.status === PayoutStatus.PAID || payout.status === PayoutStatus.RECONCILED) {
        return payout; // Idempotent return
      }

      // 1. Update Payout status to PAID
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.PAID,
          providerDisbursementRef: providerDisbursementRef || payout.paymentReference,
        },
      });

      // 2. Mark TeacherEarnings as isPaidOut: true
      const earningIds = payout.earnings.map((e) => e.id);
      const sessionIds = payout.earnings.map((e) => e.sessionId);

      await tx.teacherEarning.updateMany({
        where: { id: { in: earningIds } },
        data: { isPaidOut: true },
      });

      // 3. Mark LessonSessions as PAID
      await tx.lessonSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { earningsStatus: SessionEarningsStatus.PAID },
      });

      // 4. Post General Ledger Journal (clears liability exactly once):
      const existingSettlement = await tx.ledgerJournal.findFirst({
        where: {
          referenceId: payout.id,
          referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
          entries: {
            some: {
              account: { code: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING },
              direction: LedgerEntryDirection.CREDIT,
            },
          },
        },
      });

      if (!existingSettlement) {
        await DoubleEntryLedger.postJournalEntry(
          {
            referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
            referenceId: payout.id,
            description: `Confirmation déblocage télécom versement ${payout.id}`,
            postedBy: actorId,
            currency: "GNF",
            lines: [
              {
                accountCode: STANDARD_ACCOUNTS.PAYOUT_LIABILITY,
                direction: LedgerEntryDirection.DEBIT,
                amountGnf: payout.amountGnf,
              },
              {
                accountCode: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING,
                direction: LedgerEntryDirection.CREDIT,
                amountGnf: payout.amountGnf,
              },
            ],
          },
          tx
        );
      }

      // Audit log
      await FinancialAuditService.logEvent(
        {
          actorId,
          actorRole: "PAYMENT_GATEWAY",
          action: "TEACHER_PAYOUT_DISBURSED",
          entityType: "PAYOUT",
          entityId: payout.id,
          previousState: { status: payout.status },
          newState: {
            status: PayoutStatus.PAID,
            providerDisbursementRef,
          },
        },
        tx
      );

      return updatedPayout;
    });
  }

  /**
   * Handles failed payout disbursement.
   * Restores teacher earnings to ELIGIBLE and posts compensating journal.
   */
  static async failPayoutDisbursement(params: FailPayoutDisbursementParams) {
    const { payoutId, failureReason, actorId } = params;

    return await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          earnings: true,
          teacherProfile: { include: { user: true } },
        },
      });

      if (!payout) {
        throw new FinancialError("Versement introuvable.", "PAYOUT_NOT_FOUND", 404);
      }

      if (payout.status === PayoutStatus.PAID) {
        throw new FinancialError(
          "Impossible d'échouer un versement déjà confirmé.",
          "PAYOUT_ALREADY_PAID",
          409
        );
      }

      // 1. Mark Payout as FAILED
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.FAILED,
          rejectionReason: failureReason,
        },
      });

      // 2. Unlink TeacherEarnings and keep isPaidOut: false
      const earningIds = payout.earnings.map((e) => e.id);
      const sessionIds = payout.earnings.map((e) => e.sessionId);

      await tx.teacherEarning.updateMany({
        where: { id: { in: earningIds } },
        data: { payoutId: null, isPaidOut: false },
      });

      // 3. Revert LessonSessions to ELIGIBLE so they can be re-attempted
      await tx.lessonSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { earningsStatus: SessionEarningsStatus.ELIGIBLE },
      });

      // 4. Post Compensating Ledger Journal:
      await DoubleEntryLedger.postJournalEntry(
        {
          referenceType: JournalReferenceType.COMPENSATING_ADJUSTMENT,
          referenceId: payout.id,
          description: `Restauration suite échec versement ${payout.id}: ${failureReason}`,
          postedBy: actorId,
          currency: "GNF",
          lines: [
            {
              accountCode: STANDARD_ACCOUNTS.PAYOUT_LIABILITY,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf: payout.amountGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.TEACHER_PAYABLE,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf: payout.amountGnf,
            },
          ],
        },
        tx
      );

      // Audit log
      await FinancialAuditService.logEvent(
        {
          actorId,
          actorRole: "PAYMENT_GATEWAY",
          action: "TEACHER_PAYOUT_FAILED",
          entityType: "PAYOUT",
          entityId: payout.id,
          previousState: { status: payout.status },
          newState: {
            status: PayoutStatus.FAILED,
            failureReason,
          },
        },
        tx
      );

      return updatedPayout;
    });
  }

  /**
   * Final settlement & reconciliation of a payout against independently verified transfer evidence.
   * Atomically acquires PostgreSQL row lock (FOR UPDATE) to prevent race conditions or duplicate settlement.
   * Verifies authoritative telecom reference, records verifier identity, clears payout liability exactly once,
   * marks earnings and lesson sessions as PAID, and transitions status to RECONCILED.
   */
  static async reconcilePayout(payoutId: string, adminUserId: string, notes?: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Row-level lock on Payout to strictly serialize concurrent reconciliation attempts
      await tx.$queryRaw`
        SELECT id, status, "amountGnf", "providerDisbursementRef"
        FROM "Payout"
        WHERE id = ${payoutId}
        FOR UPDATE
      `;

      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: {
          earnings: true,
          teacherProfile: { include: { user: true } },
        },
      });

      if (!payout) {
        throw new FinancialError("Versement introuvable.", "PAYOUT_NOT_FOUND", 404);
      }

      // Idempotency: if already RECONCILED, return without duplicate ledger postings
      if (payout.status === PayoutStatus.RECONCILED) {
        return payout;
      }

      if (
        payout.status !== PayoutStatus.PAID &&
        payout.status !== PayoutStatus.RECONCILIATION_PENDING
      ) {
        throw new FinancialError(
          "Seul un versement en attente de rapprochement (RECONCILIATION_PENDING) ou décaissé (PAID) peut être rapproché.",
          "PAYOUT_NOT_RECONCILABLE",
          422
        );
      }

      // Must have independently verified transfer evidence (telecom reference >= 5 chars)
      if (!payout.providerDisbursementRef || payout.providerDisbursementRef.trim().length < 5) {
        throw new FinancialError(
          "Impossible de rapprocher un versement sans référence de transfert télécom valide (min. 5 caractères).",
          "MISSING_DISBURSEMENT_REF",
          422
        );
      }

      // 2. Mark TeacherEarnings as isPaidOut: true
      const earningIds = payout.earnings.map((e) => e.id);
      const sessionIds = payout.earnings.map((e) => e.sessionId);

      await tx.teacherEarning.updateMany({
        where: { id: { in: earningIds } },
        data: { isPaidOut: true },
      });

      // 3. Mark LessonSessions as PAID
      await tx.lessonSession.updateMany({
        where: { id: { in: sessionIds } },
        data: { earningsStatus: SessionEarningsStatus.PAID },
      });

      // 4. Clear Payout Liability (DEBIT 2040_PAYOUT_LIABILITY / CREDIT 1030_DISBURSEMENT_CLEARING) exactly once
      const existingSettlementJournal = await tx.ledgerJournal.findFirst({
        where: {
          referenceId: payout.id,
          referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
          entries: {
            some: {
              account: { code: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING },
              direction: LedgerEntryDirection.CREDIT,
            },
          },
        },
      });

      if (!existingSettlementJournal) {
        await DoubleEntryLedger.postJournalEntry(
          {
            referenceType: JournalReferenceType.TEACHER_PAYOUT_DISBURSEMENT,
            referenceId: payout.id,
            description: `Rapprochement et règlement versement ${payout.channel} (Réf: ${payout.providerDisbursementRef})`,
            postedBy: adminUserId,
            currency: "GNF",
            lines: [
              {
                accountCode: STANDARD_ACCOUNTS.PAYOUT_LIABILITY,
                direction: LedgerEntryDirection.DEBIT,
                amountGnf: payout.amountGnf,
              },
              {
                accountCode: STANDARD_ACCOUNTS.DISBURSEMENT_CLEARING,
                direction: LedgerEntryDirection.CREDIT,
                amountGnf: payout.amountGnf,
              },
            ],
          },
          tx
        );
      }

      // 5. Update payout status to RECONCILED with recorded verifier identity
      const updatedPayout = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: PayoutStatus.RECONCILED,
          reconciledAt: new Date(),
          reconciledBy: adminUserId,
          notes: notes ? `${payout.notes || ""} | ${notes.trim()}`.trim() : payout.notes,
        },
      });

      // 6. Auditable reconciliation event
      await FinancialAuditService.logEvent(
        {
          actorId: adminUserId,
          actorRole: "ADMINISTRATOR",
          action: "TEACHER_PAYOUT_RECONCILED_AND_SETTLED",
          entityType: "PAYOUT",
          entityId: payout.id,
          previousState: { status: payout.status },
          newState: {
            status: PayoutStatus.RECONCILED,
            reconciledBy: adminUserId,
            reconciledAt: updatedPayout.reconciledAt,
            providerDisbursementRef: payout.providerDisbursementRef,
            amountGnf: payout.amountGnf,
          },
        },
        tx
      );

      // 7. Notify Teacher of confirmed and reconciled settlement
      try {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.PAYOUT_DISBURSED,
            recipientUserId: payout.teacherProfile.userId,
            entityType: "PAYOUT",
            entityId: payout.id,
            title: "Versement rapproché et confirmé",
            message: `Votre versement de ${payout.amountGnf.toLocaleString("fr-FR")} GNF via ${payout.channel} a été vérifié et rapproché. Réf: ${payout.providerDisbursementRef}.`,
            linkUrl: "/teacher/finances",
            priority: NotificationPriority.HIGH,
            dedupKey: `payout_rec_${payout.id}`,
          },
          tx
        );
      } catch (notifErr) {
        console.warn("Notification notice on payout reconciliation:", notifErr);
      }

      return updatedPayout;
    });
  }

  /**
   * Retrieves all payouts for administrator financial management.
   */
  static async getAllPayoutsForAdmin() {
    return await prisma.payout.findMany({
      include: {
        teacherProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        destination: true,
        earnings: {
          select: { id: true, grossAmountGnf: true, teacherNetGnf: true, platformCommissionGnf: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Aggregates pending payouts (REQUESTED or APPROVED) into weekly batches grouped by teacher and operator.
   * Enables administrators to execute bulk weekly manual Mobile Money payouts.
   */
  static async getWeeklyPayoutBatches() {
    const pendingPayouts = await prisma.payout.findMany({
      where: {
        status: { in: [PayoutStatus.REQUESTED, PayoutStatus.APPROVED] },
      },
      include: {
        teacherProfile: {
          include: {
            user: { select: { id: true, fullName: true, email: true } },
          },
        },
        destination: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const batchMap = new Map<
      string,
      {
        batchKey: string;
        teacherProfileId: string;
        teacherName: string;
        teacherEmail: string;
        beneficiaryPhone: string;
        beneficiaryName: string;
        channel: string;
        totalAmountGnf: number;
        payoutCount: number;
        payoutIds: string[];
        hasUnapproved: boolean;
        oldestRequestDate: Date;
      }
    >();

    for (const p of pendingPayouts) {
      const key = `${p.teacherProfileId}_${p.channel}_${p.beneficiaryPhone}`;
      const existing = batchMap.get(key);

      if (existing) {
        existing.totalAmountGnf += p.amountGnf;
        existing.payoutCount += 1;
        existing.payoutIds.push(p.id);
        if (p.status === PayoutStatus.REQUESTED) {
          existing.hasUnapproved = true;
        }
      } else {
        batchMap.set(key, {
          batchKey: key,
          teacherProfileId: p.teacherProfileId,
          teacherName: p.teacherProfile?.user?.fullName || p.beneficiaryName,
          teacherEmail: p.teacherProfile?.user?.email || "",
          beneficiaryPhone: p.beneficiaryPhone,
          beneficiaryName: p.beneficiaryName,
          channel: p.channel,
          totalAmountGnf: p.amountGnf,
          payoutCount: 1,
          payoutIds: [p.id],
          hasUnapproved: p.status === PayoutStatus.REQUESTED,
          oldestRequestDate: p.createdAt,
        });
      }
    }

    return Array.from(batchMap.values());
  }

  /**
   * Executes a batch of weekly payouts with an authoritative telecom batch reference.
   * Atomically marks each payout as PAID, clears payout liabilities, and logs financial audit records.
   */
  static async executeWeeklyBatch(params: {
    payoutIds: string[];
    batchReference: string;
    adminUserId: string;
    notes?: string;
  }) {
    const { payoutIds, batchReference, adminUserId, notes } = params;

    if (!payoutIds || payoutIds.length === 0) {
      throw new FinancialError(
        "Aucun versement sélectionné pour le lot hebdomadaire.",
        "EMPTY_BATCH",
        400
      );
    }

    const uniquePayoutIds = Array.from(new Set(payoutIds));
    if (uniquePayoutIds.length !== payoutIds.length) {
      throw new FinancialError(
        "Le lot contient des identifiants de versement dupliqués.",
        "DUPLICATE_PAYOUT_IN_BATCH",
        400
      );
    }

    if (!batchReference || batchReference.trim().length < 5) {
      throw new FinancialError(
        "Veuillez fournir une référence de transfert de lot télécom valide (min. 5 caractères).",
        "INVALID_TELECOM_REF",
        400
      );
    }

    // Pre-validate that all payouts in the batch exist and are strictly APPROVED
    const payoutsToSettle = await prisma.payout.findMany({
      where: { id: { in: payoutIds } },
    });

    if (payoutsToSettle.length !== payoutIds.length) {
      throw new FinancialError(
        "Certaines demandes de versement du lot sont introuvables.",
        "PAYOUT_NOT_FOUND",
        404
      );
    }

    const unapproved = payoutsToSettle.filter(
      (p) => p.status !== PayoutStatus.APPROVED
    );
    if (unapproved.length > 0) {
      throw new FinancialError(
        `Le lot contient ${unapproved.length} demande(s) non approuvée(s). Toutes les demandes doivent être expressément autorisées (statut APPROVED) par un administrateur avant décaissement.`,
        "UNAPPROVED_PAYOUTS_IN_BATCH",
        422
      );
    }

    const settledPayouts = [];

    for (let i = 0; i < payoutIds.length; i++) {
      const pId = payoutIds[i];
      const individualRef =
        payoutIds.length === 1
          ? batchReference.trim()
          : `${batchReference.trim()}_#${i + 1}`;
      const result = await TeacherPayoutService.executeManualPayout({
        payoutId: pId,
        providerReference: individualRef,
        notes: notes || `Lot hebdomadaire: ${batchReference.trim()}`,
        adminUserId,
      });
      settledPayouts.push(result);
    }

    return {
      batchReference: batchReference.trim(),
      settledCount: settledPayouts.length,
      payouts: settledPayouts,
    };
  }
}
