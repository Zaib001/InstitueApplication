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

    const payout = await TeacherPayoutService.approvePayout(id, user.id);

    return NextResponse.json({
      success: true,
      message: "Versement approuvé avec succès.",
      payout,
    });
  } catch (err: any) {
    console.error("POST /api/admin/finances/payouts/[id]/approve error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de l'approbation du versement" },
      { status: err.statusCode || 400 }
    );
  }
}

