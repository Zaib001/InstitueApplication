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
  Clock,
  BookOpen,
  Calendar,
  Wallet,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  FileCheck,
} from "lucide-react";

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

  const verificationStatus = teacherProfile?.verificationStatus ?? TeacherVerificationStatus.PENDING_REVIEW;
  const isApproved = verificationStatus === TeacherVerificationStatus.APPROVED;

  const statusBadges = {
    DRAFT: {
      label: "Dossier Incomplet",
      bg: "bg-slate-500/20 text-slate-300 border-slate-500/30",
      icon: Clock,
    },
    PENDING_REVIEW: {
      label: "En attente de validation admin",
      bg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
      icon: Clock,
    },
    APPROVED: {
      label: "Professeur Certifié",
      bg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      icon: ShieldCheck,
    },
    REJECTED: {
      label: "Dossier Rejeté",
      bg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
      icon: AlertTriangle,
    },
  };

  const currentBadge = statusBadges[verificationStatus];
  const StatusIcon = currentBadge.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <DashboardHeader user={user} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* En-tête d'accueil */}
        <div className="rounded-3xl bg-gradient-to-r from-[#16385c] via-[#122b49] to-[#0c1c30] p-6 sm:p-8 border border-white/10 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${currentBadge.bg}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{currentBadge.label}</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Espace Enseignant • {user.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Consultez vos dossiers de candidature, vos cours programmés et vos rémunérations nettes (85% garantis sans frais cachés).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all inline-flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Mon Profil</span>
            </Link>
          </div>
        </div>

        {/* Bannière de Statut de Vérification (Non approuvé) */}
        {!isApproved && (
          <div className="rounded-2xl p-5 bg-amber-500/10 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm text-white">
                  {verificationStatus === TeacherVerificationStatus.PENDING_REVIEW
                    ? "Votre profil enseignant est en cours d'examen"
                    : "Votre profil nécessite des pièces justificatives"}
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Conformément aux exigences de sécurité de Monsieur Fanyi, l'accès aux candidatures directes et la création de classes sont réservés aux enseignants dont les diplômes ont été validés par l'administration.
                </p>
              </div>
            </div>
            <div className="shrink-0 text-xs text-amber-300 font-semibold bg-amber-500/20 px-3.5 py-1.5 rounded-full border border-amber-500/40">
              Délai moyen : &lt; 24h ouvrées
            </div>
          </div>
        )}

        {/* Métriques Clés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Classes Actives</span>
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {teacherProfile?.classrooms.length ?? 0}
            </div>
            <p className="text-[11px] text-slate-400">Élèves réguliers suivis</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Part Enseignant Nette</span>
              <Sparkles className="w-4 h-4 text-brand-gold" />
            </div>
            <div className="text-2xl font-black text-[#e59a38]">85 %</div>
            <p className="text-[11px] text-slate-400">Rémunération par cours validé</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Gains Cumulés</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">0 GNF</div>
            <p className="text-[11px] text-slate-400">Paiements reçus sur Orange/MTN</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Statut de Vérification</span>
              <FileCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-sm font-bold text-white pt-1">
              {currentBadge.label}
            </div>
            <p className="text-[11px] text-slate-400">Contrôle d'identité et diplômes</p>
          </div>
        </div>

        {/* Modules du Dashboard Enseignant */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            {/* Matières & Niveaux */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#e59a38]" />
                    <span>Matières enseignées & Tarifs</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Définissez les matières et les cycles scolaires que vous prenez en charge
                  </p>
                </div>
              </div>

              <div className="py-8 px-4 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 space-y-3">
                <div className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="text-xs text-slate-300 font-medium">
                  {isApproved
                    ? "Vous pouvez désormais configurer vos formules d'enseignement."
                    : "La configuration des formules sera activée dès la validation de votre dossier."}
                </div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Le catalogue des matières et le module d'onboarding complet seront déployés dans la phase suivante.
                </p>
              </div>
            </div>

            {/* Disponibilités */}
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-teal" />
                  <span>Créneaux de Disponibilités</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Vos plages horaires hebdomadaires pour les cours à domicile ou en ligne
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-xs text-slate-300">
                L'agenda interactif permettra de planifier vos créneaux réguliers dès l'ouverture des mises en relation.
              </div>
            </div>
          </div>

          {/* Colonne Droite : Coordonnées & Payout info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-3xl bg-slate-900/70 border border-slate-800 p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-slate-300" />
                <span>Mes Informations</span>
              </h2>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[11px]">Nom complet</div>
                  <div className="font-semibold text-white">{user.fullName}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Email</div>
                  <div className="font-semibold text-white truncate">{user.email}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Numéro de paiement Mobile Money</div>
                  <div className="font-semibold text-amber-300">{user.phoneNumber || "Non renseigné"}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-[11px]">Zone d'intervention</div>
                  <div className="font-semibold text-white">{teacherProfile?.city || "Conakry, Guinée"}</div>
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

            {/* Règle de rémunération SRD V2.0 */}
            <div className="rounded-3xl bg-[#16385c]/30 border border-blue-500/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#e59a38]" />
                <span>Rémunération Équitable SRD V2.0</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Vous percevez 85% du montant brut payé par le parent pour chaque séance validée. Dès validation du rapport pédagogique par la famille, vos fonds sont automatiquement débloqués.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
