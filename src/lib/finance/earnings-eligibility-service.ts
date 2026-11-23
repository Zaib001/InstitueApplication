/**
 * MONSIEUR FANYI — EARNINGS ELIGIBILITY & RELEASE SERVICE (M3.04)
 * Enforces strict pedagogical and financial verification before crediting teacher earnings.
 * Connects Parent Prepayment -> Funded Classroom -> Completed Lesson -> Parent Validation -> Eligible Earnings.
 */

import { prisma } from "@/lib/db/prisma";
import { Prisma, SessionStatus, NotificationPriority, NotificationEventType } from "@prisma/client";
import {
  SessionEarningsStatus,
  ClassroomFundingStatus,
  JournalReferenceType,
  LedgerEntryDirection,
  STANDARD_ACCOUNTS,
  SessionEarningsEvaluation,
  FinancialError,
  IneligibleEarningsError,
} from "./types";
import { CommissionPolicyService } from "./commission-policy-service";
import { DoubleEntryLedger } from "./double-entry-ledger";
import { FinancialAuditService } from "./audit-service";
import { NotificationService } from "@/lib/notifications/notification-service";

export class EarningsEligibilityService {
  /**
   * Evaluates whether a session meets all criteria for earnings release.
   */
  static async evaluateSessionEligibility(
    sessionId: string,
    txClient?: Prisma.TransactionClient
  ): Promise<SessionEarningsEvaluation> {
    const db = txClient || prisma;
    const session = await db.lessonSession.findUnique({
      where: { id: sessionId },
      include: {
        classroom: {
          include: {
            funding: true,
            teacherProfile: { include: { user: true } },
          },
        },
        package: true,
        report: true,
        approval: true,
        dispute: true,
      },
    });

    if (!session) {
      throw new FinancialError(
        `Séance introuvable: ${sessionId}`,
        "SESSION_NOT_FOUND",
        404
      );
    }

    const reasons: string[] = [];
    const classroom = session.classroom;
    const teacherProfileId = classroom.teacherProfileId;

    // 1. Teacher assignment check
    if (!teacherProfileId) {
      reasons.push("Aucun enseignant assigné à cette classe.");
    }

    // 2. Cancellation check
    if (session.status === SessionStatus.CANCELLED) {
      reasons.push("La séance a été annulée et ne peut faire l'objet d'aucune rémunération.");
    }

    // 3. Dispute check
    if (session.status === SessionStatus.PARENT_DISPUTED) {
      reasons.push("La séance fait l'objet d'une contestation parentale.");
    }
    if (session.dispute && (session.dispute.status === "OPEN" || session.dispute.status === "UNDER_REVIEW")) {
      reasons.push(
        `Un litige ouvert (${session.dispute.category || "NON_RESOLU"}) bloque le déblocage des gains.`
      );
    }

    // 4. Funding verification
    const funding = classroom.funding;
    const fundingStatus = funding ? funding.status : ClassroomFundingStatus.UNFUNDED;

    if (!funding || funding.status !== ClassroomFundingStatus.FUNDED) {
      reasons.push("La classe n'est pas approvisionnée par le parent.");
    }

    // 5. Lesson report verification
    if (!session.report) {
      reasons.push("Aucun compte-rendu de séance soumis par l'enseignant.");
    } else if (session.report.status === "DRAFT") {
      reasons.push("Le compte-rendu de séance est encore à l'état de brouillon.");
    } else if (
      session.report.status !== "VALIDATED" &&
      !session.approval &&
      session.status !== SessionStatus.PARENT_APPROVED
    ) {
      reasons.push(
        "Le compte-rendu n'a pas encore été validé par le parent d'élève."
      );
    }

    // 6. Duplicate crediting check
    if (
      session.earningsStatus === SessionEarningsStatus.ELIGIBLE ||
      session.earningsStatus === SessionEarningsStatus.RESERVED_FOR_PAYOUT ||
      session.earningsStatus === SessionEarningsStatus.PAID
    ) {
      reasons.push("La rémunération de cette séance a déjà été validée et créditée.");
    }

    // 7. Calculate gross session allocation
    let grossAmountGnf = session.allocatedAmountGnf;
    if (grossAmountGnf <= 0) {
      if (session.package) {
        const pkg = session.package;
        let allocatedFromPkg = 0;
        if (pkg.allocationsJson) {
          try {
            const allocations = JSON.parse(pkg.allocationsJson);
            if (Array.isArray(allocations) && allocations[session.sessionSequence - 1]) {
              allocatedFromPkg = allocations[session.sessionSequence - 1].allocatedAmountGnf;
            }
          } catch {
            // ignore
          }
        }

        if (allocatedFromPkg > 0) {
          grossAmountGnf = allocatedFromPkg;
        } else if (pkg.remainderGnf > 0 && (session.sessionSequence - 1) < pkg.remainderGnf) {
          grossAmountGnf = pkg.baseSessionRateGnf + 1;
        } else {
          grossAmountGnf = pkg.baseSessionRateGnf;
        }
      } else if (classroom.hourlyRateGnf) {
        const hours = (session.durationMinutes || 60) / 60;
        grossAmountGnf = Math.round(hours * classroom.hourlyRateGnf);
      } else {
        grossAmountGnf = 0;
      }
    }

    // 8. Available funding balance check
    if (funding && funding.availableBalanceGnf < grossAmountGnf) {
      reasons.push(
        `Solde approvisionné disponible (${funding.availableBalanceGnf} GNF) insuffisant pour couvrir la séance (${grossAmountGnf} GNF).`
      );
    }

    // 9. Immutable Commission Rate Snapshot
    // Prefer package-level agreed snapshot over global policy to protect historical earnings
    let commissionRatePercent = session.package?.commissionRatePercent;
    if (commissionRatePercent === undefined || commissionRatePercent === null) {
      if (session.package) {
        // Contracted package exists but lacks snapshot -> stop and flag for authorized reconciliation!
        reasons.push(
          "Instantané de commission manquant ou ambigu sur le forfait contracté. Réconciliation administrative requise."
        );
        commissionRatePercent = 0;
      } else {
        const activePolicy = await CommissionPolicyService.getActivePolicy();
        commissionRatePercent = activePolicy.platformPercent;
      }
    }

    const split = CommissionPolicyService.calculateSplit(
      grossAmountGnf,
      commissionRatePercent
    );

    const isEligible = reasons.length === 0;

    return {
      sessionId,
      classroomId: classroom.id,
      teacherProfileId: teacherProfileId || "",
      isEligible,
      reasons,
      grossAmountGnf,
      platformCommissionGnf: split.platformCommissionGnf,
      teacherNetGnf: split.teacherNetGnf,
      commissionRatePercent,
      fundingStatus,
    };
  }

