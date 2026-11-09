"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Phone,
  Mail,
  User,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { RequestStatus, TutoringMode } from "@prisma/client";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export interface AdminRequestData {
  id: string;
  subjectName: string;
  customSubject?: string | null;
  gradeLevelName: string;
  cycle?: string | null;
  customCycle?: string | null;
  mode: TutoringMode;
  frequency?: string | null;
  preferredSchedule?: string | null;
  sessionDurationMinutes?: number;
  budgetGnf: number;
  budgetType?: string | null;
  city: string;
  commune?: string | null;
  neighborhood?: string | null;
  learningGoals?: string | null;
  status: RequestStatus;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  parent: {
    id: string;
    city?: string | null;
    user: {
      id: string;
      fullName: string;
      email: string;
      phoneNumber?: string | null;
    };
  };
  student: {
    id: string;
    fullName: string;
    gradeLevel?: string | null;
    cycle?: string | null;
    schoolName?: string | null;
  };
  applicationsCount: number;
}

interface AdminRequestsClientProps {
  initialRequests: AdminRequestData[];
  counts: {
    total: number;
    open: number;
    draft: number;
    matched: number;
    closed: number;
    cancelled: number;
    totalBudgetGnf: number;
  };
}

export function AdminRequestsClient({
  initialRequests,
  counts,
}: AdminRequestsClientProps) {
  const { locale } = useTranslation();

  const [requests] = useState<AdminRequestData[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCycle, setSelectedCycle] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [inspectingRequest, setInspectingRequest] = useState<AdminRequestData | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    // 1. Status filter
    if (selectedStatus !== "ALL" && req.status !== selectedStatus) {
      return false;
    }

    // 2. Cycle filter
    if (selectedCycle !== "ALL") {
      if ((req.cycle || "").toUpperCase() !== selectedCycle) return false;
    }

    // 3. Search filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchSubject = req.subjectName.toLowerCase().includes(q);
      const matchCustomSubject = req.customSubject?.toLowerCase().includes(q);
      const matchStudent = req.student.fullName.toLowerCase().includes(q);
      const matchParent = req.parent.user.fullName.toLowerCase().includes(q);
      const matchEmail = req.parent.user.email.toLowerCase().includes(q);
      const matchCommune = req.commune?.toLowerCase().includes(q);
      const matchCity = req.city.toLowerCase().includes(q);

      if (
        !matchSubject &&
        !matchCustomSubject &&
        !matchStudent &&
        !matchParent &&
        !matchEmail &&
        !matchCommune &&
        !matchCity
      ) {
        return false;
      }
    }

    return true;
  });

  const formattedTotalBudget =
    new Intl.NumberFormat("fr-GN").format(counts.totalBudgetGnf) + " GNF";

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {locale === "en" ? "Admin Console" : "Console d'Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Tutoring Requests" : "Demandes de Soutien"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en" ? "Marketplace Tutoring Requests" : "Demandes de Soutien Scolaire"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Supervise all parent tutoring requests, marketplace discovery states, and teacher applications across Guinea."
              : "Supervisez l'ensemble des demandes de cours créées par les parents, leur statut de publication et les candidatures en Guinée."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>

      {/* 4 Real Metric Cards for Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Requests */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Total Requests" : "Total Demandes"}
            </span>
            <div className="text-xl font-black text-slate-800">
              {counts.total}
            </div>
          </div>
        </div>

        {/* Card 2: Open on Marketplace */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Open on Marketplace" : "Ouvertes (Marché)"}
            </span>
            <div className="text-xl font-black text-emerald-700">
              {counts.open}
            </div>
          </div>
        </div>

        {/* Card 3: Matched / Assigned */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Matched / In Class" : "Assignées"}
            </span>
            <div className="text-xl font-black text-indigo-700">
              {counts.matched}
            </div>
          </div>
        </div>

        {/* Card 4: Cumulative Budget */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Cumulative Budget" : "Volume Budgétaire"}
            </span>
            <div className="text-base font-black text-slate-800 line-clamp-1">
              {formattedTotalBudget}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === "en"
                  ? "Search by student, parent, subject, commune, or city..."
                  : "Rechercher par élève, parent, matière, commune ou ville..."
              }
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 focus:border-[#16385c] transition-all"
            />
          </div>

          {/* Educational Cycle Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400">
              {locale === "en" ? "Cycle:" : "Cycle :"}
            </span>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 cursor-pointer"
            >
              <option value="ALL">{locale === "en" ? "All Cycles" : "Tous les cycles"}</option>
              <option value="PRIMAIRE">Primaire</option>
              <option value="COLLEGE">Collège</option>
              <option value="LYCEE">Lycée</option>
              <option value="SUPERIEUR">Supérieur & Concours</option>
              <option value="AUTRE">Autre (Sur-mesure)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
          {[
            { id: "ALL", label: locale === "en" ? "All Requests" : "Toutes", count: counts.total },
            { id: "OPEN", label: locale === "en" ? "Open" : "Ouvertes", count: counts.open },
            { id: "DRAFT", label: locale === "en" ? "Drafts" : "Brouillons", count: counts.draft },
            { id: "MATCHED", label: locale === "en" ? "Matched" : "Assignées", count: counts.matched },
            { id: "CLOSED", label: locale === "en" ? "Closed" : "Clôturées", count: counts.closed },
            { id: "CANCELLED", label: locale === "en" ? "Cancelled" : "Annulées", count: counts.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedStatus === tab.id
                  ? "bg-[#16385c] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedStatus === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table / Cards Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table / Grid Toolbar */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">
              {locale === "en" ? "Tutoring Requests List" : "Liste des Demandes"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[11px] font-extrabold">
              {filteredRequests.length}
            </span>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-200/60 border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-[#16385c] shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{locale === "en" ? "Table" : "Tableau"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-[#16385c] shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{locale === "en" ? "Grid" : "Grille"}</span>
            </button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <p className="font-bold text-sm text-slate-800">
                {locale === "en" ? "No requests found" : "Aucune demande trouvée"}
              </p>
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? "No tutoring requests match the current search or status filter."
                  : "Aucune demande ne correspond à vos critères de recherche actuels."}
              </p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 sm:px-4">{locale === "en" ? "Student" : "Élève"}</th>
                  <th className="py-3 px-3 sm:px-4">{locale === "en" ? "Subject" : "Matière"}</th>
                  <th className="py-3 px-3 sm:px-4">{locale === "en" ? "Parent" : "Parent"}</th>
                  <th className="py-3 px-3 sm:px-4">{locale === "en" ? "Format & Location" : "Format & Zone"}</th>
                  <th className="py-3 px-3 sm:px-4">{locale === "en" ? "Budget" : "Budget"}</th>
                  <th className="py-3 px-2 sm:px-3 text-center">{locale === "en" ? "Apps" : "Candidats"}</th>
                  <th className="py-3 px-3 sm:px-4">{locale === "en" ? "Status" : "Statut"}</th>
                  <th className="py-3 px-3 sm:px-4 text-right w-12">{locale === "en" ? "Action" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredRequests.map((req) => {
                  const budgetFormatted =
                    new Intl.NumberFormat("fr-GN").format(req.budgetGnf) + " GNF";
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* Élève */}
                      <td className="py-3 px-3 sm:px-4 max-w-[130px]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-100/80 text-[#16385c] font-black text-xs flex items-center justify-center shrink-0">
                            {req.student.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-slate-900 text-xs block truncate" title={req.student.fullName}>
                              {req.student.fullName}
                            </span>
                            <span className="inline-block text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded mt-0.5 truncate max-w-[90px]">
                              {req.gradeLevelName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Matière */}
                      <td className="py-3 px-3 sm:px-4 max-w-[130px]">
                        <div className="min-w-0">
                          <span className="font-bold text-[#16385c] text-xs block truncate" title={req.customSubject ? `${req.customSubject} (${req.subjectName})` : req.subjectName}>
                            {req.customSubject ? `${req.customSubject} (${req.subjectName})` : req.subjectName}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                            {req.frequency || "2 séances / sem"}
                          </span>
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="py-3 px-3 sm:px-4 max-w-[125px]">
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 text-xs block truncate" title={req.parent.user.fullName}>
                            {req.parent.user.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5" title={req.parent.user.phoneNumber || req.parent.user.email}>
                            {req.parent.user.phoneNumber || req.parent.user.email}
                          </span>
                        </div>
                      </td>

                      {/* Format & Localisation */}
                      <td className="py-3 px-3 sm:px-4 max-w-[120px]">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 whitespace-nowrap">
                            {req.mode === "HOME" ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{locale === "en" ? "In-Home" : "À domicile"}</span>
                              </>
                            ) : req.mode === "ONLINE" ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                <span>{locale === "en" ? "Online" : "En ligne"}</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                                <span>{locale === "en" ? "Hybrid" : "Hybride"}</span>
                              </>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate" title={req.commune || req.city}>
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{req.commune || req.city}</span>
                          </div>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <div className="font-extrabold text-[#16385c] text-xs">
                          {budgetFormatted}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">
                          {req.budgetType === "HOURLY"
                            ? (locale === "en" ? "/ hr" : "/ heure")
                            : (locale === "en" ? "/ mo" : "/ mois")}
                        </div>
                      </td>

                      {/* Candidatures */}
                      <td className="py-3 px-2 sm:px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{req.applicationsCount}</span>
                        </span>
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                        <RequestStatusBadge status={req.status} short={true} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 sm:px-4 text-right w-12 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setInspectingRequest(req)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title={locale === "en" ? "Inspect Request" : "Inspecter la demande"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View Mode */
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredRequests.map((req) => {
              const budgetFormatted =
                new Intl.NumberFormat("fr-GN").format(req.budgetGnf) + " GNF";
              return (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <RequestStatusBadge status={req.status} short={true} />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-[#16385c] line-clamp-1">
                        {req.customSubject ? `${req.customSubject} (${req.subjectName})` : req.subjectName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                        <span className="font-bold text-slate-800">{req.student.fullName}</span>
                        <span>•</span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                          {req.gradeLevelName}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          {locale === "en" ? "Location" : "Localisation"}
                        </span>
                        <span className="font-bold text-slate-800 truncate block mt-0.5">
                          {req.commune || req.city}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                        <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                          {locale === "en" ? "Format" : "Format"}
                        </span>
                        <span className="font-bold text-slate-800 truncate block mt-0.5">
                          {req.mode === "HOME" ? "À domicile" : req.mode === "ONLINE" ? "En ligne" : "Hybride"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-black text-sm text-[#16385c] block">
                        {budgetFormatted}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {req.budgetType === "HOURLY" ? "/ heure" : "/ mois"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectingRequest(req)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{locale === "en" ? "Details" : "Détails"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspection Modal for Admin */}
      {inspectingRequest && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <RequestStatusBadge status={inspectingRequest.status} />
                  <span className="text-[11px] text-slate-400">
                    ID : {inspectingRequest.id}
                  </span>
                </div>
                <h3 className="font-extrabold text-lg text-[#16385c]">
                  {inspectingRequest.customSubject
                    ? `${inspectingRequest.customSubject} (${inspectingRequest.subjectName})`
                    : inspectingRequest.subjectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
              {/* Student and Parent Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Élève concerné
                  </span>
                  <div className="font-bold text-sm text-[#16385c]">
                    {inspectingRequest.student.fullName}
                  </div>
                  <div className="text-slate-600">
                    {inspectingRequest.student.gradeLevel || inspectingRequest.gradeLevelName}
                  </div>
                  {inspectingRequest.student.schoolName && (
                    <div className="text-slate-500">
                      École : {inspectingRequest.student.schoolName}
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Parent titulaire
                  </span>
                  <div className="font-bold text-sm text-[#16385c]">
                    {inspectingRequest.parent.user.fullName}
                  </div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inspectingRequest.parent.user.email}</span>
                  </div>
                  {inspectingRequest.parent.user.phoneNumber && (
                    <div className="text-slate-600 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{inspectingRequest.parent.user.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tutoring Specs */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Paramètres Pédagogiques & Financiers
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Format</span>
                    <span className="font-semibold text-slate-800">
                      {inspectingRequest.mode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Budget</span>
                    <span className="font-bold text-slate-900">
                      {new Intl.NumberFormat("fr-GN").format(inspectingRequest.budgetGnf)} GNF
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Fréquence</span>
                    <span className="font-semibold text-slate-800">
                      {inspectingRequest.frequency || "2 séances / sem"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Localisation</span>
                    <span className="font-semibold text-slate-800">
                      {inspectingRequest.commune || inspectingRequest.city}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Créé le</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(inspectingRequest.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Candidatures</span>
                    <span className="font-bold text-indigo-600">
                      {inspectingRequest.applicationsCount} reçue(s)
                    </span>
                  </div>
                </div>

                {inspectingRequest.learningGoals && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-400 block text-[10px] mb-0.5">
                      Objectifs d'apprentissage
                    </span>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {inspectingRequest.learningGoals}
                    </p>
                  </div>
                )}

                {inspectingRequest.cancellationReason && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                    <span className="font-bold block text-[11px]">Motif d'annulation :</span>
                    <p className="italic text-xs mt-0.5">{inspectingRequest.cancellationReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                {locale === "en" ? "Close" : "Fermer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

