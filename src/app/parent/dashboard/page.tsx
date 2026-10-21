import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  Users,
  BookOpen,
  Calendar,
  CreditCard,
  TrendingUp,
  User,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const user = await getCurrentUser();

  // Server-side authentication & role protection
  if (!user) {
    redirect("/login?callbackUrl=/parent/dashboard");
  }

  if (user.role !== UserRole.PARENT) {
    if (user.role === UserRole.TEACHER) redirect("/teacher/dashboard");
    if (user.role === UserRole.ADMIN) redirect("/admin/dashboard");
    redirect("/login");
  }

  // Fetch real parent profile & associated children from PostgreSQL
  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: {
      children: {
        orderBy: { createdAt: "desc" },
      },
      tutoringRequests: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  const childrenCount = parentProfile?.children.length ?? 0;
  const requestsCount = parentProfile?.tutoringRequests.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardHeader user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* En-tête d'accueil personnalisé avec données réelles */}
        <div className="rounded-3xl bg-gradient-to-r from-[#16385c] via-[#122b49] to-[#0c1c30] p-6 sm:p-8 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>Espace Famille Sécurisé</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Bienvenue, {user.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Gérez le soutien scolaire de vos enfants, suivez les séances dispensées et effectuez vos versements en toute sérénité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all inline-flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Mon Profil</span>
            </Link>
          </div>
        </div>

        {/* Grille de Cartes d'Accès Rapide aux Modules */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Enfants enregistrés</span>
              <Users className="w-4 h-4 text-brand-teal" />
            </div>
            <div className="text-2xl font-black text-white">{childrenCount}</div>
            <p className="text-[11px] text-slate-400">Profils d'élèves rattachés</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Demandes de cours</span>
              <BookOpen className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl font-black text-white">{requestsCount}</div>
            <p className="text-[11px] text-slate-400">Besoins d'enseignement publiés</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Classes Actives</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">0</div>
            <p className="text-[11px] text-slate-400">Cours hebdomadaires en cours</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Séquestre Garanti</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">0 GNF</div>
            <p className="text-[11px] text-slate-400">Fonds protégés en attente de cours</p>
          </div>
        </div>

        {/* Section Principale en 2 Colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Colonne Gauche (8 col) : Enfants & Demandes */}
          <div className="lg:col-span-8 space-y-6">
            {/* Mes Enfants */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#e59a38]" />
                    <span>Mes Enfants</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Les élèves dont vous suivez le parcours éducatif
                  </p>
                </div>
              </div>

              {childrenCount === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Aucun profil d'enfant n'est encore enregistré.
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    L'ajout complet de vos enfants avec leurs classes et bulletins sera configuré dans le module de gestion des élèves.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {parentProfile?.children.map((child) => (
                    <div
                      key={child.id}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1"
                    >
                      <div className="text-sm font-bold text-white">{child.fullName}</div>
                      <div className="text-xs text-[#e59a38] font-medium">{child.gradeLevel}</div>
                      {child.schoolName && (
                        <div className="text-[11px] text-slate-400">{child.schoolName}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Demandes de soutien */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    <span>Demandes de cours publiées</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vos besoins d'enseignement en cours de mise en relation
                  </p>
                </div>
              </div>

              {requestsCount === 0 ? (
                <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Aucune demande de cours active pour le moment.
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Vous pourrez publier vos besoins de répétiteurs dès la publication du catalogue des matières.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parentProfile?.tutoringRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{req.subjectName}</div>
                        <div className="text-slate-400">{req.gradeLevelName} • {req.city}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#e59a38]">{req.budgetGnf.toLocaleString()} GNF</div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Colonne Droite (4 col) : Informations du Compte & Sécurité */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Informations du Compte</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{user.fullName}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{user.phoneNumber || "Numéro non renseigné"}</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{parentProfile?.city || "Conakry, Guinée"}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Link
                  href="/settings"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Mettre à jour mes coordonnées</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Encadré d'assurance / Sécurité */}
            <div className="rounded-3xl bg-emerald-950/20 border border-emerald-500/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Paiement Sécurisé & Séquestre</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Sur Monsieur Fanyi, vos versements restent protégés sur un compte de cantonnement jusqu'à ce que vous validiez personnellement le rapport du professeur après chaque cours.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
