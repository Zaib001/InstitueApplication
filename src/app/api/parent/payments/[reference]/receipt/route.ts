import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { reference } = await params;

    const intent = await prisma.paymentIntent.findUnique({
      where: { intentReference: reference },
      include: {
        parentUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
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
          where: { status: "CONFIRMED" },
          orderBy: { verifiedAt: "desc" },
        },
      },
    });

    if (!intent) {
      return NextResponse.json(
        { error: `Intention de paiement introuvable: ${reference}` },
        { status: 404 }
      );
    }

    // Security check: Only the owning parent or an admin can access this receipt
    if (intent.parentUserId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé au reçu d'un autre utilisateur." },
        { status: 403 }
      );
    }

    // Only succeeded payments can produce a verified receipt
    if (intent.status !== "SUCCEEDED") {
      return NextResponse.json(
        {
          error:
            "Le reçu officiel n'est émis que pour les paiements confirmés et validés par la passerelle.",
          status: intent.status,
        },
        { status: 400 }
      );
    }

    const confirmedTx = intent.transactions[0] || null;

    const receipt = {
      receiptNumber: `REC-${intent.createdAt.getFullYear()}${(
        intent.createdAt.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${intent.intentReference.slice(-8).toUpperCase()}`,
      issueDate: (confirmedTx?.verifiedAt || intent.updatedAt).toISOString(),
      status: "PAYÉ ET CONFIRMÉ (PROVISION AFFECTÉE)",
      company: {
        name: "Monsieur Fanyi",
        tagline: "Plateforme de soutien scolaire d'excellence",
        phone: "+224 612 365 314",
        email: "contact@monsieurfanyi.com",
        website: "https://monsieurfanyi.com",
      },
      payer: {
        name: intent.parentUser?.fullName || user.fullName,
        email: intent.parentUser?.email || user.email,
        phone: intent.parentUser?.phoneNumber || (user as any).phoneNumber || "Non renseigné",
      },
      service: {
        subjectName: intent.classroom?.subjectName || "Cours particulier",
        studentName: intent.classroom?.student?.fullName || "Élève",
        studentGrade: intent.classroom?.student?.gradeLevel || "Standard",
        teacherName:
          intent.classroom?.teacherProfile?.user?.fullName ||
          "Enseignant certifié",
        packageType:
          intent.package?.pricingType === "HOURLY"
            ? "Forfait Horaire"
            : "Forfait Mensuel",
        sessionsCount: intent.package?.sessionsCount || 1,
        minutesPerSession: intent.package?.minutesPerSession || 120,
        hourlyRateGnf: intent.package?.hourlyRateGnf || null,
      },
      payment: {
        intentReference: intent.intentReference,
        transactionReference: confirmedTx?.transactionReference || null,
        providerTransactionId: confirmedTx?.providerTransactionId || null,
        provider: intent.provider,
        paymentMethod: intent.selectedMethod || "ORANGE_MONEY",
        amountGnf: intent.amountGnf,
        courseAmountGnf: intent.courseAmountGnf ?? (intent.amountGnf - (intent.parentFeeGnf || 0)),
        parentFeeGnf: intent.parentFeeGnf || 0,
        customerAmount: intent.customerAmount || intent.amountGnf,
        customerCurrency: intent.customerCurrency || "GNF",
        providerFeeGnf: confirmedTx?.providerFeeGnf || 0,
        netAmountGnf: confirmedTx?.netAmountGnf || intent.amountGnf,
      },
      terms: {
        notice:
          "Ce reçu atteste du règlement de la provision pour les cours particuliers. Les fonds sont conservés pour financer les séances validées par le parent.",
      },
    };

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (err: any) {
    console.error("Error generating receipt:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la génération du reçu" },
      { status: 500 }
    );
  }
}

