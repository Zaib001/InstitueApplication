import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { TeacherVerificationStatus, UserRole } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import {
  TeacherPricingManager,
  PricingOfferItem,
} from "@/components/teacher/TeacherPricingManager";

export const dynamic = "force-dynamic";

export default async function TeacherPricingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/pricing");
  }

  if (user.role !== UserRole.TEACHER) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.ADMIN) redirect("/admin/dashboard");
    redirect("/login");
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      pricingOffers: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!teacherProfile) {
    redirect("/teacher/onboarding");
  }

  const formattedOffers: PricingOfferItem[] = teacherProfile.pricingOffers.map(
    (o) => ({
      id: o.id,
      type: o.type,
      title: o.title,
      totalPriceGnf: o.totalPriceGnf,
      sessionsCount: o.sessionsCount,
      minutesPerSession: o.minutesPerSession,
      description: o.description,
      isActive: o.isActive,
      createdAt: o.createdAt.toISOString(),
    })
  );

  const isApproved =
    teacherProfile.verificationStatus === TeacherVerificationStatus.APPROVED;

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <TeacherPricingManager
        initialOffers={formattedOffers}
        isTeacherApproved={isApproved}
      />
    </LightDashboardLayout>
  );
}

