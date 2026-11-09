"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  GraduationCap,
  Home,
  Laptop,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ClassroomStatus, TutoringMode } from "@prisma/client";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  ClassroomPackageModal,
  PackageModalData,
} from "@/components/classroom/ClassroomPackageModal";

export interface TeacherClassroomData {
  id: string;
  subjectName: string;
  mode: TutoringMode;
  status: ClassroomStatus;
  hourlyRateGnf?: number | null;
  monthlyRateGnf?: number | null;
  isAssistedAssignment: boolean;
  assignmentSource?: string | null;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    gradeLevel?: string | null;
    cycle?: string | null;
    schoolName?: string | null;
    supportNeeds?: string | null;
  };
  location?: {
    commune?: string | null;
    neighborhood?: string | null;
    preferredSchedule?: string | null;
  };
  sessionsCount: number;
  packageDetails?: {
    totalAmountGnf: number;
    sessionsCount: number;
    minutesPerSession: number;
    totalPlannedMinutes: number;
    pricingType: string;
    commissionRatePercent: number;
    totalPlatformCommissionGnf: number;
    totalTeacherShareGnf: number;
    allocations?: Array<{
      sessionIndex: number;
      allocatedAmountGnf: number;
      platformCommissionGnf: number;
      teacherNetGnf: number;
    }>;
  } | null;
}

interface TeacherClassesClientProps {
  classrooms: TeacherClassroomData[];
}

