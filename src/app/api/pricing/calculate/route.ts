import { NextRequest, NextResponse } from "next/server";
import { PricingOfferType } from "@prisma/client";
import {
  PricingEngine,
  PricingEngineError,
} from "@/lib/pricing/pricing-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pricingType = PricingOfferType.MONTHLY_PACKAGE,
      amountGnf,
      sessionsCount = 8,
      minutesPerSession = 60,
    } = body;

    const resolvedType =
      pricingType === PricingOfferType.HOURLY
        ? PricingOfferType.HOURLY
        : PricingOfferType.MONTHLY_PACKAGE;

    const commissionRate = await PricingEngine.getActiveCommissionRate();

    const result = PricingEngine.calculatePackage({
      pricingType: resolvedType,
      amountGnf: Number(amountGnf),
      sessionsCount: Number(sessionsCount),
      minutesPerSession: Number(minutesPerSession),
      commissionRatePercent: commissionRate,
    });

    return NextResponse.json({
      success: true,
      pricing: result,
    });
  } catch (error) {
    if (error instanceof PricingEngineError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("Error calculating pricing:", error);
    return NextResponse.json(
      { error: "Erreur lors du calcul financier" },
      { status: 500 }
    );
  }
}

