import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";
import { FinancialError } from "@/lib/finance/types";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedTeacherProfileId = searchParams.get("teacherProfileId");

    let teacherProfileId: string;

    if (user.role === "ADMIN") {
      if (!requestedTeacherProfileId) {
        // Return global summary for admin
        const totalEarnings = await prisma.teacherEarning.aggregate({
          _sum: {
            grossAmountGnf: true,
            platformCommissionGnf: true,
            teacherNetGnf: true,
          },
        });
        const totalPayouts = await prisma.payout.aggregate({
          _sum: { amountGnf: true },
        });

        return NextResponse.json({
          globalSummary: {
            totalGrossGnf: totalEarnings._sum.grossAmountGnf || 0,
            totalPlatformCommissionGnf:
              totalEarnings._sum.platformCommissionGnf || 0,
            totalTeacherNetGnf: totalEarnings._sum.teacherNetGnf || 0,
            totalPayoutsGnf: totalPayouts._sum.amountGnf || 0,
          },
        });
      }
      teacherProfileId = requestedTeacherProfileId;
    } else {
      if (!user.teacherProfile) {
        return NextResponse.json(
          { error: "Profil enseignant requis" },
          { status: 403 }
        );
      }
      teacherProfileId = user.teacherProfile.id;
    }

    const balanceInfo =
      await TeacherPayoutService.getTeacherAvailableBalance(teacherProfileId);

    const earningsHistory = await prisma.teacherEarning.findMany({
      where: { teacherProfileId },
      include: {
        session: {
          select: {
            id: true,
            scheduledStart: true,
            durationMinutes: true,
            classroom: {
              select: {
                id: true,
                subjectName: true,
                student: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
        payout: {
          select: {
            id: true,
            paymentReference: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const payoutsHistory = await prisma.payout.findMany({
      where: { teacherProfileId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      balance: balanceInfo,
      earnings: earningsHistory,
      payouts: payoutsHistory,
      payoutExecutionNotice: {
        isLiveGatewayActive: false,
        phase: "M3.01_FOUNDATION",
        message:
          "Les demandes de versement sont enregistrées au passif comptable. Le versement automatique sur Orange Money / MTN Mobile Money sera activé en Phase M3.02.",
      },
    });
  } catch (error: any) {
    console.error("GET teacher earnings error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.teacherProfile && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const {
      teacherProfileId: requestedTeacherId,
      amountGnf,
      channel = "ORANGE_MONEY",
      beneficiaryName,
      beneficiaryPhone,
      idempotencyKey,
    } = body;

    const teacherProfileId =
      user.role === "ADMIN" && requestedTeacherId
        ? requestedTeacherId
        : user.teacherProfile?.id;

    if (!teacherProfileId) {
      return NextResponse.json(
        { error: "Identifiant enseignant requis" },
        { status: 400 }
      );
    }

    if (!amountGnf || !beneficiaryName || !beneficiaryPhone) {
      return NextResponse.json(
        { error: "Montant, nom et numéro de téléphone du bénéficiaire requis" },
        { status: 400 }
      );
    }

    const effectiveIdempotencyKey =
      idempotencyKey ||
      `pay_${teacherProfileId}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const payout = await TeacherPayoutService.requestPayout({
      teacherProfileId,
      amountGnf: Number(amountGnf),
      channel,
      beneficiaryName,
      beneficiaryPhone,
      requestedByUserId: user.id,
      idempotencyKey: effectiveIdempotencyKey,
    });

    return NextResponse.json(
      {
        payout,
        message:
          "Demande de versement validée et inscrite au grand livre comptable.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof FinancialError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    console.error("POST teacher payout error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne" },
      { status: 500 }
    );
  }
}

