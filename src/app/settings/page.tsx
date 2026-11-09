import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { AccountSettingsClient } from "@/components/dashboard/AccountSettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/settings");
  }

  // Fetch complete profile with metadata, joined profiles, and counts
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      createdAt: true,
      parentProfile: {
        select: {
          address: true,
          city: true,
          children: {
            select: { id: true },
          },
        },
      },
      teacherProfile: {
        select: {
          city: true,
          verificationStatus: true,
          classrooms: {
            select: { id: true },
          },
        },
      },
    },
  });

  const address = dbUser?.parentProfile?.address ?? null;
  const city =
    dbUser?.parentProfile?.city ??
    dbUser?.teacherProfile?.city ??
    "Conakry";

  const memberSince = dbUser?.createdAt
    ? dbUser.createdAt.toISOString()
    : new Date().toISOString();

  const stats = {
    childrenCount: dbUser?.parentProfile?.children?.length ?? 0,
    classroomsCount: dbUser?.teacherProfile?.classrooms?.length ?? 0,
    verificationStatus: dbUser?.teacherProfile?.verificationStatus ?? null,
  };

  return (
    <LightDashboardLayout user={user} hideRightProfile={true}>
      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <AccountSettingsClient
          user={user}
          initialAddress={address}
          initialCity={city}
          memberSince={memberSince}
          stats={stats}
        />
      </div>
    </LightDashboardLayout>
  );
}
