import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { TeacherAvailabilityClient } from "@/components/teacher/TeacherAvailabilityClient";

export const dynamic = "force-dynamic";

export default async function TeacherAvailabilityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/availability");
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  const initialAvailabilities =
    teacherProfile?.availabilities.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
    })) || [];

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <TeacherAvailabilityClient
          initialAvailabilities={initialAvailabilities}
        />
      </div>
    </LightDashboardLayout>
  );
}

