import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  AdminRequestsClient,
  AdminRequestData,
} from "@/components/admin/AdminRequestsClient";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/requests");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  // Fetch all platform requests
  const requests = await prisma.tutoringRequest.findMany({
    include: {
      parent: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          fullName: true,
          gradeLevel: true,
          cycle: true,
          schoolName: true,
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate status counts
  const [total, open, draft, matched, closed, cancelled] = await Promise.all([
    prisma.tutoringRequest.count(),
    prisma.tutoringRequest.count({ where: { status: "OPEN" } }),
    prisma.tutoringRequest.count({ where: { status: "DRAFT" } }),
    prisma.tutoringRequest.count({ where: { status: "MATCHED" } }),
    prisma.tutoringRequest.count({ where: { status: "CLOSED" } }),
    prisma.tutoringRequest.count({ where: { status: "CANCELLED" } }),
  ]);

  const totalBudgetGnf = requests.reduce((sum, r) => sum + r.budgetGnf, 0);

  const formattedRequests: AdminRequestData[] = requests.map((r) => ({
    id: r.id,
    subjectName: r.subjectName,
    customSubject: r.customSubject,
    gradeLevelName: r.gradeLevelName,
    cycle: r.cycle,
    customCycle: r.customCycle,
    mode: r.mode,
    frequency: r.frequency,
    preferredSchedule: r.preferredSchedule,
    sessionDurationMinutes: r.sessionDurationMinutes,
    budgetGnf: r.budgetGnf,
    budgetType: r.budgetType,
    city: r.city,
    commune: r.commune,
    neighborhood: r.neighborhood,
    learningGoals: r.learningGoals,
    status: r.status,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    cancelledAt: r.cancelledAt ? r.cancelledAt.toISOString() : null,
    cancellationReason: r.cancellationReason,
    createdAt: r.createdAt.toISOString(),
    parent: {
      id: r.parent.id,
      city: r.parent.city,
      user: {
        id: r.parent.user.id,
        fullName: r.parent.user.fullName,
        email: r.parent.user.email,
        phoneNumber: r.parent.user.phoneNumber,
      },
    },
    student: {
      id: r.student.id,
      fullName: r.student.fullName,
      gradeLevel: r.student.gradeLevel,
      cycle: r.student.cycle,
      schoolName: r.student.schoolName,
    },
    applicationsCount: r._count.applications,
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminRequestsClient
        initialRequests={formattedRequests}
        counts={{
          total,
          open,
          draft,
          matched,
          closed,
          cancelled,
          totalBudgetGnf,
        }}
      />
    </LightDashboardLayout>
  );
}

