"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  ChevronRight,
  Eye,
  Loader2,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";

export interface TeacherApplicationListItem {
  id: string;
  requestId: string;
  pitchMessage?: string | null;
  proposedRateGnf?: number | null;
  proposedRateType?: string | null;
  sessionArrangement?: string | null;
  availabilityNotes?: string | null;
  status: "SUBMITTED" | "SHORTLISTED" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";
  rejectionReason?: string | null;
  withdrawnAt?: string | null;
  decisionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  request: {
    id: string;
    subjectName: string;
    customSubject?: string | null;
    cycle?: string | null;
    gradeLevelName: string;
    mode: string;
    frequency?: string | null;
    budgetGnf: number;
    budgetType: string;
    city: string;
    commune?: string | null;
    status: string;
    studentDisplay: string;
  };
}

export interface ApplicationCounts {
  all: number;
  submitted: number;
  shortlisted: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

interface TeacherApplicationsClientProps {
  initialApplications: TeacherApplicationListItem[];
  initialCounts: ApplicationCounts;
}

export function TeacherApplicationsClient({
  initialApplications,
  initialCounts,
}: TeacherApplicationsClientProps) {
  const { locale } = useTranslation();
  const router = useRouter();

  const [applications, setApplications] = useState<TeacherApplicationListItem[]>(initialApplications);
  const [counts, setCounts] = useState<ApplicationCounts>(initialCounts);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<TeacherApplicationListItem | null>(null);

  // Withdrawal state
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }
      if (searchQuery.trim()) {
        params.set("query", searchQuery.trim());
      }

