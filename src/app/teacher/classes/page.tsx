import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  TeacherClassesClient,
  TeacherClassroomData,
} from "@/components/teacher/TeacherClassesClient";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/classes");
  }

  if (user.role !== UserRole.TEACHER) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.ADMIN) redirect("/admin/dashboard");
    redirect("/login");
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
  });

  if (!teacherProfile) {
    redirect("/teacher/onboarding");
  }

  const classrooms = await prisma.classroom.findMany({
    where: {
      teacherProfileId: teacherProfile.id,
    },
    include: {
      student: true,
      request: {
        select: {
          id: true,
          commune: true,
          neighborhood: true,
          locationAddress: true,
          preferredSchedule: true,
        },
      },
      packages: {
        orderBy: { version: "desc" },
        take: 1,
      },
      _count: {
        select: {
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formatted: TeacherClassroomData[] = classrooms.map((c) => {
    const latestPkg = c.packages[0];
    let parsedAllocations = [];
    if (latestPkg?.allocationsJson) {
      try {
        parsedAllocations = JSON.parse(latestPkg.allocationsJson);
      } catch {
        // ignore
      }
    }

    return {
      id: c.id,
      subjectName: c.subjectName,
      mode: c.mode,
      status: c.status,
      hourlyRateGnf: c.hourlyRateGnf,
      monthlyRateGnf: c.monthlyRateGnf,
      isAssistedAssignment: c.isAssistedAssignment,
      assignmentSource: c.assignmentSource,
      createdAt: c.createdAt.toISOString(),
      student: {
        id: c.student.id,
        fullName: c.student.fullName,
        gradeLevel: c.student.gradeLevel,
        cycle: c.student.cycle,
        schoolName: c.student.schoolName,
        supportNeeds: c.student.supportNeeds,
      },
      location: {
        commune: c.request?.commune || null,
        neighborhood: c.request?.neighborhood || null,
        preferredSchedule: c.request?.preferredSchedule || null,
      },
      sessionsCount: c._count.sessions,
      packageDetails: latestPkg
        ? {
            totalAmountGnf: latestPkg.totalAmountGnf,
            sessionsCount: latestPkg.sessionsCount,
            minutesPerSession: latestPkg.minutesPerSession,
            totalPlannedMinutes: latestPkg.totalPlannedMinutes,
            pricingType: latestPkg.pricingType,
            commissionRatePercent: latestPkg.commissionRatePercent,
            totalPlatformCommissionGnf: latestPkg.totalPlatformCommissionGnf,
            totalTeacherShareGnf: latestPkg.totalTeacherShareGnf,
            allocations: parsedAllocations,
          }
        : null,
    };
  });

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherClassesClient classrooms={formatted} />
    </LightDashboardLayout>
  );
}

