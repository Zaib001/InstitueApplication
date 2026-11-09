import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { EmailDeliveryStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;

    // Signature / Secret Verification
    if (webhookSecret) {
      const signature =
        req.headers.get("resend-signature") ||
        req.headers.get("x-webhook-secret") ||
        "";
      if (!signature || signature !== webhookSecret) {
        return NextResponse.json({ error: "Signature de webhook invalide." }, { status: 401 });
      }
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
    }

    const { type, data } = event;
    const providerMessageId = data?.email_id || data?.id;

    if (!providerMessageId) {
      return NextResponse.json({ received: true, note: "No message ID provided" });
    }

    const outboxItem = await prisma.emailOutbox.findFirst({
      where: { providerMessageId },
    });

    if (!outboxItem) {
      return NextResponse.json({ received: true, note: "Message not found in outbox" });
    }

    // Idempotent status transitions based on webhook event type
    if (type === "email.delivered") {
      await prisma.emailOutbox.update({
        where: { id: outboxItem.id },
        data: {
          status: EmailDeliveryStatus.DELIVERED,
          deliveredAt: new Date(),
          providerResponseJson: JSON.stringify(event),
        },
      });
    } else if (type === "email.bounced" || type === "email.complained") {
      await prisma.emailOutbox.update({
        where: { id: outboxItem.id },
        data: {
          status: EmailDeliveryStatus.FAILED,
          lastError: `Webhook event: ${type}`,
          providerResponseJson: JSON.stringify(event),
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[RESEND_WEBHOOK_ERROR]", error);
    return NextResponse.json({ error: "Erreur traitement webhook" }, { status: 500 });
  }
}

