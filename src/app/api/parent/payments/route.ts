import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== "PARENT" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès réservé aux parents d'élèves" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const classroomId = searchParams.get("classroomId");

    const whereClause: any = {
      parentUserId: user.id,
    };

    if (statusFilter && statusFilter !== "ALL") {
      whereClause.status = statusFilter;
    }

    if (classroomId) {
      whereClause.classroomId = classroomId;
    }

    const intents = await prisma.paymentIntent.findMany({
      where: whereClause,
      include: {
        classroom: {
          include: {
            student: true,
            teacherProfile: {
              include: { user: true },
            },
          },
        },
        package: true,
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const items = intents.map((intent) => {
      const latestTx = intent.transactions[0] || null;
      return {
        id: intent.id,
        intentReference: intent.intentReference,
        transactionReference: latestTx?.transactionReference || null,
        providerTransactionId: latestTx?.providerTransactionId || null,
        classroomId: intent.classroomId,
        subjectName: intent.classroom?.subjectName || "Cours particulier",
        studentName: intent.classroom?.student?.fullName || "Élève",
        teacherName:
          intent.classroom?.teacherProfile?.user?.fullName ||
          "Professeur assigné",
        packageId: intent.packageId,
        packageType:
          intent.package?.pricingType === "HOURLY"
            ? "Forfait Horaire"
            : "Forfait Mensuel",
        sessionsCount: intent.package?.sessionsCount || 1,
        minutesPerSession: intent.package?.minutesPerSession || 120,
        amountGnf: intent.amountGnf,
        customerAmount: intent.customerAmount || intent.amountGnf,
        customerCurrency: intent.customerCurrency || "GNF",
        provider: intent.provider,
        selectedMethod: intent.selectedMethod || "ORANGE_MONEY",
        status: intent.status,
        createdAt: intent.createdAt.toISOString(),
        verifiedAt: latestTx?.verifiedAt?.toISOString() || null,
        expiresAt: intent.expiresAt.toISOString(),
        receiptAvailable: intent.status === "SUCCEEDED",
        requiresReconciliation: intent.status === "REQUIRES_RECONCILIATION",
      };
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      payments: items,
    });
  } catch (err: any) {
    console.error("Error fetching parent payments:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des paiements" },
      { status: 500 }
    );
  }
}

