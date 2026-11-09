"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Send,
  Trash2,
  Home,
  Monitor,
  Layers,
  Check,
  Loader2,
  DollarSign,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { TeacherApplicationForm } from "./TeacherApplicationForm";
import { MatchResult } from "@/lib/marketplace/matching";

interface DetailedOpportunity {
  id: string;
  subjectId?: string | null;
  subjectName: string;
  customSubject?: string | null;
  cycle?: string | null;
  customCycle?: string | null;
  gradeLevelName: string;
  mode: string;
  frequency?: string | null;
  preferredSchedule?: string | null;
  sessionDurationMinutes: number;
  budgetGnf: number;
  budgetType: string;
  city: string;
  commune?: string | null;
  neighborhood?: string | null;
  learningGoals?: string | null;
  publishedAt: string;
  status: string;
  studentDisplay?: string;
  matchResult: MatchResult;
  existingApplication?: {
    id: string;
    pitchMessage?: string | null;
    proposedRateGnf?: number | null;
    proposedRateType?: string | null;
    sessionArrangement?: string | null;
    availabilityNotes?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    withdrawnAt?: string | null;
    rejectionReason?: string | null;
  } | null;
  isTeacherApproved: boolean;
  teacherProfileSnapshot?: {
    hourlyRateGnf?: number | null;
    monthlyPackageRateGnf?: number | null;
    city?: string;
  };
}

interface OpportunityDetailClientProps {
  opportunity: DetailedOpportunity;
}

