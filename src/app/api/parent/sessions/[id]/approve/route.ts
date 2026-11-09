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

    if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès réservé aux parents" }, { status: 403 });
    }

    const { id: sessionId } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const result = await ReportingService.approveLessonSession({
      sessionId,
      feedbackNote: body.feedbackNote,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({
      success: true,
      approval: result.approval,
      report: result.report,
      session: result.session,
      message: "Séance validée avec succès.",
    });
  } catch (err: any) {
    if (err instanceof ReportingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/parent/sessions/[id]/approve error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

