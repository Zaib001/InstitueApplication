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
    const body = await req.json();

    const result = await ReportingService.disputeLessonSession({
      sessionId,
      category: body.category || "OTHER",
      reason: body.reason,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({
      success: true,
      dispute: result.dispute,
      session: result.session,
      message: "Votre réclamation a été enregistrée. L'administration va examiner la situation.",
    });
  } catch (err: any) {
    if (err instanceof ReportingServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/parent/sessions/[id]/dispute error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

