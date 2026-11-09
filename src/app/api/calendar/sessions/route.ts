import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  SchedulingEngine,
  SchedulingEngineError,
} from "@/lib/scheduling/scheduling-engine";
import { SessionStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId") || undefined;
    const teacherProfileId = searchParams.get("teacherProfileId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const status = (searchParams.get("status") as SessionStatus) || undefined;

    const sessions = await SchedulingEngine.getCalendarSessions({
      userId: user.id,
      userRole: user.role,
      classroomId,
      teacherProfileId,
      studentId,
      startDate,
      endDate,
      status,
    });

    return NextResponse.json({ sessions });
  } catch (err: any) {
    if (err instanceof SchedulingEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("GET /api/calendar/sessions error:", err);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}

