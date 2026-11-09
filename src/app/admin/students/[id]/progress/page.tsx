import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminStudentProgressClient } from "@/components/admin/AdminStudentProgressClient";

export const dynamic = "force-dynamic";

export default async function AdminStudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id: studentId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/admin/students/${studentId}/progress`);
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminStudentProgressClient studentId={studentId} />
    </LightDashboardLayout>
  );
}

