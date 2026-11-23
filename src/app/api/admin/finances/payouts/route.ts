import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { TeacherPayoutService } from "@/lib/finance/teacher-payout-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const payouts = await TeacherPayoutService.getAllPayoutsForAdmin();

    return NextResponse.json({
      success: true,
      payouts,
    });
  } catch (err: any) {
    console.error("GET /api/admin/finances/payouts error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la récupération des versements" },
      { status: 500 }
    );
  }
}

