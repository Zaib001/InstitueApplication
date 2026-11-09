import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  SchedulingEngine,
  SchedulingEngineError,
} from "@/lib/scheduling/scheduling-engine";
import { LessonAttendance } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const sessionId = resolvedParams.id;
    const body = await req.json();
    const {
      attendanceStatus,
      actualStart,
      actualEnd,
      actualDurationMinutes,
      notes,
    } = body;

    if (!attendanceStatus) {
      return NextResponse.json(
        { error: "Le statut de présence est obligatoire." },
        { status: 400 }
      );
    }

    const updated = await SchedulingEngine.recordAttendance({
      sessionId,
      attendanceStatus: attendanceStatus as LessonAttendance,
      actualStart,
      actualEnd,
      actualDurationMinutes,
      notes,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err: any) {
    if (err instanceof SchedulingEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("PATCH /api/calendar/sessions/[id]/attendance error:", err);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de la présence" }, { status: 500 });
  }
}

