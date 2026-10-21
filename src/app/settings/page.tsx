import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardHeader user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Paramètres du Compte
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 pt-1">
            Gérez vos informations personnelles, vos coordonnées et la sécurité de votre mot de passe.
          </p>
        </div>

        <ProfileSettingsForm
          user={user}
          initialAddress={address}
          initialCity={city}
        />
      </main>
    </div>
  );
}
