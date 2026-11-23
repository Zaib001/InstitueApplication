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
        // Handle URL-encoded form data if CinetPay delivers form-urlencoded
        const params = new URLSearchParams(rawBody);
        const entries: Record<string, unknown> = {};
        params.forEach((v, k) => {
          entries[k] = v;
        });
        body = entries;
      }
    }

    const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.CINETPAY);

    // 1. Authenticity verification via HMAC-SHA256 signature
    const headersRecord: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    const hasSignature = Boolean(
      headersRecord["x-token"] || headersRecord["x-cinetpay-signature"]
    );

    // In production, signature is strictly required
    if (process.env.NODE_ENV === "production" && !hasSignature) {
      return NextResponse.json(
        { error: "Signature de webhook CinetPay absente ou non fournie.", code: "MISSING_SIGNATURE" },
        { status: 401 }
      );
    }

    if (hasSignature) {
      const isValidSig = adapter.verifyWebhookSignature(rawBody, headersRecord);
      if (!isValidSig) {
        return NextResponse.json(
          { error: "Signature de webhook CinetPay invalide ou altérée.", code: "INVALID_SIGNATURE" },
          { status: 401 }
        );
      }
    }

    // 2. Extract transaction identifiers
    const parsed = adapter.parseWebhookPayload(body);
    const intentReference =
      parsed.providerReference ||
      String(body.cpm_trans_id || body.trans_id || body.transaction_id || "");

    if (!intentReference) {
      return NextResponse.json(
        { error: "Référence d'intention manquante dans la notification CinetPay.", code: "MISSING_INTENT_REF" },
        { status: 400 }
      );
    }

    // 3. Fetch Intent from PostgreSQL
    const intent = await PaymentIntentService.getIntentByReference(intentReference);
    if (!intent) {
      return NextResponse.json(
        { error: `Intention de paiement introuvable: ${intentReference}`, code: "INTENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 4. Validate site_id if present
    const siteIdFromPayload = String(body.cpm_site_id || body.site_id || "");
    const configuredSiteId = process.env.CINETPAY_SITE_ID;
    if (siteIdFromPayload && configuredSiteId && siteIdFromPayload !== configuredSiteId) {
      return NextResponse.json(
        { error: "Identifiant de site CinetPay non concordant avec la configuration.", code: "SITE_ID_MISMATCH" },
        { status: 403 }
      );
    }

    // 5. Authoritatively query CinetPay API v2 /v2/payment/check
    // Do NOT rely solely on the webhook payload
    const verification = await adapter.checkPaymentStatus(intentReference, intentReference);

    if (verification.status !== "SUCCESS") {
      await FinancialAuditService.logEvent({
        actorId: "CINETPAY_WEBHOOK",
        actorRole: "PAYMENT_GATEWAY",
        action: "PAYMENT_NOTIFICATION_UNSUCCESSFUL",
        entityType: "PAYMENT_INTENT",
        entityId: intent.id,
        newState: {
          verificationStatus: verification.status,
          rawResponse: verification.rawResponse,
        },
      });

      return NextResponse.json(
        { status: "ACKNOWLEDGED", providerStatus: verification.status },
        { status: 200 }
      );
    }

    // 6. Compare amount and currency against intent
    if (verification.amount !== intent.amountGnf) {
      return NextResponse.json(
        {
          error: `Montant réglé (${verification.amount} GNF) non conforme au montant attendu (${intent.amountGnf} GNF).`,
          code: "AMOUNT_MISMATCH",
        },
        { status: 422 }
      );
    }

    if (verification.currency !== "GNF" && verification.currency !== intent.customerCurrency) {
      return NextResponse.json(
        {
          error: `Devise non concordante: ${verification.currency} (attendu: GNF).`,
          code: "CURRENCY_MISMATCH",
        },
        { status: 422 }
      );
    }

    // 7. Atomic settlement, balanced ledger posting and classroom funding
    const idempotencyKey = `cinetpay_webhook_${intentReference}_${verification.providerTransactionId}`;

    const result = await PaymentIntentService.confirmPaymentTransaction({
      intentReference,
      providerTransactionId: verification.operatorTransactionId || verification.providerTransactionId,
      settledAmountGnf: verification.amount,
      providerFeeGnf: verification.providerFeeGnf || 0,
      currency: "GNF",
      rawPayload: verification.rawResponse,
      actorId: "CINETPAY_WEBHOOK_VERIFIED",
      idempotencyKey,
      verifiedAt: verification.verifiedAt,
      allowLateReconciliation: true,
    });

    return NextResponse.json(
      {
        status: "ACCEPTED",
        code: "00",
        message: "Paiement CinetPay vérifié avec succès et provision de classe enregistrée.",
        alreadyProcessed: result.alreadyProcessed || false,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof FinancialError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }
    console.error("CinetPay webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne webhook CinetPay" },
      { status: 500 }
    );
  }
}

