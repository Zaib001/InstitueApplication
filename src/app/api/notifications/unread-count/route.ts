import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ count: 0, unreadCount: 0 });
    }

    const unreadCount = await NotificationService.getUnreadCount(user.id);
    return NextResponse.json({ count: unreadCount, unreadCount });
  } catch (error: any) {
    console.error("[GET_UNREAD_COUNT_ERROR]", error);
    return NextResponse.json({ count: 0, unreadCount: 0 });
  }
}

