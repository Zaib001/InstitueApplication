import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { RefundService } from "@/lib/finance/refund-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux parents" }, { status: 403 });
    }

    const body = await req.json();
    const { classroomId, amountGnf, reason, sessionId } = body;

    const parsedAmount = parseInt(amountGnf, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Veuillez spécifier un montant positif valide." },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "Veuillez préciser la raison de votre demande de remboursement (min. 5 caractères)." },
        { status: 400 }
      );
    }

    const refundCase = await RefundService.requestParentRefund({
      parentUserId: user.id,
      classroomId,
      amountGnf: parsedAmount,
      reason: reason.trim(),
      sessionId: sessionId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Votre demande de remboursement a été transmise à notre service financier.",
      refundCase,
    });
  } catch (err: any) {
    console.error("POST /api/parent/payments/refund-request error:", err);
    return NextResponse.json(
      { error: err.message || "Erreur lors de la demande de remboursement" },
      { status: err.statusCode || 400 }
    );
  }
}

