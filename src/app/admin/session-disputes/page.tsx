import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminDisputesClient } from "@/components/admin/AdminDisputesClient";

export const dynamic = "force-dynamic";

export default async function AdminSessionDisputesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/session-disputes");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminDisputesClient />
    </LightDashboardLayout>
  );
}

