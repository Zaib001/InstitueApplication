import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { OutboxWorker } from "@/lib/notifications/outbox-worker";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { outboxId } = body;

    if (!outboxId) {
      return NextResponse.json({ error: "ID d'envoi requis" }, { status: 400 });
    }

    const success = await OutboxWorker.retryFailedOutboxItem(outboxId);
    if (!success) {
      return NextResponse.json({ error: "Envoi introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Envoi replanifié avec succès." });
  } catch (error: any) {
    console.error("[ADMIN_RETRY_OUTBOX_ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

