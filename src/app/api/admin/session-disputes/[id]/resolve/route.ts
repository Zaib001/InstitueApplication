import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ReportingService, ReportingServiceError } from "@/lib/reporting/reporting-service";
import { UserRole } from "@prisma/client";

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

    const { id: disputeId } = await params;
    const body = await req.json();

    const dispute = await ReportingService.resolveDispute({
      disputeId,
      resolutionType: body.resolutionType,
      adminNote: body.adminNote,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({
      success: true,
      dispute,
      message: "Litige résolu avec succès.",
    });
  } catch (err: any) {
    if (err instanceof ReportingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/admin/session-disputes/[id]/resolve error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

