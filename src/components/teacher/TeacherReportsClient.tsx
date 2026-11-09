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
  Eye,
  FileCheck,
  FileEdit,
  GraduationCap,
  MessageSquare,
  PlusCircle,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { LessonAttendance, ReportStatus, SessionStatus } from "@prisma/client";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LessonReportModal } from "@/components/reports/LessonReportModal";
import { TeacherDisputeResponseModal } from "@/components/reports/TeacherDisputeResponseModal";

export interface TeacherSessionReportItem {
  id: string;
  classroomId: string;
  sessionSequence: number;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  actualDurationMinutes?: number | null;
  attendanceStatus: LessonAttendance;
  status: SessionStatus;
  classroom: {
    id: string;
    subjectName: string;
    student: {
      id: string;
      fullName: string;
      gradeLevel?: string | null;
    };
  };
  report?: {
    id: string;
    status: ReportStatus;
    topicsCovered: string;
    learningObjectives?: string | null;
    studentEffort?: string | null;
    teacherNotes?: string | null;
    strengths?: string | null;
    areasForImprovement?: string | null;
    homeworkGiven?: string | null;
    homeworkDueDate?: string | null;
    nextLessonRecommendations?: string | null;
    assessmentTitle?: string | null;
    assessmentScore?: number | null;
    assessmentMaxScore?: number | null;
    assessmentComment?: string | null;
    progressRating?: number | null;
    submittedAt?: string | null;
  } | null;
  approval?: {
    id: string;
    approvedAt: string;
    feedbackNote?: string | null;
  } | null;
  dispute?: {
    id: string;
    category?: string | null;
    reason: string;
    status: string;
    teacherResponse?: string | null;
  } | null;
}

