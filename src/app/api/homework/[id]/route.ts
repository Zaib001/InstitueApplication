import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { ProgressService, ProgressServiceError } from "@/lib/progress/progress-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: homeworkId } = await params;
    const body = await req.json();

    if (!body.status) {
      return NextResponse.json({ error: "Le statut est requis." }, { status: 400 });
    }

    const updated = await ProgressService.updateHomeworkStatus({
      homeworkId,
      status: body.status,
      studentSubmission: body.studentSubmission,
      teacherFeedback: body.teacherFeedback,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err instanceof ProgressServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("PATCH /api/homework/[id] error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

