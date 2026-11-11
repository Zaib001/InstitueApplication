import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ParentStudentProgressClient } from "@/components/parent/ParentStudentProgressClient";

export const dynamic = "force-dynamic";

export default async function ParentProgressPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/parent/progress");
  }

  if (user.role !== UserRole.PARENT && user.role !== UserRole.ADMIN) {
    redirect("/login");
  }

  let childrenList: Array<{ id: string; fullName: string; gradeLevel: string }> = [];
  let firstStudentId: string | null = null;

  if (user.role === UserRole.PARENT) {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: {
        children: {
          where: { isArchived: false },
          select: { id: true, fullName: true, gradeLevel: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (parentProfile) {
      childrenList = parentProfile.children;
      if (parentProfile.children.length > 0) {
        firstStudentId = parentProfile.children[0].id;
      }
    }
  } else if (user.role === UserRole.ADMIN) {
    const firstStudent = await prisma.studentProfile.findFirst({
      where: { isArchived: false },
      select: { id: true, parentId: true },
      orderBy: { createdAt: "asc" },
    });
    if (firstStudent) {
      firstStudentId = firstStudent.id;
      const siblings = await prisma.studentProfile.findMany({
        where: { parentId: firstStudent.parentId, isArchived: false },
        select: { id: true, fullName: true, gradeLevel: true },
        orderBy: { createdAt: "asc" },
      });
      childrenList = siblings;
    }
  }

  if (!firstStudentId) {
    redirect("/parent/children");
  }

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <ParentStudentProgressClient
        studentId={firstStudentId}
        initialChildrenList={childrenList}
      />
    </LightDashboardLayout>
  );
}
