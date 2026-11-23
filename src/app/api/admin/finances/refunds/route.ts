import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { RefundService } from "@/lib/finance/refund-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    const refunds = await RefundService.getAllRefundCasesForAdmin();

    return NextResponse.json({
      success: true,
      refunds,
    });
  } catch (err: any) {
    console.error("GET /api/admin/finances/refunds error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}

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
    const { classroomId, refundAmountGnf, reason, refundCaseId } = body;

    const parsedAmount = parseInt(refundAmountGnf, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Veuillez spécifier un montant de remboursement valide." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Veuillez fournir un motif explicite pour le remboursement (min. 5 caractères)." },
        { status: 400 }
      );
    }

    const result = await RefundService.processClassroomRefund({
      classroomId,
      refundAmountGnf: parsedAmount,
      reason: reason.trim(),
      adminId: user.id,
      refundCaseId: refundCaseId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Remboursement traité avec succès. Les écritures comptables ont été enregistrées.",
      result,
    });
  } catch (err: any) {
    console.error("POST /api/admin/finances/refunds error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors du traitement du remboursement" },
      { status: err.statusCode || 400 }
    );
  }
}

