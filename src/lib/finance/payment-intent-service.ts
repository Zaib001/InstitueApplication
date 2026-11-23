/**
 * MONSIEUR FANYI — PAYMENT INTENT & PREPAYMENT SERVICE
 * Manages the lifecycle of payment intents, transaction settlements, idempotency,
 * and automatic classroom funding.
 */

import { prisma } from "@/lib/db/prisma";
import {
  CreatePaymentIntentParams,
  ConfirmPaymentTransactionParams,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  ClassroomFundingStatus,
  JournalReferenceType,
  LedgerEntryDirection,
  LedgerPostingLine,
  STANDARD_ACCOUNTS,
  FinancialError,
  DuplicatePaymentError,
} from "./types";
import { DoubleEntryLedger } from "./double-entry-ledger";
import { FinancialAuditService } from "./audit-service";
import { EarningsEligibilityService } from "./earnings-eligibility-service";
import {
  ClassroomStatus,
  NotificationEventType,
  NotificationPriority,
} from "@prisma/client";
import { NotificationService } from "@/lib/notifications/notification-service";
import { formatGnf } from "@/lib/money/currency";
import crypto from "crypto";

export class PaymentIntentService {
  /**
   * Calculates parent fee ensuring minimum 2% integer contribution.
   */
  static calculateParentFee(
    courseAmountGnf: number,
    feePercent = 2
  ): { courseAmountGnf: number; parentFeeGnf: number; totalAmountGnf: number; feePercent: number } {
    if (!Number.isInteger(courseAmountGnf) || courseAmountGnf <= 0) {
      throw new FinancialError(
        "Le montant des cours doit être un entier positif strict (GNF).",
        "INVALID_AMOUNT",
        400
      );
    }
    const effectivePercent = Math.max(2, feePercent);
    const parentFeeGnf = Math.round((courseAmountGnf * effectivePercent) / 100);
    return {
      courseAmountGnf,
      parentFeeGnf,
      totalAmountGnf: courseAmountGnf + parentFeeGnf,
      feePercent: effectivePercent,
    };
  }

