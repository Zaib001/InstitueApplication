import React from "react";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { OpportunityDetailClient } from "@/components/teacher/OpportunityDetailClient";
import { calculateOpportunityMatch } from "@/lib/marketplace/matching";

export const dynamic = "force-dynamic";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: OpportunityDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const { id } = resolvedParams;

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=/teacher/opportunities/${id}`);
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  // 1. Fetch teacher profile with subjects and grade levels
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      subjects: { include: { subject: true } },
      gradeLevels: { include: { gradeLevel: true } },
    },
  });

  const isTeacherApproved = teacherProfile?.verificationStatus === "APPROVED";

  // 2. Fetch tutoring request from PostgreSQL
  const tutoringRequest = await prisma.tutoringRequest.findUnique({
    where: { id },
    select: {
      id: true,
      subjectId: true,
      subjectName: true,
      customSubject: true,
      cycle: true,
      customCycle: true,
      gradeLevelName: true,
      mode: true,
      frequency: true,
      preferredSchedule: true,
      sessionDurationMinutes: true,
      budgetGnf: true,
      budgetType: true,
      city: true,
      commune: true,
      neighborhood: true,
      learningGoals: true,
      publishedAt: true,
      createdAt: true,
      status: true,
      student: {
        select: {
          fullName: true,
          gradeLevel: true,
        },
      },
    },
  });

  if (!tutoringRequest) {
    notFound();
  }

  // 3. Fetch existing application for this teacher if any
  const existingApplication = teacherProfile
    ? await prisma.teacherApplication.findUnique({
        where: {
          requestId_teacherProfileId: {
            requestId: id,
            teacherProfileId: teacherProfile.id,
          },
        },
      })
    : null;

  // If request is not OPEN and teacher hasn't already applied, redirect
  if (tutoringRequest.status !== "OPEN" && !existingApplication) {
    redirect("/teacher/opportunities");
  }

  // 4. Calculate match score
  const matchResult = teacherProfile
    ? calculateOpportunityMatch(
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
        {
          id: tutoringRequest.id,
          subjectId: tutoringRequest.subjectId,
          subjectName: tutoringRequest.subjectName,
          customSubject: tutoringRequest.customSubject,
          cycle: tutoringRequest.cycle,
          customCycle: tutoringRequest.customCycle,
          gradeLevelName: tutoringRequest.gradeLevelName,
          mode: tutoringRequest.mode,
          city: tutoringRequest.city,
          commune: tutoringRequest.commune,
          budgetGnf: tutoringRequest.budgetGnf,
          status: tutoringRequest.status,
        }
      )
    : {
        isMatch: false,
        isRecommended: false,
        score: 0,
        reasons: [],
        breakdown: {
          subjectMatched: false,
          levelMatched: false,
          modeMatched: false,
          locationMatched: false,
        },
      };

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <OpportunityDetailClient
        opportunity={{
          id: tutoringRequest.id,
          subjectId: tutoringRequest.subjectId,
          subjectName: tutoringRequest.subjectName,
          customSubject: tutoringRequest.customSubject,
          cycle: tutoringRequest.cycle,
          customCycle: tutoringRequest.customCycle,
          gradeLevelName: tutoringRequest.gradeLevelName,
          mode: tutoringRequest.mode,
          frequency: tutoringRequest.frequency,
          preferredSchedule: tutoringRequest.preferredSchedule,
          sessionDurationMinutes: tutoringRequest.sessionDurationMinutes,
          budgetGnf: tutoringRequest.budgetGnf,
          budgetType: tutoringRequest.budgetType,
          city: tutoringRequest.city,
          commune: tutoringRequest.commune,
          neighborhood: tutoringRequest.neighborhood,
          learningGoals: tutoringRequest.learningGoals,
          publishedAt: (tutoringRequest.publishedAt || tutoringRequest.createdAt).toISOString(),
          status: tutoringRequest.status,
          studentDisplay: `${tutoringRequest.student.fullName.split(" ")[0]} (${tutoringRequest.gradeLevelName})`,
          matchResult,
          isTeacherApproved,
          existingApplication: existingApplication
            ? {
                id: existingApplication.id,
                pitchMessage: existingApplication.pitchMessage,
                proposedRateGnf: existingApplication.proposedRateGnf,
                proposedRateType: existingApplication.proposedRateType,
                sessionArrangement: existingApplication.sessionArrangement,
                availabilityNotes: existingApplication.availabilityNotes,
                status: existingApplication.status,
                createdAt: existingApplication.createdAt.toISOString(),
                updatedAt: existingApplication.updatedAt.toISOString(),
                withdrawnAt: existingApplication.withdrawnAt?.toISOString() || null,
                rejectionReason: existingApplication.rejectionReason,
              }
            : null,
          teacherProfileSnapshot: {
            hourlyRateGnf: teacherProfile?.hourlyRateGnf,
            monthlyPackageRateGnf: teacherProfile?.monthlyPackageRateGnf,
            city: teacherProfile?.city,
          },
        }}
      />
    </LightDashboardLayout>
  );
}
