import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentPaymentsClient } from "@/components/parent/ParentPaymentsClient";

export const dynamic = "force-dynamic";

export default async function ParentPaymentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/payments");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user}>
      <ParentPaymentsClient />
    </LightDashboardLayout>
  );
}

