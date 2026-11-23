import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { PaymentIntentService } from "@/lib/finance/payment-intent-service";
import { PaymentProviderRegistry } from "@/lib/finance/provider-abstraction";
import { FinancialError, PaymentProviderName } from "@/lib/finance/types";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const {
      classroomId,
      packageId,
      amountGnf,
      courseAmountGnf,
      parentFeeGnf,
      customerCurrency = "GNF",
      customerAmount,
      provider = PaymentProviderName.DJOMY,
      selectedMethod,
      idempotencyKey,
      metadata = {},
    } = body;

    const rawCourseAmount = courseAmountGnf ? Number(courseAmountGnf) : undefined;
    const rawTotalAmount = amountGnf ? Number(amountGnf) : undefined;

    if (!rawCourseAmount && (!rawTotalAmount || rawTotalAmount <= 0)) {
      return NextResponse.json(
        { error: "Montant valide en GNF requis" },
        { status: 400 }
      );
    }

    const effectiveIdempotencyKey =
      idempotencyKey ||
      `idem_${user.id}_${classroomId || "escrow"}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const intent = await PaymentIntentService.createPaymentIntent({
      parentUserId: user.id,
      classroomId,
      packageId,
      courseAmountGnf: rawCourseAmount,
      amountGnf: rawTotalAmount,
      customerCurrency,
      customerAmount: customerAmount ? Number(customerAmount) : undefined,
      provider: (provider as PaymentProviderName) || PaymentProviderName.DJOMY,
      selectedMethod,
      idempotencyKey: effectiveIdempotencyKey,
      metadata,
    });

    // Generate payment session URL via provider adapter
    let paymentSession = null;
    try {
      const adapter = PaymentProviderRegistry.getAdapter(intent.provider);
      paymentSession = await adapter.createPaymentSession({
        intentReference: intent.intentReference,
        amountGnf: intent.amountGnf,
        currency: intent.customerCurrency || "GNF",
        customerEmail: user.email,
        customerName: user.fullName,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/classes?payment=success&ref=${intent.intentReference}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/parent/classes?payment=cancelled&ref=${intent.intentReference}`,
        selectedChannel: selectedMethod,
        metadata: { classroomId, packageId },
      });
    } catch {
      // Intent was created; session creation can be retried
    }

    return NextResponse.json({ intent, paymentSession }, { status: 201 });
  } catch (error: any) {
    if (error instanceof FinancialError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/finance/payment-intents error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("ref");

    if (!reference) {
      return NextResponse.json(
        { error: "Paramètre 'ref' (référence d'intention) requis" },
        { status: 400 }
      );
    }

    const intent = await PaymentIntentService.getIntentByReference(reference);

    if (!intent) {
      return NextResponse.json(
        { error: "Intention introuvable" },
        { status: 404 }
      );
    }

    // Authorization: parent owner or admin
    if (intent.parentUserId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ intent });
  } catch (error: any) {
    console.error("GET /api/finance/payment-intents error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

