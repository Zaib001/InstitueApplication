import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  SchedulingEngine,
  SchedulingEngineError,
} from "@/lib/scheduling/scheduling-engine";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { classroomId, startDate, recurringSlots, notes } = body;

    if (!classroomId || !startDate || !recurringSlots) {
      return NextResponse.json(
        { error: "classroomId, startDate et recurringSlots sont obligatoires." },
        { status: 400 }
      );
    }

    const result = await SchedulingEngine.planSessionsFromPackage({
      classroomId,
      startDate,
      recurringSlots,
      userId: user.id,
      userRole: user.role,
      notes,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    if (err instanceof SchedulingEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/calendar/sessions/plan error:", err);
    return NextResponse.json({ error: "Erreur lors de la planification" }, { status: 500 });
  }
}