  /**
   * Releases earnings for an eligible session and posts the double-entry journal atomically.
   */
  static async releaseSessionEarnings(
    sessionId: string,
    actorId = "SYSTEM_EARNINGS_RELEASE",
    txClient?: Prisma.TransactionClient
  ) {
    const runInTx = async (tx: Prisma.TransactionClient) => {
      const evaluation = await this.evaluateSessionEligibility(sessionId, tx);

      if (!evaluation.isEligible) {
        throw new IneligibleEarningsError(sessionId, evaluation.reasons);
      }

      // Re-fetch session with lock inside transaction
      const session = await tx.lessonSession.findUnique({
        where: { id: sessionId },
        include: {
          classroom: {
            include: {
              funding: true,
              teacherProfile: { include: { user: true } },
            },
          },
        },
      });

      if (
        !session ||
        session.earningsStatus === SessionEarningsStatus.ELIGIBLE ||
        session.earningsStatus === SessionEarningsStatus.RESERVED_FOR_PAYOUT ||
        session.earningsStatus === SessionEarningsStatus.PAID
      ) {
        throw new FinancialError(
          "Séance introuvable ou déjà rémunérée/traitée.",
          "ALREADY_CREDITED",
          409
        );
      }

      const { grossAmountGnf, platformCommissionGnf, teacherNetGnf, commissionRatePercent } =
        evaluation;

      // 1. Update ClassroomFunding balances atomically
      await tx.classroomFunding.update({
        where: { classroomId: evaluation.classroomId },
        data: {
          availableBalanceGnf: { decrement: grossAmountGnf },
          allocatedAmountGnf: { increment: grossAmountGnf },
        },
      });

      // 2. Update LessonSession: Mark as ELIGIBLE (ready for payout, but NOT paid yet!)
      const updatedSession = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          earningsStatus: SessionEarningsStatus.ELIGIBLE,
          allocatedAmountGnf: grossAmountGnf,
          platformCommissionGnf,
          teacherNetGnf,
          isFunded: true,
        },
      });

      // 3. Upsert TeacherEarning record for Milestone 2 / 3 compatibility
      const earning = await tx.teacherEarning.upsert({
        where: { sessionId },
        update: {
          grossAmountGnf,
          commissionRatePercent,
          platformCommissionGnf,
          teacherNetGnf,
          isPaidOut: false,
        },
        create: {
          teacherProfileId: evaluation.teacherProfileId,
          sessionId,
          grossAmountGnf,
          commissionRatePercent,
          platformCommissionGnf,
          teacherNetGnf,
          isPaidOut: false,
        },
      });

      // 4. Post Double-Entry General Ledger Journal:
      // DEBIT: 2020_CLASSROOM_FUNDS (Classroom liability reduced by gross)
      // CREDIT: 2030_TEACHER_PAYABLE (Teacher payable liability increased by net)
      // CREDIT: 4010_PLATFORM_COMMISSION (Platform commission revenue recognized)
      // Strict equality: DEBIT (gross) === CREDIT (net + commission)
      const journal = await DoubleEntryLedger.postJournalEntry(
        {
          referenceType: JournalReferenceType.LESSON_VALIDATION_EARNING,
          referenceId: sessionId,
          description: `Rémunération séance ${sessionId} (Classe: ${evaluation.classroomId}, Enseignant: ${evaluation.teacherProfileId})`,
          postedBy: actorId,
          currency: "GNF",
          lines: [
            {
              accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf: grossAmountGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.TEACHER_PAYABLE,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf: teacherNetGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.PLATFORM_COMMISSION,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf: platformCommissionGnf,
            },
          ],
        },
        tx
      );

      // 5. Log Financial Audit Event
      await FinancialAuditService.logEvent(
        {
          actorId,
          actorRole: "SYSTEM_EARNINGS_ENGINE",
          action: "SESSION_EARNINGS_RELEASED",
          entityType: "LESSON_SESSION",
          entityId: sessionId,
          previousState: { earningsStatus: session.earningsStatus },
          newState: {
            earningsStatus: SessionEarningsStatus.ELIGIBLE,
            grossAmountGnf,
            platformCommissionGnf,
            teacherNetGnf,
            earningId: earning.id,
            journalId: journal.id,
          },
          metadata: {
            classroomId: evaluation.classroomId,
            teacherProfileId: evaluation.teacherProfileId,
            commissionRatePercent,
          },
        },
        tx
      );

      // 6. Notify Teacher of Eligible Earnings (idempotent deduplication)
      const teacherUserId = session.classroom.teacherProfile?.userId;
      if (teacherUserId) {
        try {
          await NotificationService.publishNotificationEvent(
            {
              eventType: NotificationEventType.EARNINGS_ELIGIBLE,
              recipientUserId: teacherUserId,
              entityType: "LessonSession",
              entityId: sessionId,
              title: "Rémunération disponible",
              message: `Votre rémunération nette de ${teacherNetGnf.toLocaleString("fr-FR")} GNF pour le cours de ${session.classroom.subjectName} est désormais disponible.`,
              linkUrl: "/teacher/finances",
              priority: NotificationPriority.NORMAL,
              dedupKey: `earnings_eligible_${sessionId}`,
              emailPayload: {
                subjectName: session.classroom.subjectName,
                grossAmountGnf,
                teacherNetGnf,
                sessionId,
              },
            },
            tx
          );
        } catch (notifErr) {
          console.warn("Notification warning on earnings release:", notifErr);
        }
      }

      return {
        session: updatedSession,
        earning,
        journal,
      };
    };

    if (txClient) {
      return await runInTx(txClient);
    }
    return await prisma.$transaction(runInTx);
  }

  /**
   * Reverses eligible earnings for a session with compensating double-entry ledger entries.
   */
  static async reverseSessionEarnings(
    sessionId: string,
    reason: string,
    actorId = "SYSTEM_EARNINGS_REVERSAL",
    txClient?: Prisma.TransactionClient
  ) {
    const runInTx = async (tx: Prisma.TransactionClient) => {
      const session = await tx.lessonSession.findUnique({
        where: { id: sessionId },
        include: {
          classroom: {
            include: {
              funding: true,
              teacherProfile: { include: { user: true } },
            },
          },
          earning: true,
        },
      });

      if (!session) {
        throw new FinancialError(
          `Séance introuvable: ${sessionId}`,
          "SESSION_NOT_FOUND",
          404
        );
      }

      if (
        session.earningsStatus !== SessionEarningsStatus.ELIGIBLE ||
        Boolean(session.earning?.payoutId) ||
        Boolean(session.earning?.isPaidOut)
      ) {
        throw new FinancialError(
          `Impossible d'annuler directement les gains : statut actuel ${session.earningsStatus}. Les fonds réservés pour un versement, en cours de traitement ou déjà payés ne peuvent être annulés sans procédure de retenue/recouvrement autorisée.`,
          "INVALID_EARNINGS_STATUS",
          400
        );
      }

      const grossAmountGnf = session.allocatedAmountGnf;
      const platformCommissionGnf = session.platformCommissionGnf;
      const teacherNetGnf = session.teacherNetGnf;

      // 1. Restore ClassroomFunding balances
      if (session.classroom.funding) {
        await tx.classroomFunding.update({
          where: { classroomId: session.classroomId },
          data: {
            availableBalanceGnf: { increment: grossAmountGnf },
            allocatedAmountGnf: { decrement: grossAmountGnf },
          },
        });
      }

      // 2. Update LessonSession: Transition to REVERSED
      const updatedSession = await tx.lessonSession.update({
        where: { id: sessionId },
        data: {
          earningsStatus: SessionEarningsStatus.REVERSED,
        },
      });

      // 3. Update TeacherEarning
      if (session.earning) {
        await tx.teacherEarning.update({
          where: { id: session.earning.id },
          data: {
            isPaidOut: false,
          },
        });
      }

      // 4. Post Compensating Double-Entry Journal:
      // DEBIT: 2030_TEACHER_PAYABLE (Cancel teacher liability)
      // DEBIT: 4010_PLATFORM_COMMISSION (Cancel platform revenue)
      // CREDIT: 2020_CLASSROOM_FUNDS (Restore classroom funds liability)
      const journal = await DoubleEntryLedger.postJournalEntry(
        {
          referenceType: JournalReferenceType.COMPENSATING_ADJUSTMENT,
          referenceId: sessionId,
          description: `Annulation des gains séance ${sessionId} : ${reason}`,
          postedBy: actorId,
          currency: "GNF",
          lines: [
            {
              accountCode: STANDARD_ACCOUNTS.TEACHER_PAYABLE,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf: teacherNetGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.PLATFORM_COMMISSION,
              direction: LedgerEntryDirection.DEBIT,
              amountGnf: platformCommissionGnf,
            },
            {
              accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
              direction: LedgerEntryDirection.CREDIT,
              amountGnf: grossAmountGnf,
            },
          ],
        },
        tx
      );

      // 5. Audit Log
      await FinancialAuditService.logEvent(
        {
          actorId,
          actorRole: "ADMINISTRATOR",
          action: "SESSION_EARNINGS_REVERSED",
          entityType: "LESSON_SESSION",
          entityId: sessionId,
          previousState: { earningsStatus: SessionEarningsStatus.ELIGIBLE },
          newState: {
            earningsStatus: SessionEarningsStatus.REVERSED,
            grossAmountGnf,
            reason,
            journalId: journal.id,
          },
          metadata: {
            classroomId: session.classroomId,
            teacherProfileId: session.classroom.teacherProfileId,
          },
        },
        tx
      );

      // 6. Notify Teacher & Admin of reversal
      const teacherUserId = session.classroom.teacherProfile?.userId;
      if (teacherUserId) {
        try {
          await NotificationService.publishNotificationEvent(
            {
              eventType: NotificationEventType.EARNINGS_REVERSED,
              recipientUserId: teacherUserId,
              entityType: "LessonSession",
              entityId: sessionId,
              title: "Ajustement de rémunération",
              message: `La rémunération de ${teacherNetGnf.toLocaleString("fr-FR")} GNF pour le cours de ${session.classroom.subjectName} a été régularisée (${reason}).`,
              linkUrl: "/teacher/finances",
              priority: NotificationPriority.HIGH,
              dedupKey: `earnings_reversed_${sessionId}`,
            },
            tx
          );
        } catch (notifErr) {
          console.warn("Notification warning on earnings reversal:", notifErr);
        }
      }

      return { session: updatedSession, journal };
    };

    if (txClient) {
      return await runInTx(txClient);
    }
    return await prisma.$transaction(runInTx);
  }

  /**
   * Retrieves an authoritative earnings summary for a teacher.
   */
  static async getTeacherEarningsSummary(teacherProfileId: string) {
    const [earnings, pendingSessions, payouts] = await Promise.all([
      prisma.teacherEarning.findMany({
        where: { teacherProfileId },
        include: {
          session: {
            include: {
              classroom: {
                include: {
                  student: {
                    select: {
                      id: true,
                      fullName: true,
                      gradeLevel: true,
                    },
                  },
                },
              },
              approval: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lessonSession.findMany({
        where: {
          classroom: { teacherProfileId },
          status: SessionStatus.TEACHER_COMPLETED,
          earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
        },
        include: {
          classroom: {
            include: {
              student: {
                select: { id: true, fullName: true, gradeLevel: true },
              },
            },
          },
          package: true,
        },
      }),
      prisma.payout.findMany({
        where: { teacherProfileId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Calculate sums
    let availableGnf = 0;
    let reservedGnf = 0;
    let paidGnf = 0;

    for (const e of earnings) {
      if (e.isPaidOut || e.session.earningsStatus === SessionEarningsStatus.PAID) {
        paidGnf += e.teacherNetGnf;
      } else if (e.session.earningsStatus === SessionEarningsStatus.RESERVED_FOR_PAYOUT) {
        reservedGnf += e.teacherNetGnf;
      } else if (e.session.earningsStatus === SessionEarningsStatus.ELIGIBLE) {
        availableGnf += e.teacherNetGnf;
      }
    }

    // Pending validation estimated net
    let pendingValidationGnf = 0;
    for (const ps of pendingSessions) {
      const gross = ps.allocatedAmountGnf || ps.package?.baseSessionRateGnf || 0;
      const rate = ps.package?.commissionRatePercent || 15;
      const net = gross - Math.round((gross * rate) / 100);
      pendingValidationGnf += net;
    }

    return {
      availableGnf,
      pendingValidationGnf,
      reservedGnf,
      paidGnf,
      totalEarnedHistoricalGnf: availableGnf + reservedGnf + paidGnf,
      earnings,
      pendingSessions,
      payouts,
    };
  }

  /**
   * Reconciles previously approved sessions when classroom funding later arrives.
   * Evaluates each approved, unpaid session sequentially against verified available balance.
   */
  static async reconcileUnfundedApprovedSessions(
    classroomId: string,
    actorId = "SYSTEM_FUNDING_RECONCILIATION",
    txClient?: Prisma.TransactionClient
  ) {
    const runInTx = async (tx: Prisma.TransactionClient) => {
      const funding = await tx.classroomFunding.findUnique({
        where: { classroomId },
      });

      if (!funding || funding.status !== ClassroomFundingStatus.FUNDED || funding.availableBalanceGnf <= 0) {
        return { reconciledCount: 0, totalReleasedGnf: 0 };
      }

      // Find sessions that have been approved by the parent but whose earnings are still PENDING_VALIDATION
      const pendingApprovedSessions = await tx.lessonSession.findMany({
        where: {
          classroomId,
          status: SessionStatus.PARENT_APPROVED,
          earningsStatus: SessionEarningsStatus.PENDING_VALIDATION,
        },
        orderBy: { sessionSequence: "asc" },
      });

      let reconciledCount = 0;
      let totalReleasedGnf = 0;

      for (const session of pendingApprovedSessions) {
        const evalResult = await this.evaluateSessionEligibility(session.id, tx);
        if (evalResult.isEligible) {
          await this.releaseSessionEarnings(session.id, actorId, tx);
          reconciledCount++;
          totalReleasedGnf += evalResult.grossAmountGnf;
        } else {
          // If not eligible (e.g. available balance insufficient for subsequent sessions), log audit notice and stop
          await FinancialAuditService.logEvent(
            {
              actorId,
              actorRole: "SYSTEM_EARNINGS_ENGINE",
              action: "EARNINGS_RELEASE_DEFERRED",
              entityType: "LESSON_SESSION",
              entityId: session.id,
              metadata: {
                classroomId,
                reasons: evalResult.reasons,
                availableBalanceGnf: funding.availableBalanceGnf,
              },
            },
            tx
          );
          break;
        }
      }

      return { reconciledCount, totalReleasedGnf };
    };

    if (txClient) {
      return await runInTx(txClient);
    }
    return await prisma.$transaction(runInTx);
  }
}
