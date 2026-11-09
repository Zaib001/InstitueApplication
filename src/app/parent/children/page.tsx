import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentChildrenClient } from "@/components/parent/ParentChildrenClient";

export const dynamic = "force-dynamic";

export default async function ParentChildrenPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/children");
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

  // Fetch children from PostgreSQL
  const childrenRecords = await prisma.studentProfile.findMany({
    where: { parentId: parentProfile.id },
    include: {
      _count: {
        select: {
          tutoringRequests: true,
          classrooms: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch master data for subjects and grade levels
  const [subjects, gradeLevels, totalRequestsCount, activeClassesCount] =
    await Promise.all([
      prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, category: true },
      }),
      prisma.gradeLevel.findMany({
        orderBy: { orderIndex: "asc" },
        select: { id: true, name: true, cycle: true, orderIndex: true },
      }),
      prisma.tutoringRequest.count({
        where: { parentId: parentProfile.id },
      }),
      prisma.classroom.count({
        where: {
          student: { parentId: parentProfile.id },
          status: "ACTIVE",
        },
      }),
    ]);

  const formattedChildren = childrenRecords.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    gradeLevel: c.gradeLevel,
    cycle: c.cycle,
    customCycle: c.customCycle,
    schoolName: c.schoolName,
    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString() : null,
    supportNeeds: c.supportNeeds,
    preferredSubjects: c.preferredSubjects,
    customSubject: c.customSubject,
    notes: c.notes,
    isArchived: c.isArchived,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <ParentChildrenClient
        initialChildren={formattedChildren}
        masterData={{
          gradeLevels,
          subjects,
        }}
        totalRequestsCount={totalRequestsCount}
        activeClassesCount={activeClassesCount}
      />
    </LightDashboardLayout>
  );
}
