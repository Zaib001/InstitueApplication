import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux enseignants" }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Profil enseignant introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const { amountGnf, destinationId, channel, beneficiaryName, beneficiaryPhone } = body;

    const parsedAmount = parseInt(amountGnf, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Veuillez spécifier un montant positif valide." },
        { status: 400 }
      );
    }

    // Resolve destination if destinationId is provided
    let finalChannel = channel;
    let finalName = beneficiaryName;
    let finalPhone = beneficiaryPhone;

    if (destinationId) {
      const destination = await prisma.teacherPayoutDestination.findFirst({
        where: { id: destinationId, teacherProfileId: teacherProfile.id },
      });
      if (!destination) {
        return NextResponse.json(
          { error: "Compte de versement sélectionné introuvable ou non autorisé." },
          { status: 404 }
        );
      }
      finalChannel = destination.operator;
      finalName = destination.accountHolderName;
      finalPhone = destination.phone;
    }

    if (!finalChannel || !finalPhone || !finalName) {
      return NextResponse.json(
        { error: "Informations de bénéficiaire mobile money incomplètes." },
        { status: 400 }
      );
    }

    const idempotencyKey = `payout_${teacherProfile.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const payout = await TeacherPayoutService.requestPayout({
      teacherProfileId: teacherProfile.id,
      amountGnf: parsedAmount,
      channel: finalChannel,
      beneficiaryName: finalName,
      beneficiaryPhone: finalPhone,
      destinationId: destinationId || undefined,
      requestedByUserId: user.id,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      message: "Demande de versement enregistrée avec succès.",
      payout,
    });
  } catch (err: any) {
    console.error("POST /api/teacher/finances/payout-request error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la demande de versement" },
      { status: err.statusCode || 400 }
    );
  }
}