  /**
   * Creates a prepayment intent before any external money request or modal invocation.
   */
  static async createPaymentIntent(params: CreatePaymentIntentParams) {
    const {
      parentUserId,
      classroomId,
      packageId,
      customerCurrency = "GNF",
      customerAmount,
      provider,
      selectedMethod,
      idempotencyKey,
      metadata = {},
      expirationMinutes = 60,
    } = params;

    let courseAmountGnf = params.courseAmountGnf;
    let parentFeeGnf = params.parentFeeGnf;
    let amountGnf = params.amountGnf;

    if (courseAmountGnf !== undefined) {
      if (!Number.isInteger(courseAmountGnf) || courseAmountGnf <= 0) {
        throw new FinancialError(
          "Le montant des cours doit être un entier positif strict (GNF).",
          "INVALID_AMOUNT",
          400
        );
      }
      const calculated = PaymentIntentService.calculateParentFee(courseAmountGnf);
      parentFeeGnf =
        parentFeeGnf !== undefined
          ? Math.max(calculated.parentFeeGnf, parentFeeGnf)
          : calculated.parentFeeGnf;
      amountGnf = courseAmountGnf + parentFeeGnf;
    } else {
      if (!amountGnf || !Number.isInteger(amountGnf) || amountGnf <= 0) {
        throw new FinancialError(
          "Le montant de l'intention de paiement doit être un entier positif strict (GNF).",
          "INVALID_AMOUNT",
          400
        );
      }
      if (parentFeeGnf !== undefined) {
        courseAmountGnf = amountGnf - parentFeeGnf;
      } else {
        // Backwards compatibility with standard test suite calls
        courseAmountGnf = amountGnf;
        parentFeeGnf = 0;
      }
    }

    // Idempotency check
    const existing = await prisma.paymentIntent.findUnique({
      where: { idempotencyKey },
      include: {
        transactions: true,
      },
    });

    if (existing) {
      if (existing.amountGnf !== amountGnf) {
        throw new FinancialError(
          "Une intention de paiement avec cette clé d'idempotence existe déjà avec un montant différent.",
          "IDEMPOTENCY_CONFLICT",
          409
        );
      }
      return existing;
    }

    // Check parent exists
    const parent = await prisma.user.findUnique({
      where: { id: parentUserId },
    });
    if (!parent) {
      throw new FinancialError(
        "Utilisateur parent introuvable.",
        "PARENT_NOT_FOUND",
        404
      );
    }

    // Validate classroom if specified
    if (classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });
      if (!classroom) {
        throw new FinancialError(
          "Classe introuvable pour cette intention de paiement.",
          "CLASSROOM_NOT_FOUND",
          404
        );
      }
    }

    // Validate package if specified
    if (packageId) {
      const pkg = await prisma.tutoringPackage.findUnique({
        where: { id: packageId },
      });
      if (!pkg) {
        throw new FinancialError(
          "Forfait introuvable pour cette intention de paiement.",
          "PACKAGE_NOT_FOUND",
          404
        );
      }
    }

    const intentReference =
      params.intentReference ||
      `pi_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const intent = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentIntent.create({
        data: {
          intentReference,
          parentUserId,
          classroomId,
          packageId,
          amountGnf,
          courseAmountGnf,
          parentFeeGnf,
          customerCurrency,
          customerAmount: customerAmount ?? amountGnf,
          provider,
          selectedMethod,
          status: PaymentIntentStatus.CREATED,
          idempotencyKey,
          expiresAt,
          metadataJson: JSON.stringify(metadata),
        },
      });

      await FinancialAuditService.logEvent(
        {
          actorId: parentUserId,
          actorRole: "PARENT",
          actorUserId: parentUserId,
          action: "PAYMENT_INTENT_CREATED",
          entityType: "PAYMENT_INTENT",
          entityId: created.id,
          newState: {
            intentReference,
            amountGnf,
            courseAmountGnf,
            parentFeeGnf,
            provider,
            classroomId,
            packageId,
          },
        },
        tx
      );

      return created;
    });

    return intent;
  }

  /**
   * Confirms payment receipt from webhook or settlement notification.
   * Atomically transitions intent to SUCCEEDED, creates settlement transaction,
   * funds the classroom, and records balanced double-entry ledger journal.
   */
  static async confirmPaymentTransaction(
    params: ConfirmPaymentTransactionParams
  ) {
    const {
      intentReference,
      providerTransactionId,
      settledAmountGnf,
      providerFeeGnf = 0,
      currency,
      rawPayload = {},
      actorId = "SYSTEM_PAYMENT_GATEWAY",
      idempotencyKey,
      verifiedAt = new Date(),
      allowLateReconciliation = false,
    } = params;

    // 1. Initial status & expiration validation outside transaction
    const existingIntent = await prisma.paymentIntent.findUnique({
      where: { intentReference },
    });

    if (!existingIntent) {
      throw new FinancialError(
        `Intention de paiement introuvable: ${intentReference}`,
        "INTENT_NOT_FOUND",
        404
      );
    }

    if (existingIntent.status === PaymentIntentStatus.CANCELLED) {
      throw new FinancialError(
        `L'intention de paiement ${intentReference} est déjà annulée.`,
        "INTENT_TERMINATED",
        400
      );
    }

    const isExpired =
      existingIntent.status === PaymentIntentStatus.EXPIRED ||
      Boolean(existingIntent.expiresAt && existingIntent.expiresAt < new Date());

    if (isExpired && !allowLateReconciliation) {
      if (existingIntent.status !== PaymentIntentStatus.EXPIRED) {
        await prisma.paymentIntent.update({
          where: { id: existingIntent.id },
          data: { status: PaymentIntentStatus.EXPIRED },
        });
      }
      throw new FinancialError(
        `L'intention de paiement ${intentReference} a expiré.`,
        "INTENT_EXPIRED",
        410
      );
    }

    const isLatePayment = isExpired && allowLateReconciliation;

    try {
      return await prisma.$transaction(async (tx) => {
      // 1. Fetch Intent inside transaction with relations
      const intent = await tx.paymentIntent.findUnique({
        where: { intentReference },
        include: {
          classroom: {
            include: {
              student: true,
              teacherProfile: {
                include: { user: true },
              },
            },
          },
          package: true,
          transactions: true,
        },
      });

      if (!intent) {
        throw new FinancialError(
          `Intention de paiement introuvable: ${intentReference}`,
          "INTENT_NOT_FOUND",
          404
        );
      }

      // 2. Check for duplicate transaction or idempotency
      const existingTx = await tx.paymentTransaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingTx) {
        return {
          intent,
          transaction: existingTx,
          alreadyProcessed: true,
          requiresReconciliation:
            intent.status === PaymentIntentStatus.REQUIRES_RECONCILIATION,
        };
      }

      // Check if intent is already settled or in reconciliation
      if (
        intent.status === PaymentIntentStatus.SUCCEEDED ||
        intent.status === PaymentIntentStatus.REQUIRES_RECONCILIATION
      ) {
        throw new DuplicatePaymentError(intentReference);
      }

      // Validate settled amount matches intent
      if (settledAmountGnf !== intent.amountGnf) {
        throw new FinancialError(
          `Montant réglé (${settledAmountGnf} GNF) non concordant avec l'intention (${intent.amountGnf} GNF).`,
          "AMOUNT_MISMATCH",
          422
        );
      }

      // Validate currency
      if (currency && currency !== "GNF" && currency !== intent.customerCurrency) {
        throw new FinancialError(
          `Devise de règlement non reconnue ou non concordante (${currency}) pour cette intention (attendu: GNF ou ${intent.customerCurrency}).`,
          "CURRENCY_MISMATCH",
          422
        );
      }

      const transactionReference = `ptx_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const netAmountGnf = settledAmountGnf - providerFeeGnf;

      // 3. Create PaymentTransaction record
      const transaction = await tx.paymentTransaction.create({
        data: {
          transactionReference,
          intentId: intent.id,
          providerTransactionId,
          provider: intent.provider,
          originalAmount: settledAmountGnf,
          currency,
          settledAmountGnf,
          providerFeeGnf,
          netAmountGnf,
          status: PaymentTransactionStatus.CONFIRMED,
          verifiedAt,
          rawPayloadJson: JSON.stringify(rawPayload),
          idempotencyKey,
        },
      });

      const requiresReconciliation = isLatePayment;

      if (requiresReconciliation) {
        // Safe reconciliation path: money is preserved, captured in unallocated escrow,
        // but classroom is NOT auto-activated or duplicate sessions generated.
        let parsedMetadata: Record<string, unknown> = {};
        try {
          if (intent.metadataJson) parsedMetadata = JSON.parse(intent.metadataJson);
        } catch {
          // ignore
        }

        const updatedIntent = await tx.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: PaymentIntentStatus.REQUIRES_RECONCILIATION,
            providerReference: providerTransactionId,
            metadataJson: JSON.stringify({
              ...parsedMetadata,
              reconciliationReason: "LATE_PAYMENT_AFTER_EXPIRATION",
              expiredAt: intent.expiresAt,
            }),
          },
        });

        // DEBIT: 1010_PARENT_CLEARING (Gateway collected cash)
        // CREDIT: 2010_UNALLOCATED_ESCROW (Holding parent's money safely for manual review)
        await DoubleEntryLedger.postJournalEntry(
          {
            referenceType: JournalReferenceType.PARENT_PAYMENT_CLEARING,
            referenceId: transaction.id,
            description: `Paiement tardif après expiration (${intentReference}) - Fonds non affectés pour rapprochement`,
            postedBy: actorId,
            currency: "GNF",
            lines: [
              {
                accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
                direction: LedgerEntryDirection.DEBIT,
                amountGnf: settledAmountGnf,
              },
              {
                accountCode: STANDARD_ACCOUNTS.UNALLOCATED_ESCROW,
                direction: LedgerEntryDirection.CREDIT,
                amountGnf: settledAmountGnf,
              },
            ],
          },
          tx
        );

        // Notify Parent of reconciliation state
        try {
          await NotificationService.publishNotificationEvent(
            {
              eventType: NotificationEventType.PAYMENT_RECONCILIATION_REQUIRED,
              recipientUserId: intent.parentUserId,
              entityType: "PAYMENT_INTENT",
              entityId: intent.id,
              title: "Paiement reçu — Rapprochement en cours",
              message: `Votre règlement de ${formatGnf(settledAmountGnf)} a bien été encaissé par la passerelle mais nécessite une vérification par l'administration (délai dépassé ou classe déjà pourvue). Les fonds sont sécurisés.`,
              linkUrl: "/parent/classes",
              dedupKey: `reconciliation_${intent.id}`,
              priority: NotificationPriority.HIGH,
            },
            tx
          );
        } catch (notifErr) {
          console.warn("Notification error on reconciliation:", notifErr);
        }

        await FinancialAuditService.logEvent(
          {
            actorId,
            actorRole: "PAYMENT_GATEWAY",
            action: "LATE_PAYMENT_CAPTURED_FOR_RECONCILIATION",
            entityType: "PAYMENT_INTENT",
            entityId: intent.id,
            previousState: { status: intent.status },
            newState: {
              status: PaymentIntentStatus.REQUIRES_RECONCILIATION,
              transactionId: transaction.id,
              settledAmountGnf,
              isLatePayment,
            },
            metadata: {
              classroomId: intent.classroomId,
              packageId: intent.packageId,
            },
          },
          tx
        );

        return {
          intent: updatedIntent,
          transaction,
          alreadyProcessed: false,
          requiresReconciliation: true,
        };
      }

      // 5. Standard Succeeded Path:
      const updatedIntent = await tx.paymentIntent.update({
        where: { id: intent.id },
        data: {
          status: PaymentIntentStatus.SUCCEEDED,
          providerReference: providerTransactionId,
        },
      });

      // 6. Update Classroom Funding if tied to a classroom
      const parentFeeGnf = intent.parentFeeGnf || 0;
      const fundedCourseGnf =
        intent.courseAmountGnf ?? (intent.amountGnf - parentFeeGnf);

      if (intent.classroomId) {
        const existingFunding = await tx.classroomFunding.findUnique({
          where: { classroomId: intent.classroomId },
        });

        if (existingFunding) {
          await tx.classroomFunding.update({
            where: { classroomId: intent.classroomId },
            data: {
              status: ClassroomFundingStatus.FUNDED,
              totalFundedAmountGnf: { increment: fundedCourseGnf },
              availableBalanceGnf: { increment: fundedCourseGnf },
              fundedAt: verifiedAt,
              lastPaymentIntentId: intent.id,
              packageId: intent.packageId || existingFunding.packageId,
            },
          });
        } else {
          await tx.classroomFunding.create({
            data: {
              classroomId: intent.classroomId,
              packageId: intent.packageId,
              parentUserId: intent.parentUserId,
              totalFundedAmountGnf: fundedCourseGnf,
              allocatedAmountGnf: 0,
              refundedAmountGnf: 0,
              availableBalanceGnf: fundedCourseGnf,
              status: ClassroomFundingStatus.FUNDED,
              fundedAt: verifiedAt,
              lastPaymentIntentId: intent.id,
            },
          });
        }

        // Transition Classroom status: PENDING_PAYMENT -> ACTIVE
        if (intent.classroom?.status === ClassroomStatus.PENDING_PAYMENT) {
          await tx.classroom.update({
            where: { id: intent.classroomId },
            data: { status: ClassroomStatus.ACTIVE },
          });
        }

        // Activate Tutoring Package if linked
        if (intent.packageId) {
          await tx.tutoringPackage.update({
            where: { id: intent.packageId },
            data: {
              status: "ACTIVE",
              fundedAt: verifiedAt,
            },
          });

          // Mark sessions in classroom as funded
          await tx.lessonSession.updateMany({
            where: {
              classroomId: intent.classroomId,
              packageId: intent.packageId,
            },
            data: {
              isFunded: true,
            },
          });
        }

        // Post Double-Entry Journal for Classroom Funds Prepayment:
        // DEBIT: 1010_PARENT_CLEARING (Asset increases with total settled)
        // CREDIT: 2020_CLASSROOM_FUNDS (Liability increases with course principal)
        // CREDIT: 4020_PARENT_FEE_CONTRIBUTIONS (Platform fee contribution revenue, if applicable)
        const classroomFundingLines: LedgerPostingLine[] = [
          {
            accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
            direction: LedgerEntryDirection.DEBIT,
            amountGnf: settledAmountGnf,
          },
          {
            accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
            direction: LedgerEntryDirection.CREDIT,
            amountGnf: fundedCourseGnf,
          },
        ];

        if (parentFeeGnf > 0) {
          classroomFundingLines.push({
            accountCode: STANDARD_ACCOUNTS.PARENT_FEE_CONTRIBUTIONS,
            direction: LedgerEntryDirection.CREDIT,
            amountGnf: parentFeeGnf,
          });
        }

        await DoubleEntryLedger.postJournalEntry(
          {
            referenceType: JournalReferenceType.CLASSROOM_PREPAYMENT_FUNDING,
            referenceId: transaction.id,
            description: `Approvisionnement classe ${intent.classroomId} via ${intent.provider} (${intentReference})`,
            postedBy: actorId,
            currency: "GNF",
            lines: classroomFundingLines,
          },
          tx
        );

        // Reconcile any previously approved unfunded sessions now that funding has arrived
        await EarningsEligibilityService.reconcileUnfundedApprovedSessions(
          intent.classroomId,
          actorId,
          tx
        );

        // Publish notifications to Parent and Teacher
        try {
          await NotificationService.publishNotificationEvent(
            {
              eventType: NotificationEventType.PAYMENT_CONFIRMED,
              recipientUserId: intent.parentUserId,
              entityType: "CLASSROOM",
              entityId: intent.classroomId,
              title: "Paiement de cours confirmé",
              message: `Votre paiement de ${formatGnf(settledAmountGnf)} pour le cours de ${intent.classroom?.subjectName || "votre enfant"} est validé. Le cours est actif.`,
              linkUrl: "/parent/classes",
              dedupKey: `pay_conf_${intent.id}`,
              priority: NotificationPriority.HIGH,
            },
            tx
          );

          if (intent.classroom?.teacherProfile?.user?.id) {
            await NotificationService.publishNotificationEvent(
              {
                eventType: NotificationEventType.PACKAGE_FUNDED,
                recipientUserId: intent.classroom.teacherProfile.user.id,
                entityType: "CLASSROOM",
                entityId: intent.classroomId,
                title: "Cours approvisionné !",
                message: `Le forfait pour le cours de ${intent.classroom.subjectName} (élève: ${intent.classroom.student?.fullName}) a été approvisionné. Vous pouvez débuter les séances.`,
                linkUrl: "/teacher/classes",
                dedupKey: `pkg_funded_teacher_${intent.id}`,
                priority: NotificationPriority.HIGH,
              },
              tx
            );
          }
        } catch (notifErr) {
          console.warn("Notification dispatch warning:", notifErr);
        }
      } else {
        // Prepayment without direct classroom linkage (Unallocated Escrow):
        // DEBIT: 1010_PARENT_CLEARING
        // CREDIT: 2010_UNALLOCATED_ESCROW
        // CREDIT: 4020_PARENT_FEE_CONTRIBUTIONS (if applicable)
        const escrowFundingLines: LedgerPostingLine[] = [
          {
            accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
            direction: LedgerEntryDirection.DEBIT,
            amountGnf: settledAmountGnf,
          },
          {
            accountCode: STANDARD_ACCOUNTS.UNALLOCATED_ESCROW,
            direction: LedgerEntryDirection.CREDIT,
            amountGnf: fundedCourseGnf,
          },
        ];

        if (parentFeeGnf > 0) {
          escrowFundingLines.push({
            accountCode: STANDARD_ACCOUNTS.PARENT_FEE_CONTRIBUTIONS,
            direction: LedgerEntryDirection.CREDIT,
            amountGnf: parentFeeGnf,
          });
        }

        await DoubleEntryLedger.postJournalEntry(
          {
            referenceType: JournalReferenceType.PARENT_PAYMENT_CLEARING,
            referenceId: transaction.id,
            description: `Règlement prépayé parent ${intent.parentUserId} via ${intent.provider} (${intentReference})`,
            postedBy: actorId,
            currency: "GNF",
            lines: escrowFundingLines,
          },
          tx
        );

        try {
          await NotificationService.publishNotificationEvent(
            {
              eventType: NotificationEventType.PAYMENT_CONFIRMED,
              recipientUserId: intent.parentUserId,
              entityType: "PAYMENT_INTENT",
              entityId: intent.id,
              title: "Provision prépayée reçue",
              message: `Votre versement de ${formatGnf(settledAmountGnf)} a été crédité sur vos fonds prépayés affectés aux cours.`,
              linkUrl: "/parent/classes",
              dedupKey: `pay_conf_escrow_${intent.id}`,
              priority: NotificationPriority.HIGH,
            },
            tx
          );
        } catch (notifErr) {
          console.warn("Notification dispatch warning:", notifErr);
        }
      }

      // 7. Log Audit Event
      await FinancialAuditService.logEvent(
        {
          actorId,
          actorRole: "PAYMENT_GATEWAY",
          action: "PAYMENT_SETTLED_AND_FUNDED",
          entityType: "PAYMENT_INTENT",
          entityId: intent.id,
          previousState: { status: intent.status },
          newState: {
            status: PaymentIntentStatus.SUCCEEDED,
            transactionId: transaction.id,
            settledAmountGnf,
            providerTransactionId,
          },
          metadata: {
            classroomId: intent.classroomId,
            packageId: intent.packageId,
          },
        },
        tx
      );

      return {
        intent: updatedIntent,
        transaction,
        alreadyProcessed: false,
        requiresReconciliation: false,
      };
    });
  } catch (err: any) {
    if (err?.code === "P2002") {
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { idempotencyKey },
        include: {
          intent: {
            include: {
              classroomFunding: true,
            },
          },
        },
      });
      if (existingTx && existingTx.intent) {
        return {
          intent: existingTx.intent,
          transaction: existingTx,
          alreadyProcessed: true,
          requiresReconciliation: false,
        };
      }
    }
    throw err;
  }
}

  /**
   * Mark a payment intent as failed
   */
  static async failPaymentIntent(
    intentReference: string,
    failureReason: string,
    rawPayload?: Record<string, unknown>
  ) {
    return await prisma.paymentIntent.update({
      where: { intentReference },
      data: {
        status: PaymentIntentStatus.FAILED,
        failureReason,
        metadataJson: rawPayload ? JSON.stringify(rawPayload) : undefined,
      },
    });
  }

  /**
   * Cancel an open payment intent
   */
  static async cancelPaymentIntent(intentReference: string) {
    const existing = await prisma.paymentIntent.findUnique({
      where: { intentReference },
    });
    if (!existing) {
      throw new FinancialError(
        `Intention de paiement introuvable: ${intentReference}`,
        "INTENT_NOT_FOUND",
        404
      );
    }
    if (existing.status === PaymentIntentStatus.SUCCEEDED) {
      throw new FinancialError(
        `Impossible d'annuler une intention déjà réglée avec succès.`,
        "INTENT_ALREADY_SUCCEEDED",
        400
      );
    }
    return await prisma.paymentIntent.update({
      where: { intentReference },
      data: {
        status: PaymentIntentStatus.CANCELLED,
      },
    });
  }

  /**
   * Retrieves an intent by reference with its transactions and relations.
   */
  static async getIntentByReference(intentReference: string) {
    return await prisma.paymentIntent.findUnique({
      where: { intentReference },
      include: {
        transactions: true,
        classroomFunding: true,
        classroom: {
          select: {
            id: true,
            subjectName: true,
            status: true,
          },
        },
        package: true,
      },
    });
  }
}
