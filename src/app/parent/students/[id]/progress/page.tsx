import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentStudentProgressClient } from "@/components/parent/ParentStudentProgressClient";

export const dynamic = "force-dynamic";

export default async function ParentStudentProgressPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  const { id: studentId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/parent/students/${studentId}/progress`);
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  // Fetch children for parent switcher
  let childrenList: Array<{ id: string; fullName: string; gradeLevel: string }> = [];
  if (user.role === UserRole.PARENT) {
    const parent = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: {
        children: {
          where: { isArchived: false },
          select: { id: true, fullName: true, gradeLevel: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (parent) {
      childrenList = parent.children;
    }
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <ParentStudentProgressClient
        studentId={studentId}
        initialChildrenList={childrenList}
      />
    </LightDashboardLayout>
  );
}
