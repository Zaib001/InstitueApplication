import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { TeacherOnboardingClient } from "@/components/teacher/TeacherOnboardingClient";

export const dynamic = "force-dynamic";

export default async function TeacherOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/onboarding");
  }

  // Ensure role is TEACHER or ADMIN
  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) {
      redirect("/parent/dashboard");
    }
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherOnboardingClient user={user} />
    </LightDashboardLayout>
  );
}
