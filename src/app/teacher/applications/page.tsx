import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole, ApplicationStatus } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  TeacherApplicationsClient,
  TeacherApplicationListItem,
} from "@/components/teacher/TeacherApplicationsClient";

export const dynamic = "force-dynamic";

export default async function TeacherApplicationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/applications");
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  // 1. Fetch teacher profile
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
  });

  if (!teacherProfile && user.role === UserRole.TEACHER) {
    redirect("/teacher/dashboard");
  }

  const profileId = teacherProfile?.id || "admin-view";

  // 2. Fetch real applications for this teacher from PostgreSQL
  const applications = await prisma.teacherApplication.findMany({
    where: { teacherProfileId: profileId },
    orderBy: { createdAt: "desc" },
    include: {
      request: {
        select: {
          id: true,
          subjectName: true,
          customSubject: true,
          cycle: true,
          gradeLevelName: true,
          mode: true,
          frequency: true,
          budgetGnf: true,
          budgetType: true,
          city: true,
          commune: true,
          status: true,
          student: {
            select: {
              fullName: true,
              gradeLevel: true,
            },
          },
        },
      },
    },
  });

  // 3. Compute status counts
  const counts = {
    all: applications.length,
    submitted: applications.filter((a) => a.status === ApplicationStatus.SUBMITTED).length,
    shortlisted: applications.filter((a) => a.status === ApplicationStatus.SHORTLISTED).length,
    accepted: applications.filter((a) => a.status === ApplicationStatus.ACCEPTED).length,
    rejected: applications.filter((a) => a.status === ApplicationStatus.REJECTED).length,
    withdrawn: applications.filter((a) => a.status === ApplicationStatus.WITHDRAWN).length,
  };

  const formattedApplications: TeacherApplicationListItem[] = applications.map((app) => ({
    id: app.id,
    requestId: app.requestId,
    pitchMessage: app.pitchMessage,
    proposedRateGnf: app.proposedRateGnf,
    proposedRateType: app.proposedRateType,
    sessionArrangement: app.sessionArrangement,
    availabilityNotes: app.availabilityNotes,
    status: app.status as any,
    rejectionReason: app.rejectionReason,
    withdrawnAt: app.withdrawnAt ? app.withdrawnAt.toISOString() : null,
    decisionAt: app.decisionAt ? app.decisionAt.toISOString() : null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    request: {
      id: app.request.id,
      subjectName: app.request.subjectName,
      customSubject: app.request.customSubject,
      cycle: app.request.cycle,
      gradeLevelName: app.request.gradeLevelName,
      mode: app.request.mode,
      frequency: app.request.frequency,
      budgetGnf: app.request.budgetGnf,
      budgetType: app.request.budgetType,
      city: app.request.city,
      commune: app.request.commune,
      status: app.request.status,
      studentDisplay: `${app.request.student.fullName.split(" ")[0]} (${app.request.gradeLevelName})`,
    },
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherApplicationsClient
        initialApplications={formattedApplications}
        initialCounts={counts}
      />
    </LightDashboardLayout>
  );
}
