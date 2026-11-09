import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  SchedulingEngine,
  SchedulingEngineError,
} from "@/lib/scheduling/scheduling-engine";

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
    const { newStart, newEnd, durationMinutes, reason } = body;

    if (!newStart || !reason) {
      return NextResponse.json(
        { error: "La nouvelle date/heure et le motif de reprogrammation sont obligatoires." },
        { status: 400 }
      );
    }

    const updated = await SchedulingEngine.rescheduleSession({
      sessionId,
      newStart,
      newEnd,
      durationMinutes,
      reason,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err: any) {
    if (err instanceof SchedulingEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("PATCH /api/calendar/sessions/[id]/reschedule error:", err);
    return NextResponse.json({ error: "Erreur lors du report de la séance" }, { status: 500 });
  }
}

