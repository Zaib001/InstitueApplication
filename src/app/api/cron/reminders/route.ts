import { NextRequest, NextResponse } from "next/server";
import { ReminderService } from "@/lib/notifications/reminder-service";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedSecret =
      process.env.SCHEDULER_SECRET || process.env.AUTH_SECRET || "fanyi_scheduler_secret_2026";

    if (!token || token !== expectedSecret) {
      return NextResponse.json({ error: "Accès non autorisé au planificateur." }, { status: 401 });
    }

    const results = await ReminderService.runAllReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("[CRON_REMINDERS_ERROR]", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

