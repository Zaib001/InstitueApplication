import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AdminUsersClient } from "@/components/admin/AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/users");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
      teacherProfile: {
        select: {
          id: true,
          city: true,
          verificationStatus: true,
          headline: true,
          subjects: {
            select: {
              subject: { select: { name: true } },
            },
          },
        },
      },
      parentProfile: {
        select: {
          id: true,
          city: true,
          address: true,
          children: {
            select: { id: true, fullName: true, gradeLevel: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedUsers = users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phoneNumber: u.phoneNumber,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    teacherProfile: u.teacherProfile,
    parentProfile: u.parentProfile,
  }));

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <AdminUsersClient user={user} initialUsers={formattedUsers} />
    </LightDashboardLayout>
  );
}
