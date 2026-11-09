import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentReportsClient } from "@/components/parent/ParentReportsClient";

export const dynamic = "force-dynamic";

export default async function ParentReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/reports");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/reports");
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <ParentReportsClient />
    </LightDashboardLayout>
  );
}

