import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { TeacherStudentProgressClient } from "@/components/teacher/TeacherStudentProgressClient";

export const dynamic = "force-dynamic";

export default async function TeacherStudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id: studentId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/teacher/students/${studentId}/progress`);
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherStudentProgressClient studentId={studentId} />
    </LightDashboardLayout>
  );
}

