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
        // Non JSON body
      }
    }

    const adapter = PaymentProviderRegistry.getAdapter(PaymentProviderName.FEDAPAY);

    // 1. Signature verification via x-fedapay-signature
    const headersRecord: Record<string, string> = {};
    req.headers.forEach((val, key) => {
      headersRecord[key.toLowerCase()] = val;
    });

    const hasSignature = Boolean(headersRecord["x-fedapay-signature"]);

    if (process.env.NODE_ENV === "production" && !hasSignature) {
      return NextResponse.json(
        { error: "Signature de webhook FedaPay manquante.", code: "MISSING_FEDAPAY_SIGNATURE" },
        { status: 401 }
      );
    }

    if (hasSignature) {
      const isValidSig = adapter.verifyWebhookSignature(rawBody, headersRecord);
      if (!isValidSig) {
        return NextResponse.json(
          { error: "Signature de webhook FedaPay invalide ou expirée.", code: "INVALID_SIGNATURE" },
          { status: 401 }
        );
      }
    }

    // 2. Parse payload
    const parsed = adapter.parseWebhookPayload(body);
    const eventName = String(body.event || "");

    // Only process approved transactions
    if (eventName && eventName !== "transaction.approved" && parsed.status !== "SUCCESS") {
      return NextResponse.json(
        { status: "IGNORED", reason: `Événement FedaPay non éligible au règlement : ${eventName}` },
        { status: 200 }
      );
    }

    const providerTxId = parsed.providerTransactionId;
    if (!providerTxId) {
      return NextResponse.json(
        { error: "Identifiant de transaction FedaPay introuvable dans la notification.", code: "MISSING_TX_ID" },
        { status: 400 }
      );
    }

    // 3. Authoritatively verify with FedaPay server /v1/transactions/{id}
    const verification = await adapter.checkPaymentStatus(providerTxId, parsed.providerReference);

    if (verification.status !== "SUCCESS") {
      return NextResponse.json(
        { status: "ACKNOWLEDGED", providerStatus: verification.status },
        { status: 200 }
      );
    }

    // 4. Retrieve matching PaymentIntent from PostgreSQL
    // Intent reference can be in merchantReference or matched via custom metadata
    const intentReference = verification.merchantReference;
    const intent = await PaymentIntentService.getIntentByReference(intentReference);

    if (!intent) {
      return NextResponse.json(
        { error: `Intention de paiement introuvable: ${intentReference}`, code: "INTENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 5. Validate amount and currency
    if (verification.amount !== intent.amountGnf) {
      return NextResponse.json(
        {
          error: `Montant FedaPay (${verification.amount} GNF) différent de l'intention (${intent.amountGnf} GNF).`,
          code: "AMOUNT_MISMATCH",
        },
        { status: 422 }
      );
    }

    if (verification.currency !== "GNF" && verification.currency !== intent.customerCurrency) {
      return NextResponse.json(
        {
          error: `Devise non reconnue: ${verification.currency} (attendu: GNF).`,
          code: "CURRENCY_MISMATCH",
        },
        { status: 422 }
      );
    }

    // 6. Settle and post balanced journal
    const idempotencyKey = `fedapay_webhook_${intentReference}_${providerTxId}`;

    const result = await PaymentIntentService.confirmPaymentTransaction({
      intentReference,
      providerTransactionId: providerTxId,
      settledAmountGnf: verification.amount,
      currency: "GNF",
      rawPayload: verification.rawResponse,
      actorId: "FEDAPAY_WEBHOOK_VERIFIED",
      idempotencyKey,
      verifiedAt: verification.verifiedAt,
      allowLateReconciliation: true,
    });

    return NextResponse.json(
      {
        status: "ACCEPTED",
        message: "Notification FedaPay traitée avec succès.",
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
    console.error("FedaPay webhook error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur interne webhook FedaPay" },
      { status: 500 }
    );
  }
}

