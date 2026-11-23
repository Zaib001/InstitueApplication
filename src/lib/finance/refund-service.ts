/**
 * MONSIEUR FANYI — REFUND & RECONCILIATION SERVICE (M3.05 / M3.06)
 * Concurrency-safe parent refunds, dispute settlements, and compensating journal entries.
 */

import { prisma } from "@/lib/db/prisma";
import {
  ClassroomFundingStatus,
  JournalReferenceType,
  LedgerEntryDirection,
  STANDARD_ACCOUNTS,
  FinancialError,
} from "./types";
import { DoubleEntryLedger } from "./double-entry-ledger";
import { FinancialAuditService } from "./audit-service";
import { NotificationService } from "@/lib/notifications/notification-service";
import { NotificationEventType, NotificationPriority } from "@prisma/client";
import crypto from "crypto";

export interface ProcessClassroomRefundParams {
  classroomId: string;
  refundAmountGnf: number;
  reason: string;
  adminId: string;
  refundCaseId?: string;
  idempotencyKey?: string;
}

export interface RequestParentRefundParams {
  parentUserId: string;
  classroomId: string;
  amountGnf: number;
  reason: string;
  sessionId?: string;
}

export interface ApproveRefundParams {
  refundCaseId: string;
  adminId: string;
  approvedAmountGnf?: number;
  notes?: string;
}

export interface RejectOrCancelRefundParams {
  refundCaseId: string;
  actorUserId: string;
  reason: string;
  actorRole?: "ADMINISTRATOR" | "PARENT";
}

export class RefundService {
  /**
   * Retrieves the authoritative refundable balance for a classroom.
   * Only unearned, unallocated prepaid funds can be refunded.
   * Subtracts any in-flight pending/reserved refund cases.
   */
  static async getRefundableBalance(classroomId: string) {
    const funding = await prisma.classroomFunding.findUnique({
      where: { classroomId },
    });

    if (!funding) {
      return {
        classroomId,
        availableBalanceGnf: 0,
        allocatedAmountGnf: 0,
        refundedAmountGnf: 0,
        totalFundedAmountGnf: 0,
        reservedRefundAmountGnf: 0,
        netAvailableRefundableGnf: 0,
        status: ClassroomFundingStatus.UNFUNDED,
        isRefundable: false,
      };
    }

    const pendingRefunds = await prisma.refundCase.findMany({
      where: {
        classroomId,
        status: { in: ["REQUESTED", "APPROVED"] },
      },
      select: { requestedAmountGnf: true, approvedAmountGnf: true },
    });

    const reservedRefundAmountGnf = pendingRefunds.reduce(
      (sum, r) => sum + (r.approvedAmountGnf || r.requestedAmountGnf || 0),
      0
    );

    const netAvailableRefundableGnf = Math.max(0, funding.availableBalanceGnf - reservedRefundAmountGnf);

    return {
      classroomId,
      availableBalanceGnf: funding.availableBalanceGnf,
      allocatedAmountGnf: funding.allocatedAmountGnf,
      refundedAmountGnf: funding.refundedAmountGnf,
      totalFundedAmountGnf: funding.totalFundedAmountGnf,
      reservedRefundAmountGnf,
      netAvailableRefundableGnf,
      status: funding.status,
      isRefundable: netAvailableRefundableGnf > 0,
    };
  }