export function TeacherReportsClient() {
  const { t, locale } = useTranslation();

  const [sessions, setSessions] = useState<TeacherSessionReportItem[]>([]);
  const [stats, setStats] = useState({
    toWrite: 0,
    drafts: 0,
    submitted: 0,
    validated: 0,
    disputed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "TO_WRITE" | "DRAFT" | "SUBMITTED" | "VALIDATED" | "DISPUTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedSessionForReport, setSelectedSessionForReport] = useState<TeacherSessionReportItem | null>(null);
  const [selectedSessionForDispute, setSelectedSessionForDispute] = useState<TeacherSessionReportItem | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/reports");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("fetchReports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Tab filter
      if (activeTab === "TO_WRITE" && (s.report || s.status === SessionStatus.PARENT_DISPUTED)) {
        return false;
      }
      if (activeTab === "DRAFT" && s.report?.status !== ReportStatus.DRAFT) {
        return false;
      }
      if (activeTab === "SUBMITTED" && s.report?.status !== ReportStatus.SUBMITTED) {
        return false;
      }
      if (activeTab === "VALIDATED" && s.report?.status !== ReportStatus.VALIDATED && s.status !== SessionStatus.PARENT_APPROVED) {
        return false;
      }
      if (activeTab === "DISPUTED" && s.status !== SessionStatus.PARENT_DISPUTED && !s.dispute) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchStudent = s.classroom.student.fullName.toLowerCase().includes(q);
        const matchSubject = s.classroom.subjectName.toLowerCase().includes(q);
        const matchTopics = s.report?.topicsCovered.toLowerCase().includes(q) || false;
        return matchStudent || matchSubject || matchTopics;
      }

      return true;
    });
  }, [sessions, activeTab, searchQuery]);

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
              {locale === "en" ? "Lesson Reports" : "Comptes Rendus de Séance"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
              {locale === "en" ? "Lesson Reports & Academic Records" : "Comptes Rendus & Suivi Pédagogique"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
              {stats.total} {locale === "en" ? "sessions" : "séance(s)"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Draft, submit, and track pedagogical feedback and homework for your students."
              : "Rédigez vos comptes rendus, renseignez l'assiduité, les devoirs et suivez la validation parentale."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <Link
            href="/teacher/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{locale === "en" ? "Schedule" : "Emploi du temps"}</span>
          </Link>
          <Link
            href="/teacher/classes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>{locale === "en" ? "My Classes" : "Mes Classes"}</span>
          </Link>
          <NotificationBell variant="light" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("TO_WRITE")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "TO_WRITE"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            {locale === "en" ? "To Complete" : "À Rédiger"}
          </span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">{stats.toWrite}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Reports needed" : "Séances sans compte rendu"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DRAFT")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "DRAFT"
              ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
            {locale === "en" ? "Drafts" : "Brouillons"}
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{stats.drafts}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "In progress" : "En cours de rédaction"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SUBMITTED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "SUBMITTED"
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
            {locale === "en" ? "Submitted" : "Soumis"}
          </span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">{stats.submitted}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Awaiting parent review" : "En attente parent"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("VALIDATED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "VALIDATED"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            {locale === "en" ? "Validated" : "Validés"}
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{stats.validated}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Parent approved" : "Validés par la famille"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DISPUTED")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "DISPUTED"
              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            {locale === "en" ? "Disputed" : "Litiges"}
          </span>
          <span className="text-2xl font-bold text-rose-900 mt-1 block">{stats.disputed}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Open issues" : "Réclamations ouvertes"}
          </span>
        </button>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Main Tabs */}
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
              {locale === "en" ? "All Sessions" : "Toutes les séances"} ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("TO_WRITE")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "TO_WRITE"
                  ? "bg-white text-amber-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "To Complete" : "À Rédiger"} ({stats.toWrite})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DRAFT")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "DRAFT"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Drafts" : "Brouillons"} ({stats.drafts})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SUBMITTED")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "SUBMITTED"
                  ? "bg-white text-blue-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Submitted" : "Soumis"} ({stats.submitted})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("VALIDATED")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "VALIDATED"
                  ? "bg-white text-emerald-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Validated" : "Validés"} ({stats.validated})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("DISPUTED")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "DISPUTED"
                  ? "bg-white text-rose-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "Disputes" : "Litiges"} ({stats.disputed})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === "en" ? "Search student, subject..." : "Rechercher élève, matière..."}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>
        </div>
      </div>

      {/* 4. Sessions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          {locale === "en" ? "Loading reports..." : "Chargement des comptes rendus..."}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <FileEdit className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">
            {locale === "en" ? "No lesson reports found" : "Aucun compte rendu trouvé"}
          </h3>
          <p className="text-slate-400 text-xs">
            {locale === "en"
              ? "No sessions match your selected filters."
              : "Aucune séance ne correspond aux critères sélectionnés."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const hasReport = !!session.report;
            const r = session.report;
            const isDisputed = session.status === SessionStatus.PARENT_DISPUTED || !!session.dispute;
            const isValidated = session.status === SessionStatus.PARENT_APPROVED || r?.status === ReportStatus.VALIDATED;
            const isSubmitted = r?.status === ReportStatus.SUBMITTED;
            const isDraft = r?.status === ReportStatus.DRAFT;

            const sessionDate = new Date(session.scheduledStart).toLocaleDateString(
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
                key={session.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm sm:text-base font-heading">
                      {session.classroom.subjectName}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-600 font-medium">
                      {session.classroom.student.fullName} ({session.classroom.student.gradeLevel || "N/A"})
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 capitalize">{sessionDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isValidated ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{locale === "en" ? "Validated" : "Séance Validée"}</span>
                      </span>
                    ) : isDisputed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>{locale === "en" ? "Dispute Open" : "Litige en cours"}</span>
                      </span>
                    ) : isSubmitted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>{locale === "en" ? "Awaiting Review" : "En attente validation parent"}</span>
                      </span>
                    ) : isDraft ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <FileEdit className="w-3 h-3 text-slate-500" />
                        <span>{locale === "en" ? "Draft Saved" : "Brouillon enregistré"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        <span>{locale === "en" ? "Report Needed" : "À Rédiger"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Dispute banner if active */}
                {isDisputed && session.dispute && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{locale === "en" ? "Parent's claim:" : "Réclamation formulée par la famille :"} ({session.dispute.category || "Général"})</span>
                      </div>
                      <p className="italic text-rose-950">« {session.dispute.reason} »</p>
                      {session.dispute.teacherResponse && (
                        <p className="text-[11px] text-slate-600 mt-1">
                          <span className="font-semibold">{locale === "en" ? "Your response:" : "Votre explication :"}</span> « {session.dispute.teacherResponse} »
                        </p>
                      )}
                    </div>

                    {!session.dispute.teacherResponse && (
                      <button
                        type="button"
                        onClick={() => setSelectedSessionForDispute(session)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shrink-0 cursor-pointer"
                      >
                        {locale === "en" ? "Respond to Dispute" : "Apporter mon explication"}
                      </button>
                    )}
                  </div>
                )}

                {/* Report Content Snippet */}
                {r ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-700">{locale === "en" ? "Topics:" : "Sujets abordés :"} </span>
                      <span className="text-slate-600">{r.topicsCovered}</span>
                    </div>
                    {r.homeworkGiven && (
                      <div>
                        <span className="font-semibold text-indigo-700">{locale === "en" ? "Homework:" : "Devoirs :"} </span>
                        <span className="text-slate-600">{r.homeworkGiven}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                      <span>
                        <span className="font-semibold">{locale === "en" ? "Attendance:" : "Présence :"}</span> {session.attendanceStatus}
                      </span>
                      <span>
                        <span className="font-semibold">{locale === "en" ? "Actual Duration:" : "Durée :"}</span> {session.actualDurationMinutes || session.durationMinutes} min
                      </span>
                      {r.assessmentScore !== null && r.assessmentScore !== undefined && (
                        <span>
                          <span className="font-semibold">{locale === "en" ? "Score:" : "Note :"}</span> {r.assessmentScore}/{r.assessmentMaxScore || 20}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      {locale === "en"
                        ? "Lesson completed. Please submit the report to enable parent validation."
                        : "Séance dispensée. Veuillez rédiger le compte rendu pour permettre la validation parentale."}
                    </span>
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Séance #{session.sessionSequence}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSessionForReport(session)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isValidated
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-[#16385c] text-white hover:bg-[#1f4a7a]"
                      }`}
                    >
                      {isValidated ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "View Report" : "Consulter le compte rendu"}</span>
                        </>
                      ) : isSubmitted ? (
                        <>
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "View / Edit" : "Consulter / Modifier"}</span>
                        </>
                      ) : isDraft ? (
                        <>
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "Continue Draft" : "Poursuivre le brouillon"}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-[#e59a38]" />
                          <span>{locale === "en" ? "Write Report" : "Rédiger le compte rendu"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedSessionForReport && (
        <LessonReportModal
          session={{
            id: selectedSessionForReport.id,
            classroomId: selectedSessionForReport.classroomId,
            subjectName: selectedSessionForReport.classroom.subjectName,
            studentName: selectedSessionForReport.classroom.student.fullName,
            scheduledStart: selectedSessionForReport.scheduledStart,
            scheduledEnd: selectedSessionForReport.scheduledEnd,
            durationMinutes: selectedSessionForReport.durationMinutes,
            actualDurationMinutes: selectedSessionForReport.actualDurationMinutes,
            attendanceStatus: selectedSessionForReport.attendanceStatus,
            report: selectedSessionForReport.report,
          }}
          onClose={() => setSelectedSessionForReport(null)}
          onSuccess={() => {
            setSelectedSessionForReport(null);
            fetchReports();
          }}
        />
      )}

      {selectedSessionForDispute && selectedSessionForDispute.dispute && (
        <TeacherDisputeResponseModal
          sessionId={selectedSessionForDispute.id}
          subjectName={selectedSessionForDispute.classroom.subjectName}
          dispute={selectedSessionForDispute.dispute}
          onClose={() => setSelectedSessionForDispute(null)}
          onSuccess={() => {
            setSelectedSessionForDispute(null);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}

