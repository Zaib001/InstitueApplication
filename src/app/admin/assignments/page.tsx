import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { ClassroomStatus, UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  AdminAssignmentsClient,
  ClassroomItem,
} from "@/components/admin/AdminAssignmentsClient";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/assignments");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  const [classrooms, totalCount, assistedCount, marketplaceCount, pendingPaymentCount, activeCount] =
    await Promise.all([
      prisma.classroom.findMany({
        include: {
          student: {
            include: {
              parent: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
          teacherProfile: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phoneNumber: true,
                  avatarUrl: true,
                },
              },
            },
          },
          assignedByAdmin: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              sessions: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.classroom.count(),
      prisma.classroom.count({ where: { isAssistedAssignment: true } }),
      prisma.classroom.count({ where: { isAssistedAssignment: false } }),
      prisma.classroom.count({ where: { status: ClassroomStatus.PENDING_PAYMENT } }),
      prisma.classroom.count({ where: { status: ClassroomStatus.ACTIVE } }),
    ]);

  const formatted: ClassroomItem[] = classrooms.map((c) => ({
    id: c.id,
    requestId: c.requestId,
    subjectName: c.subjectName,
    mode: c.mode,
    hourlyRateGnf: c.hourlyRateGnf,
    monthlyRateGnf: c.monthlyRateGnf,
    isAssistedAssignment: c.isAssistedAssignment,
    assignmentSource: c.assignmentSource,
    adminNotes: c.adminNotes,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    student: {
      id: c.student.id,
      fullName: c.student.fullName,
      gradeLevel: c.student.gradeLevel,
      cycle: c.student.cycle,
      parent: {
        id: c.student.parent.id,
        fullName: c.student.parent.user.fullName,
        email: c.student.parent.user.email,
        phoneNumber: c.student.parent.user.phoneNumber,
      },
    },
    teacher: {
      id: c.teacherProfile.id,
      fullName: c.teacherProfile.user.fullName,
      email: c.teacherProfile.user.email,
      phoneNumber: c.teacherProfile.user.phoneNumber,
      avatarUrl: c.teacherProfile.user.avatarUrl,
    },
    assignedByAdmin: c.assignedByAdmin
      ? {
          id: c.assignedByAdmin.id,
          fullName: c.assignedByAdmin.fullName,
        }
      : null,
    sessionsCount: c._count.sessions,
  }));

  const stats = {
    total: totalCount,
    assisted: assistedCount,
    marketplace: marketplaceCount,
    pendingPayment: pendingPaymentCount,
    active: activeCount,
  };

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminAssignmentsClient initialClassrooms={formatted} stats={stats} />
    </LightDashboardLayout>
  );
}

