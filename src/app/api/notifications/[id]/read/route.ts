import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    }

    const updated = await NotificationService.markAsRead(id, user.id);
    return NextResponse.json({ success: true, notification: updated });
  } catch (error: any) {
    console.error("[MARK_NOTIFICATION_READ_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour." },
      { status: 400 }
    );
  }
}

