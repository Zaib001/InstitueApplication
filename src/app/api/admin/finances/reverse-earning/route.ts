import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { EarningsEligibilityService } from "@/lib/finance/earnings-eligibility-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId, reason } = body;

    if (!sessionId || !reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Veuillez fournir un identifiant de séance valide et un motif d'annulation explicite (min. 5 caractères)." },
        { status: 400 }
      );
    }

    const result = await EarningsEligibilityService.reverseSessionEarnings(
      sessionId,
      reason.trim(),
      user.id
    );

    return NextResponse.json({
      success: true,
      message: "Rémunération annulée avec succès. Les écritures comptables d'ajustement ont été enregistrées.",
      session: result.session,
      journalId: result.journal.id,
    });
  } catch (err: any) {
    console.error("POST /api/admin/finances/reverse-earning error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur lors de l'annulation des gains" },
      { status: err.statusCode || 500 }
    );
  }
}

