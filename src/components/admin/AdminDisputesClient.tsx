"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Gavel,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { DisputeStatus } from "@prisma/client";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AdminResolveDisputeModal } from "@/components/reports/AdminResolveDisputeModal";

export interface AdminDisputeItem {
  id: string;
  sessionId: string;
  category?: string | null;
  reason: string;
  status: DisputeStatus;
  teacherResponse?: string | null;
  teacherRespondedAt?: string | null;
  adminNote?: string | null;
  resolutionType?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  session: {
    id: string;
    scheduledStart: string;
    scheduledEnd: string;
    durationMinutes: number;
    actualDurationMinutes?: number | null;
    attendanceStatus: string;
    status: string;
    classroom: {
      id: string;
      subjectName: string;
      student: {
        id: string;
        fullName: string;
        gradeLevel?: string | null;
        parent: {
          user: {
            fullName: string;
            phoneNumber?: string | null;
            email: string;
          };
        };
      };
      teacherProfile: {
        id: string;
        user: {
          fullName: string;
          phoneNumber?: string | null;
          email: string;
        };
      };
    };
    report?: {
      topicsCovered: string;
      learningObjectives?: string | null;
      strengths?: string | null;
      areasForImprovement?: string | null;
    } | null;
  };
}

export function AdminDisputesClient() {
  const { t, locale } = useTranslation();

  const [disputes, setDisputes] = useState<AdminDisputeItem[]>([]);
  const [stats, setStats] = useState({
    open: 0,
    underReview: 0,
    resolved: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "UNDER_REVIEW" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedDisputeForResolve, setSelectedDisputeForResolve] = useState<AdminDisputeItem | null>(null);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/session-disputes");
      const data = await res.json();
      if (data.disputes) {
        setDisputes(data.disputes);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("fetchDisputes error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      if (activeTab === "OPEN" && d.status !== DisputeStatus.OPEN) return false;
      if (activeTab === "UNDER_REVIEW" && d.status !== DisputeStatus.UNDER_REVIEW) return false;
      if (
        activeTab === "RESOLVED" &&
        d.status !== DisputeStatus.RESOLVED_VALIDATED &&
        d.status !== DisputeStatus.RESOLVED_REFUNDED &&
        d.status !== DisputeStatus.RESOLVED_RESCHEDULED
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSubject = d.session.classroom.subjectName.toLowerCase().includes(q);
        const matchStudent = d.session.classroom.student.fullName.toLowerCase().includes(q);
        const matchParent = d.session.classroom.student.parent.user.fullName.toLowerCase().includes(q);
        const matchTeacher = d.session.classroom.teacherProfile.user.fullName.toLowerCase().includes(q);
        const matchReason = d.reason.toLowerCase().includes(q);
        return matchSubject || matchStudent || matchParent || matchTeacher || matchReason;
      }

      return true;
    });
  }, [disputes, activeTab, searchQuery]);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {locale === "en" ? "Admin Console" : "Console d'Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Session Disputes" : "Litiges & Arbitrage des Séances"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
              {locale === "en" ? "Session Disputes & Mediation" : "Arbitrage des Litiges de Séance"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
              {stats.total} {locale === "en" ? "case(s)" : "dossier(s)"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Examine parent complaints, review teacher feedback, and render binding administrative decisions."
              : "Instruisez les réclamations des familles, examinez les comptes rendus et appliquez les décisions d'arbitrage."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <Link
            href="/admin/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{locale === "en" ? "General Schedule" : "Calendrier Général"}</span>
          </Link>
          <Link
            href="/admin/assignments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>{locale === "en" ? "Classes & Assignments" : "Attributions & Classes"}</span>
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("OPEN")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "OPEN"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            {locale === "en" ? "Pending Review" : "À Instruire"}
          </span>
          <span className="text-2xl font-bold text-rose-900 mt-1 block">{stats.open}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "New complaints" : "Plaintes parents ouvertes"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("UNDER_REVIEW")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "UNDER_REVIEW"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            {locale === "en" ? "Teacher Responded" : "Réponse Reçue"}
          </span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">{stats.underReview}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Ready for decision" : "Dossier prêt à statuer"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RESOLVED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "RESOLVED"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            {locale === "en" ? "Arbitrated & Closed" : "Arbitrés & Clos"}
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{stats.resolved}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Decisions recorded" : "Décisions administratives"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "ALL"
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            {locale === "en" ? "Total Cases" : "Total Litiges"}
          </span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Historic disputes" : "Historique national"}
          </span>
        </button>
      </div>

      {/* 3. Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "All Cases" : "Tous les dossiers"} ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("OPEN")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "OPEN"
                  ? "bg-white text-rose-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Pending Review" : "À Instruire"} ({stats.open})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("UNDER_REVIEW")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "UNDER_REVIEW"
                  ? "bg-white text-amber-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Teacher Responded" : "Réponse Reçue"} ({stats.underReview})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RESOLVED")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "RESOLVED"
                  ? "bg-white text-emerald-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Arbitrated" : "Arbitrés"} ({stats.resolved})
            </button>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "en" ? "Search dispute..." : "Rechercher litige, élève, tuteur..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>
        </div>
      </div>

      {/* 4. Disputes List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          {locale === "en" ? "Loading disputes..." : "Chargement des litiges..."}
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">
            {locale === "en" ? "No session disputes found" : "Aucun litige de séance"}
          </h3>
          <p className="text-slate-400 text-xs">
            {locale === "en"
              ? "All tutoring sessions are running normally without active claims."
              : "Aucune contestation ne correspond aux filtres appliqués."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDisputes.map((dispute) => {
            const isResolved =
              dispute.status === DisputeStatus.RESOLVED_VALIDATED ||
              dispute.status === DisputeStatus.RESOLVED_REFUNDED ||
              dispute.status === DisputeStatus.RESOLVED_RESCHEDULED;

            const sessionDate = new Date(dispute.session.scheduledStart).toLocaleDateString(
              locale === "en" ? "en-GB" : "fr-GN",
              {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            return (
              <div
                key={dispute.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm sm:text-base font-heading">
                      {dispute.session.classroom.subjectName}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      Élève : {dispute.session.classroom.student.fullName}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 capitalize">{sessionDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {dispute.status === DisputeStatus.OPEN ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                        <Clock className="w-3 h-3 text-rose-600" />
                        <span>{locale === "en" ? "Pending Review" : "À Instruire"}</span>
                      </span>
                    ) : dispute.status === DisputeStatus.UNDER_REVIEW ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <MessageSquare className="w-3 h-3 text-amber-600" />
                        <span>{locale === "en" ? "Teacher Responded" : "Réponse Reçue"}</span>
                      </span>
                    ) : dispute.status === DisputeStatus.RESOLVED_VALIDATED ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{locale === "en" ? "Validated by Admin" : "Arbitré : Validé"}</span>
                      </span>
                    ) : dispute.status === DisputeStatus.RESOLVED_RESCHEDULED ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <Calendar className="w-3 h-3 text-blue-600" />
                        <span>{locale === "en" ? "Rescheduled" : "Arbitré : Reprogrammé"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <span>{locale === "en" ? "Cancelled" : "Arbitré : Annulé"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-100 text-xs space-y-1">
                  <span className="font-semibold text-rose-800">
                    Famille ({dispute.session.classroom.student.parent.user.fullName}) • Motif : {dispute.category || "Général"}
                  </span>
                  <p className="italic text-rose-950">« {dispute.reason} »</p>
                </div>

                {/* Teacher Response Details */}
                {dispute.teacherResponse ? (
                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 text-xs space-y-1">
                    <span className="font-semibold text-amber-800">
                      Enseignant ({dispute.session.classroom.teacherProfile.user.fullName}) :
                    </span>
                    <p className="italic text-amber-950">« {dispute.teacherResponse} »</p>
                  </div>
                ) : !isResolved ? (
                  <p className="text-[11px] text-slate-400 italic">
                    {locale === "en"
                      ? "Awaiting teacher's explanation..."
                      : "En attente des explications de l'enseignant..."}
                  </p>
                ) : null}

                {/* Admin Note if resolved */}
                {isResolved && dispute.adminNote && (
                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs space-y-1">
                    <span className="font-semibold text-blue-800">
                      {locale === "en" ? "Official Arbitration Decision:" : "Décision administrative d'arbitrage :"}
                    </span>
                    <p className="text-blue-950">{dispute.adminNote}</p>
                  </div>
                )}

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Litige #{dispute.id.slice(-6)}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedDisputeForResolve(dispute)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16385c] text-white hover:bg-[#1f4a7a] transition-colors cursor-pointer"
                  >
                    <Gavel className="w-3.5 h-3.5 text-[#e59a38]" />
                    <span>
                      {isResolved
                        ? locale === "en" ? "View Arbitration" : "Consulter la décision"
                        : locale === "en" ? "Arbitrate & Resolve" : "Examiner & Arbitrer"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Arbitration Modal */}
      {selectedDisputeForResolve && (
        <AdminResolveDisputeModal
          dispute={selectedDisputeForResolve}
          onClose={() => setSelectedDisputeForResolve(null)}
          onSuccess={() => {
            setSelectedDisputeForResolve(null);
            fetchDisputes();
          }}
        />
      )}
    </div>
  );
}

