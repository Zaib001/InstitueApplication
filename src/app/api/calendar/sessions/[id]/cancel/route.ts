import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import {
  SchedulingEngine,
  SchedulingEngineError,
} from "@/lib/scheduling/scheduling-engine";

export async function POST(
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
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: "Le motif d'annulation est obligatoire." },
        { status: 400 }
      );
    }

    const cancelled = await SchedulingEngine.cancelSession({
      sessionId,
      reason,
      actorUserId: user.id,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, session: cancelled });
  } catch (err: any) {
    if (err instanceof SchedulingEngineError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("POST /api/calendar/sessions/[id]/cancel error:", err);
    return NextResponse.json({ error: "Erreur lors de l'annulation de la séance" }, { status: 500 });
  }
}