export function TeacherClassesClient({ classrooms }: TeacherClassesClientProps) {
  const { t, locale } = useTranslation();
  const [selectedPackageData, setSelectedPackageData] = useState<PackageModalData | null>(null);

  // Filters state
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MARKETPLACE" | "ASSISTED">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Counts
  const totalCount = classrooms.length;
  const assistedCount = useMemo(
    () => classrooms.filter((c) => c.isAssistedAssignment).length,
    [classrooms]
  );
  const marketplaceCount = useMemo(
    () => classrooms.filter((c) => !c.isAssistedAssignment).length,
    [classrooms]
  );

  // Filtered Classrooms
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter((c) => {
      // Type Filter
      if (typeFilter === "ASSISTED" && !c.isAssistedAssignment) return false;
      if (typeFilter === "MARKETPLACE" && c.isAssistedAssignment) return false;

      // Status Filter
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSub = c.subjectName.toLowerCase().includes(q);
        const matchStudent = c.student.fullName.toLowerCase().includes(q);
        const matchSchool = c.student.schoolName?.toLowerCase().includes(q) || false;
        const matchCommune = c.location?.commune?.toLowerCase().includes(q) || false;
        return matchSub || matchStudent || matchSchool || matchCommune;
      }

      return true;
    });
  }, [classrooms, typeFilter, statusFilter, searchQuery]);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {locale === "en" ? "Teacher Space" : "Espace Enseignant"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "My Tutoring Classes" : "Mes Classes de Soutien"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
              {t("classes.teacherTitle", "Mes Classes de Soutien")}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
              {totalCount} {t("classes.classesCount", "classe(s)")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("classes.teacherSubtitle", "Élèves officiellement attribués suite à une sélection parentale ou une affectation directe.")}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Link
            href="/teacher/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{t("classes.scheduleBtn", "Emploi du temps")}</span>
          </Link>
          <Link
            href="/teacher/pricing"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            <span>{t("classes.pricingEngineBtn", "Moteur Tarifaire & Forfaits")}</span>
          </Link>
          <Link
            href="/teacher/opportunities"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
            <span>{t("classes.openOpportunitiesBtn", "Opportunités ouvertes")}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Filter Bar with Tabs for Marketplace vs Admin Direct Assignments */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === "ALL"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {t("classes.allClassesTab", "Toutes les classes")} ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("MARKETPLACE")}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === "MARKETPLACE"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {t("classes.marketplaceTab", "Demandes de cours")} ({marketplaceCount})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("ASSISTED")}
              className={`flex-1 md:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
                typeFilter === "ASSISTED"
                  ? "bg-white text-[#16385c] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t("classes.adminAssistedTab", "Attributions directes")}</span>
              <span>({assistedCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("classes.searchPlaceholder", "Rechercher par matière, élève, commune...")}
              className="w-full pl-9 pr-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1 whitespace-nowrap">
            {t("classes.statusAll", "Statut :")}
          </span>
          {[
            { value: "ALL", label: t("classes.statusAll", "Tous les statuts") },
            { value: "PENDING_PAYMENT", label: t("classes.statusPendingPayment", "En attente de paiement") },
            { value: "ACTIVE", label: t("classes.statusActive", "Classe Active") },
          ].map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st.value
                  ? "bg-[#16385c] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Classes list */}
      {filteredClassrooms.length === 0 ? (
        <div className="p-10 sm:p-14 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">
              {classrooms.length === 0
                ? t("classes.emptyTeacherTitle", "Aucune classe active ou en attente")
                : t("classes.emptyFilterTitle", "Aucune classe ne correspond à vos filtres")}
            </h3>
            <p className="text-xs text-slate-500">
              {classrooms.length === 0
                ? t("classes.emptyTeacherDesc", "Vous n'avez pas encore été sélectionné(e) pour encadrer un élève. Postulez aux opportunités ouvertes sur le marketplace pour démarrer.")
                : t("classes.emptyFilterDesc", "Modifiez vos critères de recherche ou réinitialisez les filtres sélectionnés.")}
            </p>
          </div>
          {classrooms.length === 0 ? (
            <Link
              href="/teacher/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#204e7d] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t("classes.openOpportunitiesBtn", "Opportunités ouvertes")}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setStatusFilter("ALL");
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#16385c] bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredClassrooms.map((c) => {
            const isPendingPayment = c.status === ClassroomStatus.PENDING_PAYMENT;
            const isAssisted = c.isAssistedAssignment;
            const pkg = c.packageDetails;

            return (
              <div
                key={c.id}
                className={`p-5 sm:p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                  isPendingPayment
                    ? "bg-white border-amber-200 shadow-xs ring-1 ring-amber-500/10"
                    : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                <div className="space-y-4">
                  {/* Origin Banner */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                    {isAssisted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>{t("classes.badgeAdminAssisted", "Attribution directe Monsieur Fanyi")}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{t("classes.badgeMarketplace", "Candidature retenue")}</span>
                      </span>
                    )}

                    <div>
                      {isPendingPayment ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{t("classes.statusPendingPayment", "En attente de paiement")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t("classes.statusActive", "Classe Active")}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Top: Subject & Mode */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                          {c.subjectName}
                        </h3>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          {c.mode === "HOME" ? (
                            <>
                              <Home className="w-3 h-3 text-emerald-600" />
                              <span>{t("classes.modeHome", "À domicile")}</span>
                            </>
                          ) : c.mode === "ONLINE" ? (
                            <>
                              <Laptop className="w-3 h-3 text-blue-600" />
                              <span>{t("classes.modeOnline", "En ligne")}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              <span>{t("classes.modeHybrid", "Hybride")}</span>
                            </>
                          )}
                          {c.location?.commune && ` • ${c.location.commune}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Student details */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-semibold uppercase text-[10px]">
                          {t("classes.studentLabel", "Élève encadré")}
                        </span>
                      </div>
                      <span className="font-bold text-slate-800 text-sm block">
                        {c.student.fullName}
                      </span>
                      <span className="text-slate-600 block text-xs">
                        Niveau : {c.student.gradeLevel || "Non précisé"} {c.student.cycle ? `(${c.student.cycle})` : ""}
                      </span>
                      {c.student.schoolName && (
                        <span className="text-slate-500 text-[11px] block truncate">
                          Établissement : {c.student.schoolName}
                        </span>
                      )}
                    </div>

                    {/* Pricing Terms & Net share */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                          {t("classes.agreedRate", "Tarif Convenu")}
                        </span>
                        <span className="font-bold text-slate-800 block mt-0.5 truncate">
                          {pkg
                            ? `${formatGnf(pkg.totalAmountGnf)} (${pkg.sessionsCount} ${t("classes.sessionsUnit", "séan.")})`
                            : c.monthlyRateGnf
                            ? `${formatGnf(c.monthlyRateGnf)} ${t("classes.perMonth", "/mois")}`
                            : c.hourlyRateGnf
                            ? `${formatGnf(c.hourlyRateGnf)} ${t("classes.perHour", "/h")}`
                            : t("classes.standardRate", "Tarif standard")}
                        </span>
                      </div>

                      <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase block">
                          {t("classes.tutorNetShare", "Part Nette Enseignant (85%)")}
                        </span>
                        <span className="font-bold text-emerald-800 block mt-0.5 truncate">
                          {pkg
                            ? formatGnf(pkg.totalTeacherShareGnf)
                            : c.monthlyRateGnf
                            ? formatGnf(Math.round((c.monthlyRateGnf * 85) / 100))
                            : c.hourlyRateGnf
                            ? `${formatGnf(Math.round((c.hourlyRateGnf * 85) / 100))} /h`
                            : "Projection 85%"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prepayment Notice */}
                  {isPendingPayment && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {t(
                          "classes.prepaymentNoticeTeacherDesc",
                          "Cette classe est en attente du règlement initial de la famille. Les cours ne doivent débuter qu'après confirmation du versement par l'administration."
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer with Actions */}
                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {c.sessionsCount} {t("classes.sessionsUnit", "séance(s)")}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/teacher/calendar?classroomId=${c.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#16385c] bg-slate-100 hover:bg-slate-200 transition-colors"
                      title={t("classes.viewCalendar", "Séances & Emploi du temps")}
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#16385c]" />
                      <span className="hidden sm:inline">{t("classes.scheduleBtn", "Emploi du temps")}</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPackageData({
                          classroomId: c.id,
                          subjectName: c.subjectName,
                          studentName: c.student.fullName,
                          teacherName: "Vous-même",
                          mode: c.mode,
                          status: c.status,
                          packageDetails: pkg,
                          viewerRole: "TEACHER",
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#16385c] bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t("classes.viewPackageDetails", "Détails du forfait")}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Package Breakdown Modal */}
      {selectedPackageData && (
        <ClassroomPackageModal
          data={selectedPackageData}
          onClose={() => setSelectedPackageData(null)}
        />
      )}
    </div>
  );
}
