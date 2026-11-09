import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationService } from "@/lib/notifications/notification-service";
import { NotificationPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const isReadParam = searchParams.get("isRead");
    const onlyUnread =
      searchParams.get("onlyUnread") === "true" || isReadParam === "false";
    const onlyRead = isReadParam === "true";
    const priorityParam = searchParams.get("priority");

    let priority: NotificationPriority | undefined;
    if (
      priorityParam &&
      Object.values(NotificationPriority).includes(priorityParam as NotificationPriority)
    ) {
      priority = priorityParam as NotificationPriority;
    }

    const data = await NotificationService.getUserNotifications(user.id, {
      page,
      limit,
      onlyUnread,
      onlyRead,
      priority,
    });

    return NextResponse.json({
      items: data.items,
      notifications: data.items,
      totalCount: data.totalCount,
      unreadCount: data.unreadCount,
      count: data.unreadCount,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
      pagination: {
        page: data.page,
        limit: data.limit,
        totalCount: data.totalCount,
        totalPages: data.totalPages,
      },
    });
  } catch (error: any) {
    console.error("[GET_NOTIFICATIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les notifications." },
      { status: 500 }
    );
  }
}

