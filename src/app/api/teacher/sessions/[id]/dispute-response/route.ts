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

    if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    const body = await req.json();

    const dispute = await ReportingService.respondToDispute({
      sessionId,
      teacherResponse: body.teacherResponse,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({
      success: true,
      dispute,
      message: "Votre réponse a été enregistrée et transmise à l'administration.",
    });
  } catch (err: any) {
    if (err instanceof ReportingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/teacher/sessions/[id]/dispute-response error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

