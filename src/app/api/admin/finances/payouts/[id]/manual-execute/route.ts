import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { providerReference, notes } = body;

    if (!providerReference || providerReference.trim().length < 5) {
      return NextResponse.json(
        { error: "Veuillez fournir la référence de transaction télécom officielle (min. 5 caractères)." },
        { status: 400 }
      );
    }

    const payout = await TeacherPayoutService.executeManualPayout({
      payoutId: id,
      providerReference: providerReference.trim(),
      notes,
      adminUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Référence de transfert télécom enregistrée. Le versement est placé en attente de rapprochement indépendant (RECONCILIATION_PENDING).",
      payout,
    });
  } catch (err: any) {
    console.error("POST /api/admin/finances/payouts/[id]/manual-execute error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'exécution du versement" },
      { status: err.statusCode || 400 }
    );
  }
}

