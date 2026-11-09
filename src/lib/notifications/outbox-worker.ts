import { prisma } from "@/lib/db/prisma";
import { EmailDeliveryStatus } from "@prisma/client";
import { EmailProvider } from "./email-provider";
import { EmailTemplateRegistry } from "./email-templates";

export interface ProcessOutboxResult {
  processed: number;
  succeeded: number;
  failed: number;
  permanentFailures: number;
}

export class OutboxWorker {
  /**
   * Processes a batch of pending or retry-scheduled outbox emails.
   * Atomically claims items, renders templates, and dispatches via EmailProvider.
   */
  static async processOutbox(batchSize = 20): Promise<ProcessOutboxResult> {
    const now = new Date();

    // 1. Find eligible outbox entries
    const eligibleEntries = await prisma.emailOutbox.findMany({
      where: {
        status: { in: [EmailDeliveryStatus.PENDING, EmailDeliveryStatus.RETRY_SCHEDULED] },
        nextAttemptAt: { lte: now },
      },
      take: batchSize,
      orderBy: { createdAt: "asc" },
    });

    if (eligibleEntries.length === 0) {
      return { processed: 0, succeeded: 0, failed: 0, permanentFailures: 0 };
    }

    const itemIds = eligibleEntries.map((e) => e.id);

    // 2. Mark entries as PROCESSING to prevent duplicate workers
    await prisma.emailOutbox.updateMany({
      where: { id: { in: itemIds } },
      data: { status: EmailDeliveryStatus.PROCESSING },
    });

    let succeeded = 0;
    let failed = 0;
    let permanentFailures = 0;

    // 3. Process each item sequentially with isolated error handling
    for (const item of eligibleEntries) {
      const outcome = await this.processItem(item);
      if (outcome.success) {
        succeeded++;
      } else if (outcome.isPermanent) {
        permanentFailures++;
      } else {
        failed++;
      }
    }

    return {
      processed: eligibleEntries.length,
      succeeded,
      failed,
      permanentFailures,
    };
  }

  /**
   * Processes a single EmailOutbox entry by ID
   */
  static async processSingleOutboxItem(outboxId: string): Promise<boolean> {
    const item = await prisma.emailOutbox.findUnique({
      where: { id: outboxId },
    });
    if (!item) return false;
    const res = await this.processItem(item);
    return res.success;
  }

  /**
   * Internal processing logic for a single outbox record
   */
  static async processItem(item: any): Promise<{ success: boolean; isPermanent?: boolean }> {
    try {
      let payload: any = {};
      try {
        payload = JSON.parse(item.payloadJson || "{}");
      } catch {
        payload = {};
      }

      // Render localized template
      const rendered = EmailTemplateRegistry.renderTemplate(item.templateName, {
        ...payload,
        recipientName: item.recipientName || undefined,
        locale: item.locale || "fr",
      });

      // Dispatch via Provider
      const sendResult = await EmailProvider.sendEmail({
        to: item.recipientEmail,
        subject: item.subject || rendered.subject,
        html: rendered.html,
        text: rendered.text,
        idempotencyKey: item.dedupKey,
      });

      if (sendResult.success) {
        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            status: EmailDeliveryStatus.SENT,
            sentAt: new Date(),
            providerMessageId: sendResult.providerMessageId || null,
            lastError: null,
          },
        });
        return { success: true };
      } else {
        // Failure handling with exponential backoff
        const nextAttempts = item.attempts + 1;
        const isMaxExceeded = nextAttempts >= item.maxAttempts;

        // Backoff: 2^attempts * 60 seconds (1m, 2m, 4m, 8m, 16m)
        const backoffMinutes = Math.pow(2, nextAttempts);
        const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await prisma.emailOutbox.update({
          where: { id: item.id },
          data: {
            attempts: nextAttempts,
            status: isMaxExceeded
              ? EmailDeliveryStatus.PERMANENT_FAILURE
              : EmailDeliveryStatus.RETRY_SCHEDULED,
            nextAttemptAt: isMaxExceeded ? new Date() : nextRetry,
            lastError: sendResult.error || "Email delivery failed",
          },
        });

        return { success: false, isPermanent: isMaxExceeded };
      }
    } catch (err: any) {
      console.error(`[OUTBOX_ITEM_EXCEPTION] ID: ${item.id}`, err);
      const nextAttempts = item.attempts + 1;
      const isMaxExceeded = nextAttempts >= item.maxAttempts;
      await prisma.emailOutbox.update({
        where: { id: item.id },
        data: {
          attempts: nextAttempts,
          status: isMaxExceeded
            ? EmailDeliveryStatus.PERMANENT_FAILURE
            : EmailDeliveryStatus.RETRY_SCHEDULED,
          lastError: err.message || "Unexpected exception during outbox processing",
        },
      });
      return { success: false, isPermanent: isMaxExceeded };
    }
  }

  /**
   * Allows an administrator to manually retry a failed or permanent-failure email
   */
  static async retryFailedOutboxItem(outboxId: string): Promise<boolean> {
    const item = await prisma.emailOutbox.findUnique({
      where: { id: outboxId },
    });

    if (!item) return false;

    await prisma.emailOutbox.update({
      where: { id: outboxId },
      data: {
        status: EmailDeliveryStatus.PENDING,
        nextAttemptAt: new Date(),
        attempts: 0,
        lastError: null,
      },
    });

    // Trigger immediate async processing
    setTimeout(() => {
      OutboxWorker.processOutbox(5).catch((e) =>
        console.error("[OUTBOX_ASYNC_RETRY_ERROR]", e)
      );
    }, 100);

    return true;
  }
}
