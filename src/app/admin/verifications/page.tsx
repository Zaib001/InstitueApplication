import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminVerificationsClient } from "@/components/admin/AdminVerificationsClient";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/verifications");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminVerificationsClient user={user} />
    </LightDashboardLayout>
  );
}
