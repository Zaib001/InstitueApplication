import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  RequestDetailsClient,
  DetailedRequestData,
} from "@/components/requests/RequestDetailsClient";

export const dynamic = "force-dynamic";

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const requestId = resolvedParams.id;

  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?callbackUrl=/parent/requests/${requestId}`);
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  // Find parent profile
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
  });

  if (!parentProfile && user.role !== UserRole.ADMIN) {
    redirect("/parent/dashboard");
  }

  // Fetch the request
  const request = await prisma.tutoringRequest.findUnique({
    where: { id: requestId },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          gradeLevel: true,
          cycle: true,
          customCycle: true,
          schoolName: true,
        },
      },
      classroom: {
        select: {
          id: true,
          status: true,
          isAssistedAssignment: true,
          hourlyRateGnf: true,
          monthlyRateGnf: true,
          teacherProfileId: true,
        },
      },
      applications: {
        include: {
          teacherProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatarUrl: true,
                },
              },
              subjects: {
                include: {
                  subject: true,
                },
              },
              gradeLevels: {
                include: {
                  gradeLevel: true,
                },
              },
              ratings: {
                select: {
                  score: true,
                  comment: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  if (!request) {
    notFound();
  }

  // Server-side ownership check (prevent IDOR)
  if (user.role !== UserRole.ADMIN && request.parentId !== parentProfile?.id) {
    notFound();
  }

  // Fetch active children & master data for editing
  const [childrenList, subjects, gradeLevels] = await Promise.all([
    parentProfile
      ? prisma.studentProfile.findMany({
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
        })
      : [],
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

  const formattedRequest: DetailedRequestData = {
    id: request.id,
    subjectId: request.subjectId,
    subjectName: request.subjectName,
    customSubject: request.customSubject,
    gradeLevelName: request.gradeLevelName,
    cycle: request.cycle,
    customCycle: request.customCycle,
    mode: request.mode,
    frequency: request.frequency,
    preferredSchedule: request.preferredSchedule,
    sessionDurationMinutes: request.sessionDurationMinutes,
    budgetGnf: request.budgetGnf,
    budgetType: request.budgetType,
    city: request.city,
    commune: request.commune,
    neighborhood: request.neighborhood,
    locationAddress: request.locationAddress,
    learningGoals: request.learningGoals,
    notes: request.notes,
    status: request.status,
    publishedAt: request.publishedAt ? request.publishedAt.toISOString() : null,
    cancelledAt: request.cancelledAt ? request.cancelledAt.toISOString() : null,
    cancellationReason: request.cancellationReason,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    student: {
      id: request.student.id,
      fullName: request.student.fullName,
      gradeLevel: request.student.gradeLevel,
      cycle: request.student.cycle,
      customCycle: request.student.customCycle,
      schoolName: request.student.schoolName,
    },
    classroom: request.classroom
      ? {
          id: request.classroom.id,
          status: request.classroom.status,
          isAssistedAssignment: request.classroom.isAssistedAssignment,
          hourlyRateGnf: request.classroom.hourlyRateGnf,
          monthlyRateGnf: request.classroom.monthlyRateGnf,
          teacherProfileId: request.classroom.teacherProfileId,
        }
      : null,
    applications: request.applications.map((app) => {
      const ratingAvg =
        app.teacherProfile.ratings.length > 0
          ? app.teacherProfile.ratings.reduce((acc, r) => acc + r.score, 0) /
            app.teacherProfile.ratings.length
          : null;

      return {
        id: app.id,
        status: app.status,
        proposedRateGnf: app.proposedRateGnf,
        proposedRateType: app.proposedRateType,
        sessionArrangement: app.sessionArrangement,
        availabilityNotes: app.availabilityNotes,
        pitchMessage: app.pitchMessage,
        rejectionReason: app.rejectionReason,
        decisionAt: app.decisionAt ? app.decisionAt.toISOString() : null,
        createdAt: app.createdAt.toISOString(),
        teacher: {
          id: app.teacherProfile.id,
          fullName: app.teacherProfile.user.fullName,
          avatarUrl: app.teacherProfile.user.avatarUrl,
          headline: app.teacherProfile.headline,
          bio: app.teacherProfile.bio,
          yearsOfExperience: app.teacherProfile.yearsOfExperience,
          city: app.teacherProfile.city,
          serviceArea: app.teacherProfile.serviceArea,
          degrees: app.teacherProfile.degrees,
          institution: app.teacherProfile.institution,
          isHomeAvailable: app.teacherProfile.isHomeAvailable,
          isOnlineAvailable: app.teacherProfile.isOnlineAvailable,
          verificationStatus: app.teacherProfile.verificationStatus,
          subjects: app.teacherProfile.subjects.map((s) => s.subject.name),
          gradeLevels: app.teacherProfile.gradeLevels.map((g) => g.gradeLevel.name),
          ratingAverage: ratingAvg ? Number(ratingAvg.toFixed(1)) : null,
          ratingsCount: app.teacherProfile.ratings.length,
        },
      };
    }),
    _count: {
      applications: request._count.applications,
    },
  };

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <RequestDetailsClient
        initialRequest={formattedRequest}
        childrenList={childrenList}
        masterData={{
          subjects,
          gradeLevels,
        }}
      />
    </LightDashboardLayout>
  );
}
