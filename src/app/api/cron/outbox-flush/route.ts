import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { OutboxWorker } from "@/lib/notifications/outbox-worker";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const isAdmin = Boolean(user && user.role === UserRole.ADMIN);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const expectedSecret =
      process.env.SCHEDULER_SECRET || process.env.AUTH_SECRET || "fanyi_scheduler_secret_2026";
    const hasValidToken = Boolean(token && token === expectedSecret);

    if (!isAdmin && !hasValidToken) {
      return NextResponse.json({ error: "Accès non autorisé au planificateur." }, { status: 401 });
    }

    const summary = await OutboxWorker.processOutbox(25);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    });
  } catch (error: any) {
    console.error("[CRON_OUTBOX_FLUSH_ERROR]", error);
    return NextResponse.json({ error: error.message || "Erreur interne" }, { status: 500 });
  }
}

