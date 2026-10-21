import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole, TeacherVerificationStatus } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Percent,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  FileCheck,
  Building,
  CheckCircle2,
} from "lucide-react";

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

  // Fetch real platform metrics from PostgreSQL
  const [
    totalUsers,
    totalParents,
    totalTeachers,
    pendingTeachersCount,
    pendingTeachers,
    recentAudits,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.PARENT } }),
    prisma.user.count({ where: { role: UserRole.TEACHER } }),
    prisma.teacherProfile.count({
      where: { verificationStatus: TeacherVerificationStatus.PENDING_REVIEW },
    }),
    prisma.teacherProfile.findMany({
      where: { verificationStatus: TeacherVerificationStatus.PENDING_REVIEW },
      include: { user: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardHeader user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* En-tête d'accueil Administrateur */}
        <div className="rounded-3xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-[#0c1c30] p-6 sm:p-8 border border-rose-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Console d'Administration Nationale</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Tableau de Bord Administrateur
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Supervisez les validations de diplômes d'enseignants, surveillez les comptes de séquestre et pilotez la plateforme Monsieur Fanyi en Guinée.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Building className="w-4 h-4" />
              <span>Paramètres Sécurité</span>
            </Link>
          </div>
        </div>

        {/* 4 Métriques Administrateur Essentielles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Utilisateurs Inscrits</span>
              <Users className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-black text-white">{totalUsers}</div>
            <p className="text-[11px] text-slate-400">
              {totalParents} parents • {totalTeachers} professeurs
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Enseignants en Attente</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{pendingTeachersCount}</div>
            <p className="text-[11px] text-slate-400">Dossiers à contrôler & valider</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Commission Plateforme</span>
              <Percent className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl font-black text-[#e59a38]">15 %</div>
            <p className="text-[11px] text-slate-400">SRD V2.0 : 85% prof / 15% plateforme</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Litiges Ouverts</span>
              <AlertTriangle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">0</div>
            <p className="text-[11px] text-slate-400">Aucun arbitrage requis</p>
          </div>
        </div>

        {/* Grille principale : Validation des Enseignants & Journal d'Audit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Colonne Gauche (7 col) : Validation Enseignants */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <span>Dossiers Enseignants en Attente de Revue</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vérifiez les profils et diplômes déclarés avant d'activer le statut certifié
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingTeachersCount} en attente
                </span>
              </div>

              {pendingTeachers.length === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-xs text-slate-300 font-medium">
                    Tous les dossiers enseignants ont été traités !
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Aucune validation en attente pour le moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTeachers.map((tp) => (
                    <div
                      key={tp.id}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{tp.user.fullName}</div>
                        <div className="text-slate-400 text-[11px]">{tp.user.email} • {tp.city}</div>
                        <div className="text-[10px] text-amber-400/90 pt-0.5">
                          Statut : {tp.verificationStatus}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                          À traiter Phase 03
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modules du SRD V2.0 */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-400" />
                <span>Modules de Gestion de la Plateforme</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
                  <div className="font-bold text-white">Demandes</div>
                  <div className="text-[10px] text-slate-400">Besoins de cours</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
                  <div className="font-bold text-white">Classes</div>
                  <div className="text-[10px] text-slate-400">Séances & Rapports</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
                  <div className="font-bold text-white">Séquestre</div>
                  <div className="text-[10px] text-slate-400">Fonds cantonnés</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
                  <div className="font-bold text-white">Commissions</div>
                  <div className="text-[10px] text-slate-400">15% plateforme</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
                  <div className="font-bold text-white">Litiges</div>
                  <div className="text-[10px] text-slate-400">Médiation séances</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-300">
                  <div className="font-bold text-white">Versements</div>
                  <div className="text-[10px] text-slate-400">Payouts 85% profs</div>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne Droite (5 col) : Journal d'Audit & Sécurité */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <span>Journal d'Audit Récent</span>
              </h2>

              <div className="space-y-2.5">
                {recentAudits.length === 0 ? (
                  <div className="text-xs text-slate-400 py-4 text-center">
                    Aucun événement d'audit enregistré.
                  </div>
                ) : (
                  recentAudits.map((audit) => (
                    <div
                      key={audit.id}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px]">{audit.action}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(audit.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Entité : {audit.entityType} ({audit.entityId.slice(0, 8)}...)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Directive de Sécurité Administrateur */}
            <div className="rounded-3xl bg-rose-950/20 border border-rose-500/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Règle Non-Négociable P02.08 / P02.12</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Les comptes administrateurs ne peuvent jamais être créés via l'inscription publique. Chaque accès administrateur est tracé dans la table d'audit et protégé par vérification côté serveur.
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
