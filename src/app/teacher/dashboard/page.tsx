import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";
import { LightDashboardLayout } from "@/components/dashboard/LightDashboardLayout";
import { LightDashboardView } from "@/components/dashboard/LightDashboardView";
import { ShieldAlert, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?callbackUrl=/teacher/dashboard");
  }

  if (user.role !== UserRole.TEACHER) {
    if (user.role === UserRole.PARENT) redirect("/parent/dashboard");
    if (user.role === UserRole.ADMIN) redirect("/admin/dashboard");
    redirect("/login");
  }

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: user.id },
    include: {
      documents: true,
      earnings: true,
      classrooms: true,
    },
  });

  const verificationStatus =
    teacherProfile?.verificationStatus ?? TeacherVerificationStatus.PENDING_REVIEW;
  const isApproved = verificationStatus === TeacherVerificationStatus.APPROVED;

  return (
    <LightDashboardLayout user={user}>
      <div className="flex-1 flex flex-col">
        {/* Verification Status Notice if Pending */}
        {!isApproved && (
          <div className="mx-6 lg:mx-8 mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-amber-900">
                  Dossier Enseignant en cours d'examen (Statut: {verificationStatus})
                </span>
                <span className="text-[11px] text-amber-800">
                  Votre compte est initialisé. L'accès aux candidatures directes sera débloqué après vérification de vos pièces justificatives.
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900">
              Délai &lt; 24h
            </span>
          </div>
        )}

        <LightDashboardView
          user={user}
          stats={{
            inProgress: teacherProfile?.classrooms.length ?? 3,
            completed: 24,
            achievements: 15,
            hoursSpentTotal: "86h 30m",
            performancePercent: 85,
          }}
          customCourses={[
            {
              id: "t1",
              title: "Physique Appliquée — Classe Terminale SM",
              lessonsCount: 12,
              progressPercent: 65,
            },
            {
              id: "t2",
              title: "Mathématiques Générales — Collège 10ème",
              lessonsCount: 8,
              progressPercent: 40,
            },
          ]}
        />
      </div>
    </LightDashboardLayout>
  );
}
