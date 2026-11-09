import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminAcademicProgressClient } from "@/components/admin/AdminAcademicProgressClient";

export const dynamic = "force-dynamic";

export default async function AdminAcademicProgressPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/academic-progress");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminAcademicProgressClient />
    </LightDashboardLayout>
  );
}

