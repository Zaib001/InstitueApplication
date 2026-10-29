import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminVerificationDetailClient } from "@/components/admin/AdminVerificationDetailClient";

export const dynamic = "force-dynamic";

export default async function AdminVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/verifications");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  const { id } = await params;

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminVerificationDetailClient teacherId={id} />
    </LightDashboardLayout>
  );
}
