import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { LightDashboardView } from "@/components/dashboard/LightDashboardView";
import { ShieldAlert, Users, FileCheck, Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/admin/dashboard");
  }

  if (user.role !== UserRole.ADMIN) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    redirect("/login");
  }

  const [totalUsers, totalParents, totalTeachers, pendingTeachersCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.PARENT } }),
      prisma.user.count({ where: { role: UserRole.TEACHER } }),
      prisma.teacherProfile.count({
        where: { verificationStatus: TeacherVerificationStatus.PENDING_REVIEW },
      }),
    ]);

  return (
    <LightDashboardLayout user={user}>
      <div className="flex-1 flex flex-col">
        {/* Admin Metric Highlights */}
        <div className="mx-6 lg:mx-8 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Total Inscrits</span>
              <span className="text-base font-extrabold text-slate-800">{totalUsers} utilisateurs</span>
            </div>
            <Users className="w-5 h-5 text-blue-600" />
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Professeurs à Valider</span>
              <span className="text-base font-extrabold text-amber-600">{pendingTeachersCount} dossiers</span>
            </div>
            <FileCheck className="w-5 h-5 text-amber-500" />
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Commission Plateforme</span>
              <span className="text-base font-extrabold text-emerald-600">15 % (SRD V2.0)</span>
            </div>
            <Percent className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <LightDashboardView
          user={user}
          stats={{
            inProgress: pendingTeachersCount,
            completed: totalUsers,
            achievements: 15,
            hoursSpentTotal: "340h 00m",
            performancePercent: 99,
          }}
          customCourses={[
            {
              id: "adm1",
              title: "Contrôle des Dossiers & Diplômes Enseignants",
              lessonsCount: pendingTeachersCount,
              progressPercent: 75,
            },
            {
              id: "adm2",
              title: "Surveillance des Comptes de Séquestre Orange & MTN",
              lessonsCount: 14,
              progressPercent: 92,
            },
          ]}
        />
      </div>
    </LightDashboardLayout>
  );
}
