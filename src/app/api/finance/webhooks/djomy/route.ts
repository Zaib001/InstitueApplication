import { NextRequest, NextResponse } from "next/server";
import { PaymentIntentService } from "@/lib/finance/payment-intent-service";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";
import { PaymentProviderName, FinancialError } from "@/lib/finance/types";
import { FinancialAuditService } from "@/lib/finance/audit-service";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown> = {};

    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        const params = new URLSearchParams(rawBody);
        const entries: Record<string, unknown> = {};
        params.forEach((v, k) => {
          entries[k] = v;
        });
        body = entries;
      }
    }

    const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.DJOMY);

    // 1. Authenticity verification via HMAC-SHA256 signature
    const headersRecord: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    const hasSignature = Boolean(
      headersRecord["x-djomy-signature"] ||
      headersRecord["x-signature"] ||
      headersRecord["x-token"]
    );

    if (process.env.NODE_ENV === "production" && !hasSignature) {
      return NextResponse.json(
        {
          error: "Signature de webhook Djomy absente ou non fournie.",
          code: "MISSING_SIGNATURE",
        },
        { status: 401 }
      );
    }

    if (hasSignature) {
      const isValidSig = adapter.verifyWebhookSignature(rawBody, headersRecord);
      if (!isValidSig) {
        return NextResponse.json(
          {
            error: "Signature de webhook Djomy invalide ou altérée.",
            code: "INVALID_SIGNATURE",
          },
          { status: 401 }
        );
      }
    }

    // 2. Extract transaction identifiers
    const parsed = adapter.parseWebhookPayload(body);
    const intentReference =
      parsed.providerReference ||
      String(body.merchantReference || body.reference || body.intentReference || "");

    if (!intentReference) {
      return NextResponse.json(
        {
          error: "Référence d'intention manquante dans la notification Djomy.",
          code: "MISSING_INTENT_REF",
        },
        { status: 400 }
      );
    }

    // 3. Fetch Intent from PostgreSQL
    const intent = await PaymentIntentService.getIntentByReference(intentReference);
    if (!intent) {
      return NextResponse.json(
        {
          error: `Intention de paiement introuvable: ${intentReference}`,
          code: "INTENT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 4. Authoritatively verify transaction status
    const providerTransactionId =
      parsed.providerTransactionId ||
      String(body.transactionId || body.id || `djomy_tx_${Date.now()}`);

    const verification = await adapter.checkPaymentStatus(
      providerTransactionId,
      intentReference
    );

    if (verification.status !== "SUCCESS") {
      await FinancialAuditService.logEvent({
        actorId: "DJOMY_WEBHOOK",
        actorRole: "PAYMENT_GATEWAY",
        action: "PAYMENT_NOTIFICATION_UNSUCCESSFUL",
        entityType: "PAYMENT_INTENT",
        entityId: intent.id,
        newState: {
          verificationStatus: verification.status,
          rawPayload: body,
        },
      });

      return NextResponse.json(
        {
          message: "Notification Djomy enregistrée, statut non concluant",
          status: verification.status,
        },
        { status: 200 }
      );
    }

    // 5. Atomic confirmation and classroom funding
    const idempotencyKey = `djomy_webhook_${providerTransactionId}_${intent.id}`;
    const result = await PaymentIntentService.confirmPaymentTransaction({
      intentReference,
      providerTransactionId,
      settledAmountGnf: verification.amount || intent.amountGnf,
      providerFeeGnf: verification.providerFeeGnf || 0,
      currency: verification.currency || intent.customerCurrency || "GNF",
      rawPayload: body,
      actorId: "DJOMY_WEBHOOK",
      idempotencyKey,
      verifiedAt: verification.verifiedAt || new Date(),
      allowLateReconciliation: true,
    });

    await FinancialAuditService.logEvent({
      actorId: "DJOMY_WEBHOOK",
      actorRole: "PAYMENT_GATEWAY",
      action: "PAYMENT_CONFIRMED_VIA_WEBHOOK",
      entityType: "PAYMENT_INTENT",
      entityId: intent.id,
      newState: {
        intentReference,
        providerTransactionId,
        settledAmountGnf: verification.amount || intent.amountGnf,
        status: result.intent.status,
      },
    });

    return NextResponse.json(
      {
        success: true,
        intentReference,
        transactionId: result.transaction?.id,
        alreadyProcessed: result.alreadyProcessed,
        requiresReconciliation: result.requiresReconciliation,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof FinancialError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("Djomy Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne webhook" },
      { status: 500 }
    );
  }
}
