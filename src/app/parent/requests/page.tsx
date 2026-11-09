import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentRequestsClient } from "@/components/requests/ParentRequestsClient";

export const dynamic = "force-dynamic";

export default async function ParentRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/requests");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  // Ensure ParentProfile exists
  let parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!parentProfile) {
    parentProfile = await prisma.parentProfile.create({
      data: {
        userId: user.id,
        city: "Conakry",
      },
    });
  }

  // Fetch parent requests with student info and applications count
  const requests = await prisma.tutoringRequest.findMany({
    where: { parentId: parentProfile.id },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          gradeLevel: true,
          cycle: true,
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

  // Fetch status counts
  const [total, draft, open, matched, closed, cancelled] = await Promise.all([
    prisma.tutoringRequest.count({ where: { parentId: parentProfile.id } }),
    prisma.tutoringRequest.count({ where: { parentId: parentProfile.id, status: "DRAFT" } }),
    prisma.tutoringRequest.count({ where: { parentId: parentProfile.id, status: "OPEN" } }),
    prisma.tutoringRequest.count({ where: { parentId: parentProfile.id, status: "MATCHED" } }),
    prisma.tutoringRequest.count({ where: { parentId: parentProfile.id, status: "CLOSED" } }),
    prisma.tutoringRequest.count({ where: { parentId: parentProfile.id, status: "CANCELLED" } }),
  ]);

  // Fetch registered children (non-archived)
  const childrenList = await prisma.studentProfile.findMany({
    where: { parentId: parentProfile.id, isArchived: false },
    select: {
      id: true,
      fullName: true,
      gradeLevel: true,
      cycle: true,
      customCycle: true,
      preferredSubjects: true,
      customSubject: true,
    },
    orderBy: { fullName: "asc" },
  });

  // Fetch master data for subjects and grade levels
  const [subjects, gradeLevels] = await Promise.all([
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.gradeLevel.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, cycle: true },
    }),
  ]);

  const formattedRequests = requests.map((r) => ({
    id: r.id,
    subjectName: r.subjectName,
    customSubject: r.customSubject,
    gradeLevelName: r.gradeLevelName,
    cycle: r.cycle,
    customCycle: r.customCycle,
    mode: r.mode,
    frequency: r.frequency,
    preferredSchedule: r.preferredSchedule,
    budgetGnf: r.budgetGnf,
    budgetType: r.budgetType,
    city: r.city,
    commune: r.commune,
    neighborhood: r.neighborhood,
    learningGoals: r.learningGoals,
    status: r.status,
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    student: {
      id: r.student.id,
      fullName: r.student.fullName,
      gradeLevel: r.student.gradeLevel,
      cycle: r.student.cycle,
    },
    _count: {
      applications: r._count.applications,
    },
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <ParentRequestsClient
        initialRequests={formattedRequests}
        initialCounts={{
          total,
          draft,
          open,
          matched,
          closed,
          cancelled,
        }}
        childrenList={childrenList}
        masterData={{
          subjects,
          gradeLevels,
        }}
      />
    </LightDashboardLayout>
  );
}

