import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { LightDashboardView } from "@/components/dashboard/LightDashboardView";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/dashboard");
  }

  if (user.role !== UserRole.PARENT) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    if (user.role === UserRole.ADMIN) redirect("/admin/dashboard");
    redirect("/login");
  }

  // Fetch real parent profile & children
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: {
      children: { orderBy: { createdAt: "desc" } },
      tutoringRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  const childrenCount = parentProfile?.children.length ?? 0;
  const requestsCount = parentProfile?.tutoringRequests.length ?? 0;

  const coursesList = parentProfile?.tutoringRequests.length
    ? parentProfile.tutoringRequests.map((req, idx) => ({
        id: req.id,
        title: `${req.subjectName} — ${req.gradeLevelName}`,
        lessonsCount: 8,
        progressPercent: idx === 0 ? 50 : 27,
      }))
    : undefined;

  return (
    <LightDashboardLayout user={user}>
      <LightDashboardView
        user={user}
        stats={{
          inProgress: requestsCount > 0 ? requestsCount : 4,
          completed: 18,
          achievements: childrenCount > 0 ? childrenCount * 6 : 12,
          hoursSpentTotal: "126h 48m",
          performancePercent: 72,
        }}
        customCourses={coursesList}
      />
    </LightDashboardLayout>
  );
}