  /**
   * Parent requests a refund for unearned, available prepaid classroom funds.
   * Uses PostgreSQL row-level locking (FOR UPDATE) within transaction to prevent race conditions.
   */
  static async requestParentRefund(params: RequestParentRefundParams) {
    const { parentUserId, classroomId, amountGnf, reason, sessionId } = params;

    if (!Number.isInteger(amountGnf) || amountGnf <= 0) {
      throw new FinancialError(
        "Le montant de remboursement demandé doit être un entier positif strict.",
        "INVALID_REFUND_AMOUNT",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Acquire row lock on ClassroomFunding to serialize concurrent requests for this classroom
      const lockedRows = await tx.$queryRaw<{ id: string; availableBalanceGnf: number }[]>`
        SELECT id, "availableBalanceGnf"
        FROM "ClassroomFunding"
        WHERE "classroomId" = ${classroomId}
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0) {
        throw new FinancialError(
          "Aucun approvisionnement actif trouvé pour cette classe.",
          "NO_ACTIVE_FUNDING",
          400
        );
      }

      const classroom = await tx.classroom.findUnique({
        where: { id: classroomId },
        include: {
          student: { include: { parent: true } },
          funding: true,
        },
      });

      if (!classroom) {
        throw new FinancialError("Classe introuvable.", "CLASSROOM_NOT_FOUND", 404);
      }

      if (classroom.student.parent.userId !== parentUserId) {
        throw new FinancialError(
          "Accès refusé. Vous n'êtes pas le parent titulaire de cette classe.",
          "UNAUTHORIZED",
          403
        );
      }

      const funding = classroom.funding;
      if (!funding || funding.status !== ClassroomFundingStatus.FUNDED) {
        throw new FinancialError(
          "Aucun approvisionnement actif trouvé pour cette classe.",
          "NO_ACTIVE_FUNDING",
          400
        );
      }

      if (amountGnf > funding.availableBalanceGnf) {
        throw new FinancialError(
          `Le montant demandé (${amountGnf.toLocaleString("fr-FR")} GNF) excède le solde disponible remboursable (${funding.availableBalanceGnf.toLocaleString("fr-FR")} GNF). Les cours déjà dispensés et validés ne peuvent faire l'objet d'un remboursement direct.`,
          "EXCEEDS_REFUNDABLE_BALANCE",
          422
        );
      }

      // 2. Check for duplicate pending requests
      const existingCase = await tx.refundCase.findFirst({
        where: {
          classroomId,
          status: "REQUESTED",
        },
      });

      if (existingCase) {
        throw new FinancialError(
          "Une demande de remboursement est déjà en cours d'examen pour cette classe.",
          "DUPLICATE_REFUND_REQUEST",
          409
        );
      }

      // 3. Compute in-flight reservations
      const activeRefunds = await tx.refundCase.findMany({
        where: {
          classroomId,
          status: { in: ["REQUESTED", "APPROVED"] },
        },
        select: { requestedAmountGnf: true, approvedAmountGnf: true },
      });

      const totalReservedGnf = activeRefunds.reduce(
        (sum, r) => sum + (r.approvedAmountGnf || r.requestedAmountGnf || 0),
        0
      );

      const netAvailableGnf = funding.availableBalanceGnf - totalReservedGnf;

      if (amountGnf > netAvailableGnf) {
        throw new FinancialError(
          `Le montant demandé (${amountGnf.toLocaleString("fr-FR")} GNF) excède le solde disponible remboursable (${funding.availableBalanceGnf.toLocaleString("fr-FR")} GNF). Les cours déjà dispensés et validés ne peuvent faire l'objet d'un remboursement direct.`,
          "EXCEEDS_REFUNDABLE_BALANCE",
          422
        );
      }

      // 4. Create RefundCase atomically
      const refundCase = await tx.refundCase.create({
        data: {
          classroomId,
          sessionId: sessionId || null,
          requestedAmountGnf: amountGnf,
          status: "REQUESTED",
          reason: reason.trim(),
        },
      });

      await FinancialAuditService.logEvent(
        {
          actorId: parentUserId,
          actorRole: "PARENT",
          action: "PARENT_REFUND_REQUESTED",
          entityType: "REFUND_CASE",
          entityId: refundCase.id,
          newState: {
            classroomId,
            requestedAmountGnf: amountGnf,
            reason: reason.trim(),
          },
        },
        tx
      );

      return refundCase;
    });
  }

  /**
   * Approves a refund request without yet disbursing cash or altering funding.
   * Locks the approved amount as RESERVED.
   */
  static async approveRefund(params: ApproveRefundParams) {
    const { refundCaseId, adminId, approvedAmountGnf, notes } = params;

    return await prisma.$transaction(async (tx) => {
      const refundCase = await tx.refundCase.findUnique({
        where: { id: refundCaseId },
        include: { classroom: { include: { funding: true } } },
      });

      if (!refundCase) {
        throw new FinancialError("Dossier de remboursement introuvable.", "REFUND_NOT_FOUND", 404);
      }

      if (refundCase.status !== "REQUESTED") {
        throw new FinancialError(
          `Impossible d'approuver une demande au statut actuel : ${refundCase.status}.`,
          "INVALID_REFUND_STATUS",
          400
        );
      }

      const classroomId = refundCase.classroomId!;
      await tx.$queryRaw`
        SELECT id, "availableBalanceGnf"
        FROM "ClassroomFunding"
        WHERE "classroomId" = ${classroomId}
        FOR UPDATE
      `;

      const funding = refundCase.classroom?.funding;
      if (!funding) {
        throw new FinancialError("Approvisionnement introuvable.", "FUNDING_NOT_FOUND", 404);
      }

      const effectiveApprovedAmount = approvedAmountGnf ?? refundCase.requestedAmountGnf;
      if (effectiveApprovedAmount > funding.availableBalanceGnf) {
        throw new FinancialError(
          `Le montant approuvé (${effectiveApprovedAmount.toLocaleString("fr-FR")} GNF) excède le solde disponible (${funding.availableBalanceGnf.toLocaleString("fr-FR")} GNF).`,
          "EXCEEDS_REFUNDABLE_BALANCE",
          422
        );
      }

      const updated = await tx.refundCase.update({
        where: { id: refundCaseId },
        data: {
          status: "APPROVED",
          approvedAmountGnf: effectiveApprovedAmount,
          adminDecisionNotes: notes ? notes.trim() : refundCase.adminDecisionNotes,
        },
      });

      await FinancialAuditService.logEvent(
        {
          actorId: adminId,
          actorRole: "ADMINISTRATOR",
          action: "REFUND_APPROVED",
          entityType: "REFUND_CASE",
          entityId: refundCase.id,
          previousState: { status: refundCase.status },
          newState: { status: "APPROVED", approvedAmountGnf: effectiveApprovedAmount },
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Rejects or cancels a refund request, safely releasing its reservation.
   */
  static async rejectOrCancelRefund(params: RejectOrCancelRefundParams) {
    const { refundCaseId, actorUserId, reason, actorRole = "ADMINISTRATOR" } = params;

    if (!reason || reason.trim().length < 5) {
      throw new FinancialError(
        "Veuillez spécifier un motif explicite (min. 5 caractères).",
        "INVALID_REASON",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      const refundCase = await tx.refundCase.findUnique({
        where: { id: refundCaseId },
      });

      if (!refundCase) {
        throw new FinancialError("Dossier de remboursement introuvable.", "REFUND_NOT_FOUND", 404);
      }

      if (refundCase.status === "PROCESSED") {
        throw new FinancialError(
          "Impossible d'annuler un remboursement déjà réglé et comptabilisé.",
          "REFUND_ALREADY_PROCESSED",
          409
        );
      }

      const updated = await tx.refundCase.update({
        where: { id: refundCaseId },
        data: {
          status: "REJECTED",
          adminDecisionNotes: reason.trim(),
        },
      });

      await FinancialAuditService.logEvent(
        {
          actorId: actorUserId,
          actorRole,
          action: "REFUND_REJECTED",
          entityType: "REFUND_CASE",
          entityId: refundCase.id,
          previousState: { status: refundCase.status },
          newState: { status: "REJECTED", reason: reason.trim() },
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Processes an administrator-approved refund from available classroom funds back to parent clearing.
   * Atomically locks funding row, updates balances, posts balanced ledger journal, and marks status PROCESSED.
   */
  static async processClassroomRefund(params: ProcessClassroomRefundParams) {
    const { classroomId, refundAmountGnf, reason, adminId, refundCaseId } = params;

    if (!Number.isInteger(refundAmountGnf) || refundAmountGnf <= 0) {
      throw new FinancialError(
        "Le montant de remboursement doit être un entier positif strict.",
        "INVALID_REFUND_AMOUNT",
        400
      );
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Lock ClassroomFunding row for update
      await tx.$queryRaw`
        SELECT id, "availableBalanceGnf"
        FROM "ClassroomFunding"
        WHERE "classroomId" = ${classroomId}
        FOR UPDATE
      `;

      // 2. If refundCaseId is supplied, check duplicate processing protection
      if (refundCaseId) {
        const existingCase = await tx.refundCase.findUnique({
          where: { id: refundCaseId },
        });

        if (!existingCase) {
          throw new FinancialError("Dossier de remboursement introuvable.", "REFUND_NOT_FOUND", 404);
        }

        if (existingCase.status === "PROCESSED") {
          throw new FinancialError(
            "Ce dossier de remboursement a déjà été traité et réglé.",
            "REFUND_ALREADY_PROCESSED",
            409
          );
        }
      }

      const funding = await tx.classroomFunding.findUnique({
        where: { classroomId },
        include: {
          classroom: {
            include: {
              student: {
                include: {
                  parent: {
                    include: { user: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!funding) {
        throw new FinancialError(
          "Aucun approvisionnement trouvé pour cette classe.",
          "FUNDING_NOT_FOUND",
          404
        );
      }

      if (funding.availableBalanceGnf < refundAmountGnf) {
        throw new FinancialError(
          `Solde disponible insuffisant (${funding.availableBalanceGnf.toLocaleString("fr-FR")} GNF) pour rembourser ${refundAmountGnf.toLocaleString("fr-FR")} GNF.`,
          "INSUFFICIENT_AVAILABLE_FUNDS",
          422
        );
      }

      const newAvailable = funding.availableBalanceGnf - refundAmountGnf;
      const newRefunded = funding.refundedAmountGnf + refundAmountGnf;
      const newStatus =
        newAvailable === 0 && funding.allocatedAmountGnf === 0
          ? ClassroomFundingStatus.REFUNDED
          : funding.status;

      // 3. Update ClassroomFunding
      const updatedFunding = await tx.classroomFunding.update({
        where: { classroomId },
        data: {
          availableBalanceGnf: newAvailable,
          refundedAmountGnf: newRefunded,
          status: newStatus,
        },
      });

      // 4. Post Compensating Double-Entry General Ledger Journal:
      // DEBIT: 2020_CLASSROOM_FUNDS (Liability reduced)
      // CREDIT: 1020_REFUND_CLEARING (Asset/settlement clearing credited)
      const journalReferenceId = `ref_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const journal = await DoubleEntryLedger.postJournalEntry(
        {
          referenceType: JournalReferenceType.REFUND_SETTLEMENT,
          referenceId: journalReferenceId,
          description: `Remboursement classe ${classroomId} : ${reason}`,
          postedBy: adminId,
          currency: "GNF",
          lines: [
            {
              accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf: refundAmountGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.REFUND_CLEARING,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf: refundAmountGnf,
            },
          ],
        },
        tx
      );

      // 5. Upsert / Update RefundCase
      let refundCase;
      if (refundCaseId) {
        refundCase = await tx.refundCase.update({
          where: { id: refundCaseId },
          data: {
            approvedAmountGnf: refundAmountGnf,
            status: "PROCESSED",
            adminDecisionNotes: reason,
            processedAt: new Date(),
          },
        });
      } else {
        refundCase = await tx.refundCase.create({
          data: {
            classroomId,
            requestedAmountGnf: refundAmountGnf,
            approvedAmountGnf: refundAmountGnf,
            status: "PROCESSED",
            reason,
            adminDecisionNotes: `Remboursement traité par l'administrateur ${adminId}`,
            processedAt: new Date(),
          },
        });
      }

      // 6. Log Financial Audit Event
      await FinancialAuditService.logEvent(
        {
          actorId: adminId,
          actorRole: "ADMINISTRATOR",
          action: "CLASSROOM_REFUND_PROCESSED",
          entityType: "CLASSROOM_FUNDING",
          entityId: funding.id,
          previousState: {
            availableBalanceGnf: funding.availableBalanceGnf,
            refundedAmountGnf: funding.refundedAmountGnf,
            status: funding.status,
          },
          newState: {
            availableBalanceGnf: newAvailable,
            refundedAmountGnf: newRefunded,
            status: newStatus,
            journalId: journal.id,
            refundCaseId: refundCase.id,
          },
          metadata: {
            reason,
            classroomId,
          },
        },
        tx
      );

      // 7. Notify Parent
      const parentUserId = funding.classroom.student.parent.userId;
      try {
        await NotificationService.publishNotificationEvent(
          {
            eventType: NotificationEventType.REFUND_PROCESSED,
            recipientUserId: parentUserId,
            entityType: "CLASSROOM",
            entityId: classroomId,
            title: "Remboursement confirmé",
            message: `Un remboursement de ${refundAmountGnf.toLocaleString("fr-FR")} GNF a été validé pour le cours de ${funding.classroom.subjectName}.`,
            linkUrl: "/parent/payments",
            priority: NotificationPriority.HIGH,
            dedupKey: `refund_proc_${journalReferenceId}`,
          },
          tx
        );
      } catch (notifErr) {
        console.warn("Notification notice on refund processed:", notifErr);
      }

      return {
        funding: updatedFunding,
        journal,
        refundCase,
      };
    });
  }

  /**
   * Retrieves all refund cases for administrator oversight.
   */
  static async getAllRefundCasesForAdmin() {
    return await prisma.refundCase.findMany({
      include: {
        classroom: {
          include: {
            student: { include: { parent: { include: { user: true } } } },
            teacherProfile: { include: { user: true } },
          },
        },
        session: true,
        dispute: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
