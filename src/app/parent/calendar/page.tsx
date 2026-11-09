import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ClassroomCalendar } from "@/components/calendar/ClassroomCalendar";
import { CalendarSessionItem } from "@/components/calendar/SessionDetailModal";
import { ClassroomOption } from "@/components/calendar/SchedulePackageModal";
import { SchedulingEngine } from "@/lib/scheduling/scheduling-engine";

export const dynamic = "force-dynamic";

export default async function ParentCalendarPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/parent/calendar");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/calendar");
    redirect("/login");
  }

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  if (!parentProfile && user.role !== UserRole.ADMIN) {
    redirect("/parent/dashboard");
  }

  // Fetch Parent's Classrooms
  const classroomsRaw = await prisma.classroom.findMany({
    where: {
      student: {
        parentId: parentProfile ? parentProfile.id : undefined,
      },
    },
    include: {
      student: { select: { fullName: true } },
      teacherProfile: {
        include: {
          user: { select: { fullName: true } },
        },
      },
      packages: {
        orderBy: { version: "desc" },
        take: 1,
      },
      _count: {
        select: {
          sessions: {
            where: { status: { not: "CANCELLED" } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const classroomOptions: ClassroomOption[] = classroomsRaw.map((c) => {
    const pkg = c.packages[0];
    const totalSessions = pkg ? pkg.sessionsCount : 8;
    const activeSessions = c._count.sessions;
    return {
      id: c.id,
      subjectName: c.subjectName,
      studentName: c.student.fullName,
      teacherName: c.teacherProfile.user.fullName,
      sessionsCount: totalSessions,
      minutesPerSession: pkg ? pkg.minutesPerSession : 60,
      activeSessionsCount: activeSessions,
      remainingToSchedule: Math.max(0, totalSessions - activeSessions),
      isAssisted: c.isAssistedAssignment,
      status: c.status,
    };
  });

  // Fetch Calendar Sessions
  const sessionsRaw = await SchedulingEngine.getCalendarSessions({
    userId: user.id,
    userRole: user.role,
  });

  const formattedSessions: CalendarSessionItem[] = sessionsRaw.map((s) => ({
    id: s.id,
    classroomId: s.classroomId,
    packageId: s.packageId,
    sessionSequence: s.sessionSequence,
    title: s.title,
    scheduledStart: s.scheduledStart.toISOString(),
    scheduledEnd: s.scheduledEnd.toISOString(),
    actualStart: s.actualStart ? s.actualStart.toISOString() : null,
    actualEnd: s.actualEnd ? s.actualEnd.toISOString() : null,
    durationMinutes: s.durationMinutes,
    actualDurationMinutes: s.actualDurationMinutes,
    attendanceStatus: s.attendanceStatus,
    attendanceNotes: s.attendanceNotes,
    allocatedAmountGnf: s.allocatedAmountGnf,
    platformCommissionGnf: s.platformCommissionGnf,
    teacherNetGnf: s.teacherNetGnf,
    isFunded: s.isFunded,
    status: s.status,
    rescheduledFromStart: s.rescheduledFromStart ? s.rescheduledFromStart.toISOString() : null,
    rescheduledFromEnd: s.rescheduledFromEnd ? s.rescheduledFromEnd.toISOString() : null,
    rescheduleReason: s.rescheduleReason,
    cancelledAt: s.cancelledAt ? s.cancelledAt.toISOString() : null,
    cancellationReason: s.cancellationReason,
    classroom: {
      id: s.classroom.id,
      subjectName: s.classroom.subjectName,
      mode: s.classroom.mode,
      externalVideoUrl: s.classroom.externalVideoUrl,
      student: {
        id: s.classroom.student.id,
        fullName: s.classroom.student.fullName,
        gradeLevel: s.classroom.student.gradeLevel,
        parent: {
          id: s.classroom.student.parent.id,
          user: {
            fullName: s.classroom.student.parent.user.fullName,
            phoneNumber: s.classroom.student.parent.user.phoneNumber,
          },
        },
      },
      teacherProfile: {
        id: s.classroom.teacherProfile.id,
        user: {
          fullName: s.classroom.teacherProfile.user.fullName,
          phoneNumber: s.classroom.teacherProfile.user.phoneNumber,
          email: s.classroom.teacherProfile.user.email,
        },
      },
    },
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <ClassroomCalendar
        initialSessions={formattedSessions}
        classrooms={classroomOptions}
        userRole={user.role}
        userFullName={user.fullName}
      />
    </LightDashboardLayout>
  );
}

