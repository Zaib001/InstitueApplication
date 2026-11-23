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
    const body = await req.json().catch(() => ({}));
    const { reason } = body;

    const payout = await TeacherPayoutService.rejectPayout(id, reason || "Rejet administratif sans motif précisé", user.id);

    return NextResponse.json({
      success: true,
      message: "Versement rejeté avec succès. Les gains ont été rétablis.",
      payout,
    });
  } catch (err: any) {
    console.error("POST /api/admin/finances/payouts/[id]/reject error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du rejet du versement" },
      { status: err.statusCode || 400 }
    );
  }
}

