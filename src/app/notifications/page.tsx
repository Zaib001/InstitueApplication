import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { NotificationCenterClient } from "@/components/notifications/NotificationCenterClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/notifications");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <NotificationCenterClient user={user} />
      </div>
    </LightDashboardLayout>
  );
}

