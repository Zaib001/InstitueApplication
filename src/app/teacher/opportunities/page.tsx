import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { TeacherMarketplaceClient } from "@/components/teacher/TeacherMarketplaceClient";
import { calculateOpportunityMatch } from "@/lib/marketplace/matching";

export const dynamic = "force-dynamic";

export default async function TeacherOpportunitiesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/opportunities");
  }

  if (user.role !== UserRole.TEACHER && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  // 1. Fetch teacher profile with teaching specialties
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      subjects: { include: { subject: true } },
      gradeLevels: { include: { gradeLevel: true } },
    },
  });

  const isTeacherApproved = teacherProfile?.verificationStatus === "APPROVED";

  // 2. Fetch master subjects for filter dropdown
  const masterSubjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // 3. Fetch existing applications for this teacher
  const existingApplications = teacherProfile
    ? await prisma.teacherApplication.findMany({
        where: { teacherProfileId: teacherProfile.id },
        select: { id: true, requestId: true, status: true },
      })
    : [];

  const appMap = new Map(existingApplications.map((a) => [a.requestId, a]));

  // 4. Fetch open tutoring requests from PostgreSQL
  const openRequests = await prisma.tutoringRequest.findMany({
    where: { status: "OPEN" },
    orderBy: { publishedAt: "desc" },
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
    take: 50,
  });

  // 5. Calculate match scores
  const scoredOpportunities = openRequests.map((req) => {
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
            id: req.id,
            subjectId: req.subjectId,
            subjectName: req.subjectName,
            customSubject: req.customSubject,
            cycle: req.cycle,
            customCycle: req.customCycle,
            gradeLevelName: req.gradeLevelName,
            mode: req.mode,
            city: req.city,
            commune: req.commune,
            budgetGnf: req.budgetGnf,
            status: req.status,
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

    const existingApp = appMap.get(req.id);

    return {
      id: req.id,
      subjectId: req.subjectId,
      subjectName: req.subjectName,
      customSubject: req.customSubject,
      cycle: req.cycle,
      customCycle: req.customCycle,
      gradeLevelName: req.gradeLevelName,
      mode: req.mode,
      frequency: req.frequency,
      preferredSchedule: req.preferredSchedule,
      sessionDurationMinutes: req.sessionDurationMinutes,
      budgetGnf: req.budgetGnf,
      budgetType: req.budgetType,
      city: req.city,
      commune: req.commune,
      neighborhood: req.neighborhood,
      learningGoals: req.learningGoals,
      publishedAt: (req.publishedAt || req.createdAt).toISOString(),
      status: req.status,
      studentDisplay: `${req.student.fullName.split(" ")[0]} (${req.gradeLevelName})`,
      matchResult,
      hasApplied: !!existingApp,
      applicationId: existingApp?.id || null,
      applicationStatus: existingApp?.status || null,
    };
  });

  const recommendedOpportunities = scoredOpportunities.filter(
    (o) => o.matchResult.isRecommended
  );

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherMarketplaceClient
        initialOpportunities={
          recommendedOpportunities.length > 0
            ? recommendedOpportunities
            : scoredOpportunities
        }
        initialTotal={scoredOpportunities.length}
        initialRecommendedCount={recommendedOpportunities.length}
        isTeacherApproved={isTeacherApproved}
        masterSubjects={masterSubjects}
        teacherProfileSummary={{
          city: teacherProfile?.city || "Conakry",
          headline: teacherProfile?.headline,
          verificationStatus: teacherProfile?.verificationStatus || "DRAFT",
        }}
      />
    </LightDashboardLayout>
  );
}
