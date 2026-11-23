import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PaymentIntentService } from "@/lib/finance/payment-intent-service";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";
import { FinancialError } from "@/lib/finance/types";
import crypto from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    const { reference } = await params;

    const intent = await PaymentIntentService.getIntentByReference(reference);
    if (!intent) {
      return NextResponse.json(
        { error: "Intention de paiement introuvable" },
        { status: 404 }
      );
    }

    const rawBody = await req.text();
    let body: Record<string, any> = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        // Raw non-json payload
      }
    }

    const user = await getCurrentUser();

    const signatureHeader =
      req.headers.get("x-djomy-signature") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-token") ||
      req.headers.get("x-cinetpay-signature") ||
      req.headers.get("x-fedapay-signature");

    // 1. Production Security Guard
    // In production, direct browser/client confirmation is categorically blocked.
    // Real payment confirmation strictly requires certified server-to-server provider webhooks (/api/finance/webhooks/*).
    if (isProduction) {
      return NextResponse.json(
        {
          error:
            "Opération interdite en production : La confirmation des paiements en production est exclusivement autorisée via les webhooks officiels certifiés de la passerelle (/api/finance/webhooks/djomy). Aucune confirmation directe via navigateur n'est autorisée.",
          code: "MANUAL_CONFIRMATION_DISABLED_IN_PROD",
        },
        { status: 403 }
      );
    }

    // 2. User Authorization Guard
    // In production, signatureHeader is already strictly enforced in Guard 1 above.
    // In development / test sandbox mode:
    // Signed webhooks, administrators, or the parent owner of this specific payment intent (sandbox simulator) are authorized.
    const isParentOwnerInSandbox =
      !isProduction &&
      Boolean(user && intent.parentUserId && user.id === intent.parentUserId);
    const isAdmin = Boolean(user && user.role === "ADMIN");

    if (!signatureHeader && !isAdmin && !isParentOwnerInSandbox) {
      return NextResponse.json(
        {
          error:
            "Opération interdite : Seul un administrateur authentifié, le titulaire en mode bac à sable ou un webhook de paiement certifié peut confirmer un paiement.",
          code: "UNAUTHORIZED_PAYMENT_CONFIRMATION",
        },
        { status: 403 }
      );
    }

    // 3. Amount and Currency Tampering Guard
    const {
      providerTransactionId,
      settledAmountGnf,
      providerFeeGnf = 0,
      currency = "GNF",
      idempotencyKey,
      rawPayload = {},
    } = body;

    if (settledAmountGnf !== undefined && Number(settledAmountGnf) !== intent.amountGnf) {
      return NextResponse.json(
        {
          error: `Montant réglé (${settledAmountGnf} GNF) non conforme au montant attendu de l'intention (${intent.amountGnf} GNF).`,
          code: "AMOUNT_MISMATCH",
        },
        { status: 422 }
      );
    }

    if (currency && currency !== "GNF" && currency !== intent.customerCurrency) {
      return NextResponse.json(
        {
          error: `Devise non reconnue (${currency}) pour cette intention.`,
          code: "CURRENCY_MISMATCH",
        },
        { status: 422 }
      );
    }

    const effectiveSettledAmount = intent.amountGnf;
    const effectiveProviderTxId =
      providerTransactionId ||
      `tx_${intent.provider}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const effectiveIdempotencyKey =
      idempotencyKey || `settle_${reference}_${effectiveProviderTxId}`;
    const actorId = user ? user.id : "GATEWAY_WEBHOOK_VERIFIED";

    const result = await PaymentIntentService.confirmPaymentTransaction({
      intentReference: reference,
      providerTransactionId: effectiveProviderTxId,
      settledAmountGnf: effectiveSettledAmount,
      providerFeeGnf: Number(providerFeeGnf),
      currency: "GNF",
      rawPayload,
      actorId,
      idempotencyKey: effectiveIdempotencyKey,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof FinancialError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("POST confirm payment error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
