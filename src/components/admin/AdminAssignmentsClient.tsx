"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  ExternalLink,
  Eye,
  GraduationCap,
  Home,
  Laptop,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ClassroomStatus, TutoringMode } from "@prisma/client";
import { AdminAssignmentWizard } from "./AdminAssignmentWizard";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export interface ClassroomItem {
  id: string;
  requestId?: string | null;
  subjectName: string;
  mode: TutoringMode;
  hourlyRateGnf?: number | null;
  monthlyRateGnf?: number | null;
  isAssistedAssignment: boolean;
  assignmentSource?: string | null;
  adminNotes?: string | null;
  status: ClassroomStatus;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    gradeLevel?: string | null;
    cycle?: string | null;
    parent: {
      id: string;
      fullName: string;
      email: string;
      phoneNumber?: string | null;
    };
  };
  teacher: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
  };
  assignedByAdmin?: {
    id: string;
    fullName: string;
  } | null;
  sessionsCount?: number;
}

interface AdminAssignmentsClientProps {
  initialClassrooms: ClassroomItem[];
  stats: {
    total: number;
    assisted: number;
    marketplace: number;
    pendingPayment: number;
    active: number;
  };
}

export function AdminAssignmentsClient({
  initialClassrooms,
  stats: initialStats,
}: AdminAssignmentsClientProps) {
  const { t, locale } = useTranslation();

  const [classrooms, setClassrooms] = useState<ClassroomItem[]>(initialClassrooms);
  const [stats, setStats] = useState(initialStats);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomItem | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ASSISTED" | "MARKETPLACE">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (message: string, type: "success" | "error" = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleWizardSuccess = (newClassroom: any) => {
    setShowWizard(false);
    showFeedback(
      locale === "en"
        ? "Direct assisted assignment created successfully! The class is pending initial payment."
        : "Affectation directe créée avec succès ! La classe est en attente de paiement initial.",
      "success"
    );

    // Refresh list via client fetch
    fetchClassrooms();
  };

  const fetchClassrooms = async () => {
    try {
      const res = await fetch("/api/admin/assignments");
      const data = await res.json();
      if (data.classrooms) {
        setClassrooms(data.classrooms);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch {
      // silent
    }
  };

  // Filtered List
  const filteredClassrooms = classrooms.filter((c) => {
    if (typeFilter === "ASSISTED" && !c.isAssistedAssignment) return false;
    if (typeFilter === "MARKETPLACE" && c.isAssistedAssignment) return false;
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSub = c.subjectName.toLowerCase().includes(q);
      const matchStud = c.student.fullName.toLowerCase().includes(q);
      const matchParent = c.student.parent.fullName.toLowerCase().includes(q);
      const matchTeach = c.teacher.fullName.toLowerCase().includes(q);
      return matchSub || matchStud || matchParent || matchTeach;
    }
    return true;
  });

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Top Banner / Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {locale === "en" ? "Admin Console" : "Console d'Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Classes & Direct Assignments" : "Attributions & Classes"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            {t("adminAssignments.title", "Attributions & Classes de Soutien")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "adminAssignments.subtitle",
              "Supervision des sélections parentales (Marketplace) et des affectations directes (Assistance téléphonique)."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Calendar className="w-4 h-4 text-slate-600" />
            <span>{locale === "en" ? "Schedule" : "Calendrier"}</span>
          </Link>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#e59a38]" />
            <span>{t("adminAssignments.newDirectBtn", "Nouvelle attribution directe")}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t("adminAssignments.totalClasses", "Total Classes")}
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {t("adminAssignments.totalClassesDesc", "Toutes modalités")}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="truncate">{t("adminAssignments.assistedClasses", "Affectations directes")}</span>
          </span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">{stats.assisted}</span>
          <span className="text-[11px] text-blue-600/80 mt-1 block">
            {t("adminAssignments.assistedClassesDesc", "Accueil & Téléphone")}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {t("adminAssignments.marketplaceClasses", "Sélection Parent")}
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.marketplace}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {t("adminAssignments.marketplaceClassesDesc", "Marketplace standard")}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">{t("adminAssignments.pendingPayment", "Attente Paiement")}</span>
          </span>
          <span className="text-2xl font-bold text-amber-800 mt-1 block">{stats.pendingPayment}</span>
          <span className="text-[11px] text-amber-600 mt-1 block">
            {t("adminAssignments.pendingPaymentDesc", "Prépaiement requis")}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">{t("adminAssignments.activeClasses", "Classes Actives")}</span>
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{stats.active}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            {t("adminAssignments.activeClassesDesc", "Séances autorisées")}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search query */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3 top-2.5 sm:top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("adminAssignments.searchPlaceholder", "Rechercher par élève, parent, tuteur ou matière...")}
              className="w-full pl-9 pr-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden transition-all"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === "ALL" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              {t("adminAssignments.allFilter", "Toutes")} ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("ASSISTED")}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === "ASSISTED" ? "bg-white text-blue-900 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              {t("adminAssignments.assistedFilter", "Directes / Assistées")} ({stats.assisted})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter("MARKETPLACE")}
              className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                typeFilter === "MARKETPLACE" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-600"
              }`}
            >
              {t("adminAssignments.marketplaceFilter", "Marketplace")} ({stats.marketplace})
            </button>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1 whitespace-nowrap">
            {t("adminAssignments.statusLabel", "Statut :")}
          </span>
          {[
            { value: "ALL", label: t("adminAssignments.allStatuses", "Tous les statuts") },
            { value: "PENDING_PAYMENT", label: t("adminAssignments.pendingPaymentStatus", "En attente de paiement") },
            { value: "ACTIVE", label: t("adminAssignments.activeStatus", "Actives") },
            { value: "COMPLETED", label: t("adminAssignments.completedStatus", "Terminées") },
            { value: "CANCELLED", label: t("adminAssignments.cancelledStatus", "Annulées") },
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

      {/* Classrooms Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredClassrooms.length === 0 ? (
          <div className="py-12 text-center space-y-2 p-4">
            <GraduationCap className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              {t("adminAssignments.emptyTitle", "Aucune classe ne correspond à vos filtres")}
            </p>
            <p className="text-xs text-slate-400">
              {t(
                "adminAssignments.emptyDesc",
                "Modifiez vos critères de recherche ou cliquez sur « Nouvelle attribution directe »."
              )}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 sm:px-4">{t("adminAssignments.colSubjectMode", "Classe & Matière")}</th>
                  <th className="py-3 px-3 sm:px-4">{t("adminAssignments.colFamilyStudent", "Famille & Élève")}</th>
                  <th className="py-3 px-3 sm:px-4">{t("adminAssignments.colAssignedTutor", "Professeur Attribué")}</th>
                  <th className="py-3 px-3 sm:px-4">{t("adminAssignments.colAgreedRate", "Tarif Convenu")}</th>
                  <th className="py-3 px-3 sm:px-4">{t("adminAssignments.colOrigin", "Origine / Attribution")}</th>
                  <th className="py-3 px-3 sm:px-4">{t("adminAssignments.colStatus", "Statut")}</th>
                  <th className="py-3 px-3 sm:px-4 text-right w-12">{t("adminAssignments.colActions", "Actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClassrooms.map((c) => {
                  const isAssisted = c.isAssistedAssignment;
                  const isPendingPayment = c.status === "PENDING_PAYMENT";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Subject & Mode */}
                      <td className="py-3 px-3 sm:px-4 max-w-[130px]">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                          <BookOpen className="w-3.5 h-3.5 text-[#16385c] shrink-0" />
                          <span className="truncate block" title={c.subjectName}>{c.subjectName}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 whitespace-nowrap">
                          {c.mode === "HOME" ? (
                            <>
                              <Home className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{t("classes.modeHome", "À domicile")}</span>
                            </>
                          ) : c.mode === "ONLINE" ? (
                            <>
                              <Laptop className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>{t("classes.modeOnline", "En ligne")}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-purple-600 shrink-0" />
                              <span>{t("classes.modeHybrid", "Hybride")}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Family & Student */}
                      <td className="py-3 px-3 sm:px-4 max-w-[130px]">
                        <span className="font-bold text-slate-800 block text-xs truncate" title={c.student.fullName}>
                          {c.student.fullName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate" title={c.student.parent.fullName}>
                          {c.student.parent.fullName}
                        </span>
                      </td>

                      {/* Teacher */}
                      <td className="py-3 px-3 sm:px-4 max-w-[130px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#16385c]/10 text-[#16385c] font-bold text-xs flex items-center justify-center shrink-0">
                            {c.teacher.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-slate-800 block text-xs truncate" title={c.teacher.fullName}>
                              {c.teacher.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate" title={c.teacher.phoneNumber || c.teacher.email}>
                              {c.teacher.phoneNumber || c.teacher.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {c.monthlyRateGnf ? (
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {formatGnf(c.monthlyRateGnf)}
                            </span>
                            <span className="text-[10px] text-slate-400">{t("classes.perMonth", "/mois")}</span>
                          </div>
                        ) : c.hourlyRateGnf ? (
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {formatGnf(c.hourlyRateGnf)}
                            </span>
                            <span className="text-[10px] text-slate-400">{t("classes.perHour", "/h")}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non défini</span>
                        )}
                      </td>

                      {/* Type & Origin */}
                      <td className="py-3 px-3 sm:px-4 max-w-[110px]">
                        {isAssisted ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                              <Sparkles className="w-2.5 h-2.5 shrink-0" />
                              <span>{t("adminAssignments.assistedFilter", "Assistée")}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate" title={c.assignedByAdmin?.fullName ? `${c.assignmentSource} • ${c.assignedByAdmin.fullName}` : c.assignmentSource || ""}>
                              {c.assignmentSource === "PHONE_INQUIRY"
                                ? t("adminAssignments.originPhone", "Téléphone")
                                : c.assignmentSource === "DIRECT_OFFICE"
                                ? t("adminAssignments.originOffice", "Bureau")
                                : t("adminAssignments.originModeration", "Modération")}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 whitespace-nowrap">
                            <span>{t("adminAssignments.marketplaceFilter", "Marketplace")}</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        {isPendingPayment ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                            title={t("adminAssignments.pendingPaymentStatus", "En attente de paiement")}
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span>{locale === "en" ? "Pending" : "En attente"}</span>
                          </span>
                        ) : c.status === "ACTIVE" ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                            title={t("adminAssignments.activeStatus", "Active")}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            <span>{locale === "en" ? "Active" : "Active"}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {c.status}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/calendar?classroomId=${c.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors inline-block"
                            title={locale === "en" ? "View calendar" : "Voir le calendrier"}
                          >
                            <Calendar className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setSelectedClassroom(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title={t("adminAssignments.viewDetailsBtn", "Inspecter")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Classroom Detail Modal */}
      {selectedClassroom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedClassroom(null)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">
                {locale === "en" ? "Class Details" : "Détails de la Classe"} : {selectedClassroom.subjectName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedClassroom(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{t("classes.studentLabel", "Élève")} :</span>
                <span className="font-semibold text-slate-800">
                  {selectedClassroom.student.fullName} ({selectedClassroom.student.gradeLevel || "N/A"})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{locale === "en" ? "Parent" : "Parent"} :</span>
                <span className="font-semibold text-slate-800">
                  {selectedClassroom.student.parent.fullName} ({selectedClassroom.student.parent.phoneNumber || selectedClassroom.student.parent.email})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{t("classes.tutorLabel", "Professeur")} :</span>
                <span className="font-semibold text-emerald-800">
                  {selectedClassroom.teacher.fullName} ({selectedClassroom.teacher.phoneNumber || selectedClassroom.teacher.email})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{locale === "en" ? "Format" : "Format"} :</span>
                <span className="font-semibold text-slate-800">{selectedClassroom.mode}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{t("classes.agreedRate", "Tarif convenu")} :</span>
                <span className="font-bold text-slate-800">
                  {selectedClassroom.monthlyRateGnf
                    ? `${formatGnf(selectedClassroom.monthlyRateGnf)} ${t("classes.perMonth", "/mois")}`
                    : selectedClassroom.hourlyRateGnf
                    ? `${formatGnf(selectedClassroom.hourlyRateGnf)} ${t("classes.perHour", "/h")}`
                    : "Non défini"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{t("adminAssignments.colStatus", "Statut actuel")} :</span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  {selectedClassroom.status === "PENDING_PAYMENT"
                    ? t("adminAssignments.pendingPaymentStatus", "En attente de paiement")
                    : selectedClassroom.status === "ACTIVE"
                    ? t("adminAssignments.activeStatus", "Active")
                    : selectedClassroom.status}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-400">{t("adminAssignments.colOrigin", "Type d'affectation")} :</span>
                <span className="font-semibold text-slate-800">
                  {selectedClassroom.isAssistedAssignment
                    ? `${t("adminAssignments.assistedFilter", "Assistée")} (${selectedClassroom.assignmentSource || "Téléphone"})`
                    : t("adminAssignments.marketplaceClassesDesc", "Sélection parentale marketplace")}
                </span>
              </div>
              {selectedClassroom.adminNotes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block mb-1">
                    {locale === "en" ? "Administrative notes:" : "Notes administratives :"}
                  </span>
                  <p className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 italic text-slate-700">
                    {selectedClassroom.adminNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Link
                href={`/admin/calendar?classroomId=${selectedClassroom.id}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] text-white hover:bg-[#1f4a7a] transition-colors inline-flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#e59a38]" />
                <span>{locale === "en" ? "View Sessions" : "Voir les séances"}</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedClassroom(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                {t("classes.closeBtn", "Fermer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Assignment Wizard Modal */}
      {showWizard && (
        <AdminAssignmentWizard
          onSuccess={handleWizardSuccess}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
