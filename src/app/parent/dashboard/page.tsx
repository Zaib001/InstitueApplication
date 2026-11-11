import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentDashboardClient } from "@/components/parent/ParentDashboardClient";
import { deriveStudentRequestStatus } from "@/lib/requests/student-request-status";

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

  // Fetch real children from PostgreSQL with requests and classrooms
  const childrenRecords = await prisma.studentProfile.findMany({
    where: { parentId: parentProfile.id },
    include: {
      tutoringRequests: {
        select: {
          id: true,
          status: true,
          subjectName: true,
          customSubject: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
      classrooms: {
        select: {
          id: true,
          status: true,
          subjectName: true,
        },
        orderBy: { createdAt: "desc" },
      },
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

  const formattedChildren = childrenRecords.map((c) => {
    const requestStatus = deriveStudentRequestStatus(
      c.id,
      c.tutoringRequests,
      c.classrooms
    );

    return {
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
      requestStatus,
      _count: c._count,
    };
  });

  // Fetch real delivered sessions count and total hours for this parent's children
  const studentIds = childrenRecords.map((c) => c.id);
  const [
    parentCompletedSessions,
    upcomingParentSession,
    activeEscrowOrders,
    totaltutoringRequests,
    recentTutoringRequests,
    pendingValidationSessions,
  ] = await Promise.all([
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
    prisma.tutoringRequest.count({
      where: { parentId: parentProfile.id },
    }),
    prisma.tutoringRequest.findMany({
      where: { parentId: parentProfile.id },
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        student: {
          select: { id: true, fullName: true, gradeLevel: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    }),
    // REQUIREMENT 4: Authoritative Lesson Reports Awaiting Parent Review / Validation
    prisma.lessonSession.findMany({
      where: {
        classroom: {
          studentId: { in: studentIds },
        },
        OR: [
          { status: "TEACHER_COMPLETED" },
          { report: { status: "SUBMITTED" } },
        ],
        NOT: {
          status: { in: ["PARENT_APPROVED", "PARENT_DISPUTED"] },
        },
      },
      include: {
        classroom: {
          include: {
            student: {
              select: { id: true, fullName: true, gradeLevel: true },
            },
            teacherProfile: {
              include: {
                user: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
        },
        report: {
          select: {
            id: true,
            status: true,
            topicsCovered: true,
            submittedAt: true,
            learningObjectives: true,
          },
        },
      },
      orderBy: { scheduledStart: "desc" },
      take: 10,
    }),
  ]);

  // Construct Action Center Items (Authoritative DB records)
  // Priority 1: Pending Lesson Reports to Validate
  const reportActions = pendingValidationSessions.map((s) => ({
    id: `report-${s.id}`,
    type: "PENDING_REPORT" as const,
    priority: 1,
    titleFr: "Compte rendu en attente de validation",
    titleEn: "Lesson report awaiting validation",
    sessionId: s.id,
    studentName: s.classroom.student.fullName,
    teacherName: s.classroom.teacherProfile.user.fullName,
    subjectName: s.classroom.subjectName,
    lessonDate: s.scheduledStart.toISOString(),
    submittedDate: s.report?.submittedAt ? s.report.submittedAt.toISOString() : s.updatedAt.toISOString(),
    topicsExcerpt: s.report?.topicsCovered || null,
    actionLabelFr: "Consulter et valider",
    actionLabelEn: "Review & Validate",
    actionHref: `/parent/reports?sessionId=${s.id}`,
  }));

  // Priority 2: Registered Children without Tutoring Requests
  const unrequestedChildren = formattedChildren.filter(
    (c) => !c.isArchived && c.requestStatus.state === "NO_REQUEST"
  );

  const unrequestedActions = unrequestedChildren.map((c) => ({
    id: `unrequested-${c.id}`,
    type: "UNSUBMITTED_REQUEST" as const,
    priority: 2,
    titleFr: `Demande de cours à créer pour ${c.fullName}`,
    titleEn: `Tutoring request needed for ${c.fullName}`,
    studentId: c.id,
    studentName: c.fullName,
    gradeLevel: c.gradeLevel,
    descriptionFr: `Vous avez inscrit ${c.fullName} (${c.gradeLevel}), mais aucune demande de cours n'a encore été envoyée. Créez une demande pour être mis en relation avec un professeur agréé.`,
    descriptionEn: `You registered ${c.fullName} (${c.gradeLevel}), but no tutoring request has been submitted yet. Create a request to match an approved tutor.`,
    actionLabelFr: "Faire une demande de cours",
    actionLabelEn: "Request a Tutor",
    actionHref: `/parent/requests?action=new&studentId=${c.id}`,
  }));

  // Combined and sorted by priority (reports first, then unsubmitted requests)
  const actionCenterItems = [...reportActions, ...unrequestedActions];

  const totalParentMinutes = parentCompletedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const parentHours = Math.floor(totalParentMinutes / 60);
  const parentMins = totalParentMinutes % 60;
  const hoursDeliveredText = `${parentHours}h ${parentMins.toString().padStart(2, "0")}m`;

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
          completedSessions: parentCompletedSessions.length,
          hoursSpentTotal: hoursDeliveredText,
          activeEscrowOrders: activeEscrowOrders,
        }}
        upcomingSession={formattedUpcoming}
        actionCenterItems={actionCenterItems}
        requestsSummary={{
          totalCount: totaltutoringRequests,
          recentRequests: recentTutoringRequests.map((r) => ({
            id: r.id,
            subjectName: r.subjectName,
            customSubject: r.customSubject,
            gradeLevelName: r.gradeLevelName,
            mode: r.mode,
            budgetGnf: r.budgetGnf,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
            studentName: r.student.fullName,
            applicationsCount: r._count.applications,
          })),
        }}
      />
    </LightDashboardLayout>
  );
}
