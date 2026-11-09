import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { TeacherProgressClient } from "@/components/teacher/TeacherProgressClient";

export const dynamic = "force-dynamic";

export default async function TeacherProgressPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/progress");
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherProgressClient />
    </LightDashboardLayout>
  );
}

