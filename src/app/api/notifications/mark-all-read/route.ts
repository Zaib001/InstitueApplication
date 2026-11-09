import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const result = await NotificationService.markAllAsRead(user.id);
    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("[MARK_ALL_READ_ERROR]", error);
    return NextResponse.json(
      { error: "Impossible de marquer toutes les notifications comme lues." },
      { status: 500 }
    );
  }
}