export function OpportunityDetailClient({ opportunity }: OpportunityDetailClientProps) {
  const { locale } = useTranslation();
  const router = useRouter();

  const [application, setApplication] = useState(opportunity.existingApplication || null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const isCustom = opportunity.subjectName.toLowerCase() === "autre" && opportunity.customSubject;
  const match = opportunity.matchResult;

  const handleWithdraw = async () => {
    if (!application) return;
    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      const res = await fetch(`/api/teacher/applications/${application.id}/withdraw`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du retrait de la candidature.");
      }

      setApplication((prev) => (prev ? { ...prev, status: "WITHDRAWN", withdrawnAt: new Date().toISOString() } : null));
      setShowWithdrawConfirm(false);
      router.refresh();
    } catch (err: any) {
      setWithdrawError(err.message || "Erreur de retrait");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return {
          label: locale === "en" ? "Under Review" : "Candidature transmise",
          color: "bg-blue-50 text-[#16385c] border-blue-200",
        };
      case "SHORTLISTED":
        return {
          label: locale === "en" ? "Shortlisted" : "Présélectionnée par le parent",
          color: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "ACCEPTED":
        return {
          label: locale === "en" ? "Accepted • Class Created" : "Retenue • Classe créée",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "WITHDRAWN":
        return {
          label: locale === "en" ? "Withdrawn" : "Candidature retirée",
          color: "bg-slate-100 text-slate-600 border-slate-200",
        };
      case "REJECTED":
        return {
          label: locale === "en" ? "Declined" : "Déclinée",
          color: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          label: status,
          color: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/opportunities"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#16385c] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{locale === "en" ? "Back to Opportunities" : "Retour aux opportunités"}</span>
        </Link>
      </div>

      {/* Main Grid: Details Left, Application Form / State Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Opportunity Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-extrabold text-slate-900">
                    {isCustom ? opportunity.customSubject : opportunity.subjectName}
                  </span>
                  {isCustom && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      {locale === "en" ? "Custom Training" : "Spécifique"}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500">
                  {opportunity.gradeLevelName}
                  {opportunity.cycle && ` • Cycle ${opportunity.cycle}`}
                </p>
              </div>

              {match.score > 0 && (
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${match.isRecommended
                      ? "bg-amber-50 text-[#e59a38] border-[#e59a38]/40"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{match.score}% {locale === "en" ? "Match" : "Compatible"}</span>
                </div>
              )}
            </div>

            {/* Quick Spec Pills */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {opportunity.commune ? `${opportunity.commune}, ` : ""}
                  {opportunity.city}
                  {opportunity.neighborhood ? ` (${opportunity.neighborhood})` : ""}
                </span>
              </span>

              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{opportunity.sessionDurationMinutes} min / séance</span>
              </span>

              {opportunity.frequency && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{opportunity.frequency}</span>
                </span>
              )}
            </div>
          </div>

          {/* Match Analysis Card */}
          {match.reasons.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-[#e59a38]" />
                <span>{locale === "en" ? "Profile Match Breakdown" : "Détails de compatibilité avec votre profil"}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {match.reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedagogical Goals & Learning Requirements */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {locale === "en" ? "Pedagogical Goals & Expectations" : "Objectifs pédagogiques & Attentes"}
            </h3>

            {opportunity.learningGoals ? (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {opportunity.learningGoals}
              </p>
            ) : (
              <p className="text-xs text-slate-500 italic">
                {locale === "en"
                  ? "General academic support and exam preparation."
                  : "Renforcement scolaire général et préparation aux évaluations."}
              </p>
            )}

            {opportunity.preferredSchedule && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700 block">
                  {locale === "en" ? "Requested Schedule" : "Horaires souhaités par la famille"}
                </span>
                <p className="text-xs text-slate-600">{opportunity.preferredSchedule}</p>
              </div>
            )}
          </div>

          {/* Privacy & Safeguard Notice */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 text-xs space-y-1.5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#16385c] shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold text-slate-800">
                {locale === "en" ? "Confidentiality Protected" : "Protection de la vie privée"}
              </span>
              <p className="text-slate-500 text-[11px]">
                {locale === "en"
                  ? "Exact home addresses, full student records, and direct family contact numbers are strictly restricted until parent acceptance and classroom creation."
                  : "L'adresse résidentielle exacte, les coordonnées téléphoniques et le dossier scolaire complet de l'élève restent strictement confidentiels jusqu'à la sélection finale par le parent."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Application Form or Status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Budget & Terms Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {locale === "en" ? "Declared Budget" : "Budget déclaré par le parent"}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {opportunity.budgetType === "HOURLY" ? "Horaire" : "Mensuel"}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-[#16385c]">
                {formatGnf(opportunity.budgetGnf)}
                <span className="text-xs font-medium text-slate-500">
                  {opportunity.budgetType === "HOURLY" ? " / h" : " / mois"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {locale === "en"
                  ? "Standard Fanyi split: 85% teacher remuneration, 15% platform commission."
                  : "Rémunération standard Fanyi : 85% enseignant net, 15% commission plateforme."}
              </p>
            </div>
          </div>

          {/* Application Interaction Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
            {application ? (
              // Teacher already applied
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    {locale === "en" ? "Your Application" : "Votre candidature"}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(application.status).color
                      }`}
                  >
                    {getStatusBadge(application.status).label}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">
                      {locale === "en" ? "Proposed Rate" : "Tarif proposé"}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {application.proposedRateGnf
                        ? `${formatGnf(application.proposedRateGnf)} (${application.proposedRateType || "MONTHLY"})`
                        : "Non spécifié"}
                    </span>
                  </div>

                  {application.sessionArrangement && (
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">
                        {locale === "en" ? "Session Arrangement" : "Organisation proposée"}
                      </span>
                      <span className="text-slate-700">{application.sessionArrangement}</span>
                    </div>
                  )}

                  {application.pitchMessage && (
                    <div>
                      <span className="text-slate-400 block text-[11px] font-medium">
                        {locale === "en" ? "Pedagogical Note" : "Message transmis au parent"}
                      </span>
                      <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 italic">
                        &laquo; {application.pitchMessage} &raquo;
                      </p>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 pt-1">
                    {locale === "en" ? "Submitted on: " : "Transmise le : "}
                    {new Date(application.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>

                {/* Withdraw Action (allowed for SUBMITTED / SHORTLISTED) */}
                {["SUBMITTED", "SHORTLISTED"].includes(application.status) && (
                  <div className="pt-2 border-t border-slate-100">
                    {showWithdrawConfirm ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
                        <p className="font-bold text-red-800">
                          {locale === "en"
                            ? "Are you sure you want to withdraw your application?"
                            : "Confirmez-vous le retrait de votre candidature ?"}
                        </p>
                        <p className="text-red-700 text-[11px]">
                          {locale === "en"
                            ? "This action will retract your pitch from the parent."
                            : "Le parent ne verra plus votre proposition parmi les candidats actifs."}
                        </p>
                        {withdrawError && <p className="text-red-600 font-bold">{withdrawError}</p>}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            {isWithdrawing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            <span>{locale === "en" ? "Confirm Withdrawal" : "Confirmer le retrait"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowWithdrawConfirm(false)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            {locale === "en" ? "Cancel" : "Annuler"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowWithdrawConfirm(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{locale === "en" ? "Withdraw Application" : "Retirer ma candidature"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : opportunity.isTeacherApproved ? (
              // Teacher can apply
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {locale === "en" ? "Apply for this Request" : "Postuler à cette demande"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === "en"
                      ? "Submit your pedagogical pitch and proposed rate directly to the family."
                      : "Transmettez votre note de motivation et vos disponibilités à la famille."}
                  </p>
                </div>

                <TeacherApplicationForm
                  requestId={opportunity.id}
                  requestSubject={opportunity.subjectName}
                  defaultBudgetGnf={opportunity.budgetGnf}
                  budgetType={opportunity.budgetType}
                  teacherSuggestedRate={
                    opportunity.budgetType === "HOURLY"
                      ? opportunity.teacherProfileSnapshot?.hourlyRateGnf
                      : opportunity.teacherProfileSnapshot?.monthlyPackageRateGnf
                  }
                  onSuccess={() => {
                    setApplication({
                      id: "new",
                      status: "SUBMITTED",
                      proposedRateGnf: opportunity.budgetGnf,
                      proposedRateType: opportunity.budgetType,
                      pitchMessage: "Candidature enregistrée",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    router.refresh();
                  }}
                />
              </div>
            ) : (
              // Teacher not approved
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>{locale === "en" ? "Account Approval Required" : "Validation Requise"}</span>
                </div>
                <p className="leading-relaxed">
                  {locale === "en"
                    ? "Your teacher dossier must be approved by the Monsieur Fanyi administration before you can submit applications."
                    : "Votre profil enseignant doit être vérifié et validé par l'équipe Monsieur Fanyi avant de pouvoir transmettre des candidatures aux familles."}
                </p>
                <Link
                  href="/teacher/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16385c] hover:underline pt-1"
                >
                  <span>{locale === "en" ? "Check verification status" : "Consulter mon statut de validation"}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

