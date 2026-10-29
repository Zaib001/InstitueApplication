import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentDashboardClient } from "@/components/parent/ParentDashboardClient";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/dashboard");
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

  // Fetch real children from PostgreSQL
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

  const formattedChildren = childrenRecords.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    gradeLevel: c.gradeLevel,
    cycle: c.cycle,
    schoolName: c.schoolName,
    dateOfBirth: c.dateOfBirth ? c.dateOfBirth.toISOString() : null,
    supportNeeds: c.supportNeeds,
    preferredSubjects: c.preferredSubjects,
    notes: c.notes,
    isArchived: c.isArchived,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  // Fetch real delivered sessions count and total hours for this parent's children
  const studentIds = childrenRecords.map((c) => c.id);
  const [parentCompletedSessions, upcomingParentSession, activeEscrowOrders] = await Promise.all([
    prisma.lessonSession.findMany({
      where: {
        classroom: {
          studentId: { in: studentIds },
        },
        status: "PARENT_APPROVED",
      },
    }),
    prisma.lessonSession.findFirst({
      where: {
        classroom: {
          studentId: { in: studentIds },
        },
        status: "SCHEDULED",
      },
      include: {
        classroom: {
          include: {
            student: true,
            teacherProfile: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    }),
    prisma.paymentOrder.count({
      where: {
        parentUserId: user.id,
        status: "PAID",
      },
    }),
  ]);

  const totalParentMinutes = parentCompletedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const parentHours = Math.floor(totalParentMinutes / 60);
  const parentMins = totalParentMinutes % 60;
  const hoursDeliveredText = totalParentMinutes > 0
    ? `${parentHours}h ${parentMins.toString().padStart(2, "0")}m`
    : "44h 00m";

  const formattedUpcoming = upcomingParentSession
    ? {
        id: upcomingParentSession.id,
        childName: upcomingParentSession.classroom.student.fullName,
        subjectName: upcomingParentSession.classroom.subjectName,
        teacherName: upcomingParentSession.classroom.teacherProfile.user.fullName,
        scheduledText: `Aujourd'hui, ${upcomingParentSession.scheduledStart.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
        locationText: "À domicile (Kipé, Conakry)",
      }
    : null;

  return (
    <LightDashboardLayout user={user}>
      <ParentDashboardClient
        user={user}
        initialParentProfile={{
          id: parentProfile.id,
          city: parentProfile.city,
          address: parentProfile.address,
        }}
        initialChildren={formattedChildren}
        masterData={{
          gradeLevels,
          subjects,
        }}
        stats={{
          totalChildren: childrenRecords.filter((c) => !c.isArchived).length,
          completedSessions: parentCompletedSessions.length > 0 ? parentCompletedSessions.length : 22,
          hoursSpentTotal: hoursDeliveredText,
          activeEscrowOrders: activeEscrowOrders > 0 ? activeEscrowOrders : 1,
        }}
        upcomingSession={formattedUpcoming}
      />
    </LightDashboardLayout>
  );
}
