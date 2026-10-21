import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { ProfileSettingsForm } from "@/components/dashboard/ProfileSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/settings");
  }

  let address: string | null = null;
  let city: string | null = "Conakry";

  if (user.role === "PARENT") {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      select: { address: true, city: true },
    });
    address = parentProfile?.address ?? null;
    city = parentProfile?.city ?? "Conakry";
  } else if (user.role === "TEACHER") {
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: { city: true },
    });
    city = teacherProfile?.city ?? "Conakry";
  }

  return (
    <LightDashboardLayout user={user}>
      <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            Paramètres du Compte
          </h1>
          <p className="text-xs text-slate-400">
            Gérez vos coordonnées, informations personnelles et la sécurité de votre mot de passe.
          </p>
        </div>

        <ProfileSettingsForm
          user={user}
          initialAddress={address}
          initialCity={city}
        />
      </div>
    </LightDashboardLayout>
  );
}
