import { NextResponse } from "next/server";
import { env } from "@/lib/config";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      service: "Monsieur Fanyi API",
      version: "0.1.0",
      locale: "fr-GN",
      timestamp: new Date().toISOString(),
      platformCommissionPercent: env.DEFAULT_PLATFORM_COMMISSION_PERCENT,
      paymentMockEnabled: env.PAYMENT_MOCK_ENABLED,
      environment: env.NODE_ENV,
    },
    { status: 200 }
  );
}
