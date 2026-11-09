import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminNotificationCenterClient } from "@/components/admin/AdminNotificationCenterClient";

export const dynamic = "force-dynamic";

export default async function AdminNotificationCenterPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/notification-center");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        <AdminNotificationCenterClient user={user} />
      </div>
    </LightDashboardLayout>
  );
}

