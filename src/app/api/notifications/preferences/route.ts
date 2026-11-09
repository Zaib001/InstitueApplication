import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationService } from "@/lib/notifications/notification-service";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const preferences = await NotificationService.getUserPreferences(user.id);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error("[GET_PREFERENCES_ERROR]", error);
    return NextResponse.json(
      { error: "Impossible de charger les préférences de notification." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await NotificationService.updateUserPreferences(user.id, body);
    return NextResponse.json({ success: true, preferences: updated });
  } catch (error: any) {
    console.error("[UPDATE_PREFERENCES_ERROR]", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour les préférences de notification." },
      { status: 400 }
    );
  }
}

