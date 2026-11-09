import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { SchedulingEngine } from "@/lib/scheduling/scheduling-engine";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const teacherProfileId = searchParams.get("teacherProfileId");
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");
    const excludeSessionId = searchParams.get("excludeSessionId") || undefined;

    if (!teacherProfileId || !startStr || !endStr) {
      return NextResponse.json(
        { error: "teacherProfileId, start et end sont obligatoires." },
        { status: 400 }
      );
    }

    const start = SchedulingEngine.parseGuineaDate(startStr);
    const end = SchedulingEngine.parseGuineaDate(endStr);

    const conflict = await SchedulingEngine.checkTeacherConflicts(
      teacherProfileId,
      start,
      end,
      excludeSessionId
    );

    return NextResponse.json(conflict);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur de vérification" }, { status: 400 });
  }
}