      const res = await fetch(`/api/teacher/applications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId);
    setWithdrawError(null);

    try {
      const res = await fetch(`/api/teacher/applications/${applicationId}/withdraw`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors du retrait");
      }

      setWithdrawConfirmId(null);
      await fetchApplications();
      router.refresh();
    } catch (err: any) {
      setWithdrawError(err.message || "Erreur lors du retrait.");
    } finally {
      setWithdrawingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return {
          label: locale === "en" ? "Under Review" : "En attente d'examen",
          badgeColor: "bg-blue-50 text-[#16385c] border-blue-200",
        };
      case "SHORTLISTED":
        return {
          label: locale === "en" ? "Shortlisted" : "Présélectionnée",
          badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "ACCEPTED":
        return {
          label: locale === "en" ? "Accepted • Class Created" : "Retenue • Classe créée",
          badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "WITHDRAWN":
        return {
          label: locale === "en" ? "Withdrawn" : "Retirée",
          badgeColor: "bg-slate-100 text-slate-600 border-slate-200",
        };
      case "REJECTED":
        return {
          label: locale === "en" ? "Declined" : "Déclinée",
          badgeColor: "bg-red-50 text-red-700 border-red-200",
        };
      default:
        return {
          label: status,
          badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
        };
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {locale === "en" ? "My Applications" : "Mes Candidatures"}
          </h1>
          <p className="text-xs text-slate-500">
            {locale === "en"
              ? "Track your submitted tutoring proposals, parent shortlists, and application statuses."
              : "Suivez l'état de vos propositions pédagogiques, sélections parents et retraits."}
          </p>
        </div>

        <Link
          href="/teacher/opportunities"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#16385c] hover:bg-[#10243d] text-white transition-colors shadow-xs shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
          <span>{locale === "en" ? "Discover Opportunities" : "Découvrir des opportunités"}</span>
        </Link>
      </div>

      {/* KPI Status Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: "ALL", label: locale === "en" ? "All" : "Toutes", count: counts.all, color: "text-slate-800" },
          { key: "SUBMITTED", label: locale === "en" ? "Under Review" : "En attente", count: counts.submitted, color: "text-[#16385c]" },
          { key: "SHORTLISTED", label: locale === "en" ? "Shortlisted" : "Présélection", count: counts.shortlisted, color: "text-purple-700" },
          { key: "ACCEPTED", label: locale === "en" ? "Accepted" : "Acceptées", count: counts.accepted, color: "text-emerald-700" },
          { key: "WITHDRAWN", label: locale === "en" ? "Withdrawn" : "Retirées", count: counts.withdrawn, color: "text-slate-500" },
          { key: "REJECTED", label: locale === "en" ? "Declined" : "Déclinées", count: counts.rejected, color: "text-red-600" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`p-3.5 rounded-2xl border text-left transition-all shadow-xs ${
              statusFilter === tab.key
                ? "bg-white border-[#16385c] ring-2 ring-[#16385c]/10"
                : "bg-white border-slate-200/80 hover:border-slate-300"
            }`}
          >
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {tab.label}
            </span>
            <span className={`text-xl font-extrabold ${tab.color}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={locale === "en" ? "Search by subject, zone..." : "Rechercher par matière, zone..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c] text-slate-800"
          />
        </form>

        <button
          type="button"
          onClick={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
            fetchApplications();
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#16385c] font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{locale === "en" ? "Reset" : "Réinitialiser"}</span>
        </button>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded-md w-1/3"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {locale === "en" ? "No Applications Found" : "Aucune candidature dans cette vue"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {locale === "en"
              ? "You haven't submitted any applications matching this filter. Explore the opportunities marketplace to discover open requests."
              : "Vous n'avez pas de candidature correspondant à ce filtre. Rendez-vous sur la place de marché pour découvrir des demandes ouvertes."}
          </p>
          <Link
            href="/teacher/opportunities"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] hover:bg-[#10243d] text-white transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
            <span>{locale === "en" ? "Browse Marketplace" : "Explorer le marché"}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const statusInfo = getStatusBadge(app.status);
            const isCustom = app.request.subjectName.toLowerCase() === "autre" && app.request.customSubject;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 hover:border-[#16385c]/30 transition-all shadow-xs space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">
                        {isCustom ? app.request.customSubject : app.request.subjectName}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        • {app.request.gradeLevelName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {app.request.commune ? `${app.request.commune}, ` : ""}
                        {app.request.city}
                      </span>
                      <span>•</span>
                      <span>
                        {locale === "en" ? "Submitted " : "Déposée le "}
                        {new Date(app.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.badgeColor}`}
                    >
                      {statusInfo.label}
                    </span>
                    {app.proposedRateGnf && (
                      <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                        {formatGnf(app.proposedRateGnf)}
                        <span className="text-[10px] text-slate-500 font-normal">
                          {app.proposedRateType === "HOURLY" ? " / h" : " / mois"}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Pitch preview */}
                {app.pitchMessage && (
                  <p className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100 line-clamp-2 italic">
                    &laquo; {app.pitchMessage} &raquo;
                  </p>
                )}

                {/* Footer actions & next steps */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-[11px] text-slate-400">
                    {app.status === "SUBMITTED" && (
                      <span>
                        {locale === "en"
                          ? "The parent has been notified and will review your profile."
                          : "Le parent a été notifié et examinera votre candidature."}
                      </span>
                    )}
                    {app.status === "WITHDRAWN" && (
                      <span>
                        {locale === "en" ? "Withdrawn on: " : "Retirée le : "}
                        {app.withdrawnAt ? new Date(app.withdrawnAt).toLocaleDateString() : ""}
                      </span>
                    )}
                    {app.status === "SHORTLISTED" && (
                      <span className="text-purple-700 font-medium">
                        {locale === "en"
                          ? "You are shortlisted! The family may confirm the match shortly."
                          : "Vous êtes présélectionné ! La famille validera prochainement son choix final."}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Withdraw Button if eligible */}
                    {["SUBMITTED", "SHORTLISTED"].includes(app.status) && (
                      <>
                        {withdrawConfirmId === app.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-red-700 font-semibold">
                              {locale === "en" ? "Confirm?" : "Confirmer le retrait ?"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleWithdraw(app.id)}
                              disabled={withdrawingId === app.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              {withdrawingId === app.id && <Loader2 className="w-3 h-3 animate-spin" />}
                              <span>{locale === "en" ? "Yes, Withdraw" : "Oui, retirer"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setWithdrawConfirmId(null)}
                              className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100"
                            >
                              {locale === "en" ? "Cancel" : "Annuler"}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setWithdrawConfirmId(app.id)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{locale === "en" ? "Withdraw" : "Retirer"}</span>
                          </button>
                        )}
                      </>
                    )}

                    <Link
                      href={`/teacher/opportunities/${app.requestId}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16385c] hover:underline"
                    >
                      <span>{locale === "en" ? "View Opportunity" : "Voir l'opportunité"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

