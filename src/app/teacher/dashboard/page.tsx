import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus, ClassroomStatus } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { LightDashboardView } from "@/components/dashboard/LightDashboardView";
import { TeacherStatusBanner } from "@/components/dashboard/TeacherStatusBanner";
import { calculateOpportunityMatch } from "@/lib/marketplace/matching";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/dashboard");
  }

  if (user.role !== UserRole.TEACHER) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.ADMIN) redirect("/admin/dashboard");
    redirect("/login");
  }

  // Fetch real teacher profile from PostgreSQL
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      documents: true,
      earnings: true,
      classrooms: {
        include: {
          student: true,
        },
      },
      subjects: {
        include: { subject: true },
      },
      gradeLevels: {
        include: { gradeLevel: true },
      },
      availabilities: true,
    },
  });

  const verificationStatus =
    teacherProfile?.verificationStatus ?? TeacherVerificationStatus.DRAFT;
  const isApproved = verificationStatus === TeacherVerificationStatus.APPROVED;

  // Fetch real classrooms, completed sessions, and upcoming session from database
  const classrooms = teacherProfile
    ? await prisma.classroom.findMany({
      where: {
        teacherProfileId: teacherProfile.id,
        status: { in: [ClassroomStatus.ACTIVE, ClassroomStatus.PENDING_PAYMENT] },
      },
      include: {
        student: true,
        sessions: {
          where: { status: "PARENT_APPROVED" },
        },
      },
    })
    : [];

  const completedSessions = teacherProfile
    ? await prisma.lessonSession.findMany({
      where: {
        classroom: { teacherProfileId: teacherProfile.id },
        status: "PARENT_APPROVED",
      },
    })
    : [];

  const totalMinutesDelivered = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const deliveredHours = Math.floor(totalMinutesDelivered / 60);
  const deliveredMins = totalMinutesDelivered % 60;
  const hoursSpentTotal = totalMinutesDelivered > 0
    ? `${deliveredHours}h ${deliveredMins.toString().padStart(2, "0")}m`
    : "0h 00m";

  const completedCount = completedSessions.length;

  // Next upcoming class to teach (strictly from database)
  const upcomingSession = teacherProfile
    ? await prisma.lessonSession.findFirst({
      where: {
        classroom: { teacherProfileId: teacherProfile.id },
        status: "SCHEDULED",
      },
      include: {
        classroom: {
          include: {
            student: true,
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    })
    : null;

  // Real course list from teacher's active classes: EMPTY if no assigned classes
  const realCourses = classrooms.length > 0
    ? classrooms.map((c) => ({
      id: c.id,
      title: `${c.subjectName} — ${c.student.fullName}`,
      lessonsCount: c.sessions.length,
      progressPercent: Math.min(100, Math.round((c.sessions.length / 8) * 100)),
    }))
    : [];

  // Calculate real net earnings (85% rule) exclusively from verified earnings records
  const totalTeacherNet = teacherProfile?.earnings.reduce((sum, e) => sum + e.teacherNetGnf, 0) || 0;
  const formattedNetEarnings = new Intl.NumberFormat("fr-GN").format(totalTeacherNet) + " GNF";

  // Marketplace opportunity & application metrics for teacher dashboard
  const [openOpportunitiesCount, teacherApplicationsCount, allOpenRequests] = await Promise.all([
    prisma.tutoringRequest.count({ where: { status: "OPEN" } }),
    teacherProfile
      ? prisma.teacherApplication.count({
          where: {
            teacherProfileId: teacherProfile.id,
            status: { in: ["SUBMITTED", "SHORTLISTED"] },
          },
        })
      : 0,
    teacherProfile
      ? prisma.tutoringRequest.findMany({
          where: { status: "OPEN" },
          select: {
            id: true,
            subjectId: true,
            subjectName: true,
            customSubject: true,
            cycle: true,
            customCycle: true,
            gradeLevelName: true,
            mode: true,
            city: true,
            commune: true,
            budgetGnf: true,
            status: true,
          },
        })
      : [],
  ]);

  const recommendedOpportunitiesCount = teacherProfile
    ? allOpenRequests.filter(
        (req) =>
          calculateOpportunityMatch(
            {
              id: teacherProfile.id,
              verificationStatus: teacherProfile.verificationStatus,
              city: teacherProfile.city,
              serviceArea: teacherProfile.serviceArea,
              isHomeAvailable: teacherProfile.isHomeAvailable,
              isOnlineAvailable: teacherProfile.isOnlineAvailable,
              customSubject: teacherProfile.customSubject,
              customGradeLevel: teacherProfile.customGradeLevel,
              subjects: teacherProfile.subjects,
              gradeLevels: teacherProfile.gradeLevels,
            },
            req
          ).isRecommended
      ).length
    : 0;

  // Formatted upcoming class details: null if no session exists
  const formattedUpcomingClass = upcomingSession
    ? {
      id: upcomingSession.id,
      title: upcomingSession.classroom.subjectName,
      scheduledText: `Aujourd'hui, ${upcomingSession.scheduledStart.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
      participant: `Élève : ${upcomingSession.classroom.student.fullName}`,
      rateOrEarningsText: `${new Intl.NumberFormat("fr-GN").format(Math.round((teacherProfile?.hourlyRateGnf || 100000) * 0.85))} GNF / séance`,
      locationText: teacherProfile?.serviceArea ? `À domicile (${teacherProfile.serviceArea})` : "À domicile (Conakry)",
    }
    : null;

  return (
    <LightDashboardLayout user={user}>
      <div className="flex-1 flex flex-col">
        {/* Verification Status Banner with 100% Bilingual Support */}
        <TeacherStatusBanner
          status={verificationStatus}
          rejectionReason={teacherProfile?.rejectionReason ?? null}
        />

        <LightDashboardView
          user={user}
          stats={{
            inProgress: classrooms.length,
            completed: completedCount,
            achievements: completedSessions.length > 0 ? 100 : 0,
            hoursSpentTotal,
            performancePercent: completedSessions.length > 0 ? 100 : 0,
          }}
          customCourses={realCourses}
          realEarnings={formattedNetEarnings}
          upcomingClass={formattedUpcomingClass}
          teacherMarketplaceSummary={{
            openOpportunitiesCount,
            pendingApplicationsCount: teacherApplicationsCount,
            recommendedCount: recommendedOpportunitiesCount,
          }}
        />
      </div>
    </LightDashboardLayout>
  );
}
