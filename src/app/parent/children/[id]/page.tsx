import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { StudentDetailsClient } from "@/components/parent/StudentDetailsClient";
import { verifyStudentOwnership } from "@/lib/auth/parent-guard";

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/dashboard");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  const { id } = await params;

  // Retrieve parent profile
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!parentProfile && user.role !== UserRole.ADMIN) {
    redirect("/parent/dashboard");
  }

  // Strictly verify student ownership
  const student = await verifyStudentOwnership(
    id,
    parentProfile?.id || "",
    user.role
  );

  if (!student) {
    notFound();
  }

  // Fetch master data for modal updates
  const [subjects, gradeLevels] = await Promise.all([
    prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    prisma.gradeLevel.findMany({
      orderBy: { orderIndex: "asc" },
      select: { id: true, name: true, cycle: true, orderIndex: true },
    }),
  ]);

  const formattedStudent = {
    id: student.id,
    fullName: student.fullName,
    gradeLevel: student.gradeLevel,
    cycle: student.cycle,
    schoolName: student.schoolName,
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString() : null,
    supportNeeds: student.supportNeeds,
    preferredSubjects: student.preferredSubjects,
    notes: student.notes,
    isArchived: student.isArchived,
    createdAt: student.createdAt.toISOString(),
    classrooms: student.classrooms.map((c) => ({
      id: c.id,
      subjectName: c.subjectName,
      status: c.status,
      teacherProfile: {
        user: {
          fullName: c.teacherProfile.user.fullName,
          avatarUrl: c.teacherProfile.user.avatarUrl,
        },
      },
    })),
    tutoringRequests: student.tutoringRequests.map((r) => ({
      id: r.id,
      subjectName: r.subjectName,
      gradeLevelName: r.gradeLevelName,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <StudentDetailsClient
        student={formattedStudent}
        masterData={{
          gradeLevels,
          subjects,
        }}
      />
    </LightDashboardLayout>
  );
}
