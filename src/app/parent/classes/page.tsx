import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  ParentClassesClient,
  ParentClassroomData,
} from "@/components/parent/ParentClassesClient";

export const dynamic = "force-dynamic";

export default async function ParentClassesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/classes");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!parentProfile && user.role !== UserRole.ADMIN) {
    redirect("/parent/dashboard");
  }

  const classrooms = await prisma.classroom.findMany({
    where: {
      student: {
        parentId: parentProfile ? parentProfile.id : undefined,
      },
    },
    include: {
      student: true,
      teacherProfile: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
            },
          },
        },
      },
      request: {
        select: {
          id: true,
          commune: true,
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

  const formatted: ParentClassroomData[] = classrooms.map((c) => {
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
      requestId: c.requestId,
      subjectName: c.subjectName,
      mode: c.mode,
      status: c.status,
      hourlyRateGnf: c.hourlyRateGnf,
      monthlyRateGnf: c.monthlyRateGnf,
      isAssistedAssignment: c.isAssistedAssignment,
      createdAt: c.createdAt.toISOString(),
      student: {
        id: c.student.id,
        fullName: c.student.fullName,
        gradeLevel: c.student.gradeLevel,
        cycle: c.student.cycle,
      },
      teacher: {
        id: c.teacherProfile.user.id,
        fullName: c.teacherProfile.user.fullName,
        headline: c.teacherProfile.headline,
        avatarUrl: c.teacherProfile.user.avatarUrl,
        phoneNumber: c.teacherProfile.user.phoneNumber,
        email: c.teacherProfile.user.email,
      },
      location: {
        commune: c.request?.commune || null,
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
      <ParentClassesClient classrooms={formatted} />
    </LightDashboardLayout>
  );
}
