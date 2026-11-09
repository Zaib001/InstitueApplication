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
  FileText,
  GraduationCap,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { LessonAttendance, ReportStatus, SessionStatus } from "@prisma/client";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ParentReportDetailModal } from "@/components/reports/ParentReportDetailModal";
import { DisputeSessionModal } from "@/components/reports/DisputeSessionModal";

export interface ParentSessionReportItem {
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
    teacherRespondedAt?: string | null;
    adminNote?: string | null;
    resolvedAt?: string | null;
  } | null;
}

export function ParentReportsClient() {
  const { t, locale } = useTranslation();

  const [sessions, setSessions] = useState<ParentSessionReportItem[]>([]);
  const [stats, setStats] = useState({
    awaitingValidation: 0,
    validated: 0,
    disputed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "AWAITING" | "VALIDATED" | "DISPUTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string>("ALL");

  const [inspectingSession, setInspectingSession] = useState<ParentSessionReportItem | null>(null);
  const [disputingSessionId, setDisputingSessionId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parent/reports");
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

  // Deep-link resolution for notifications (?sessionId=...)
  useEffect(() => {
    if (typeof window !== "undefined" && sessions.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetSessionId = params.get("sessionId");
      if (targetSessionId) {
        const found = sessions.find((s) => s.id === targetSessionId);
        if (found) {
          setInspectingSession(found);
        }
      }
    }
  }, [sessions]);

  // Distinct children list for filtering
  const childrenOptions = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {
      map.set(s.classroom.student.id, s.classroom.student.fullName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Child filter
      if (selectedChildId !== "ALL" && s.classroom.student.id !== selectedChildId) {
        return false;
      }

      // Tab filter
      if (activeTab === "AWAITING") {
        const isAwaiting = s.status === SessionStatus.TEACHER_COMPLETED || s.report?.status === ReportStatus.SUBMITTED;
        const isDisp = s.status === SessionStatus.PARENT_DISPUTED || !!s.dispute;
        if (!isAwaiting || isDisp) return false;
      }
      if (activeTab === "VALIDATED") {
        const isValid = s.status === SessionStatus.PARENT_APPROVED || s.report?.status === ReportStatus.VALIDATED;
        if (!isValid) return false;
      }
      if (activeTab === "DISPUTED") {
        const isDisp = s.status === SessionStatus.PARENT_DISPUTED || !!s.dispute;
        if (!isDisp) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchChild = s.classroom.student.fullName.toLowerCase().includes(q);
        const matchTeacher = s.classroom.teacherProfile.user.fullName.toLowerCase().includes(q);
        const matchSubject = s.classroom.subjectName.toLowerCase().includes(q);
        const matchTopics = s.report?.topicsCovered.toLowerCase().includes(q) || false;
        return matchChild || matchTeacher || matchSubject || matchTopics;
      }

      return true;
    });
  }, [sessions, activeTab, selectedChildId, searchQuery]);

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              {locale === "en" ? "Parent Space" : "Espace Famille"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Reports & Validations" : "Comptes Rendus & Devoirs"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
              {locale === "en" ? "Lesson Reports & Academic Progress" : "Comptes Rendus & Validation des Cours"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
              {stats.total} {locale === "en" ? "lesson(s)" : "cours"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Review your children's educational progress, homework, and approve delivered tutoring lessons."
              : "Consultez le déroulement des séances, les devoirs assignés et validez les cours dispensés par vos professeurs."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
          <Link
            href="/parent/calendar"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-600" />
            <span>{locale === "en" ? "Schedule" : "Emploi du temps"}</span>
          </Link>
          <Link
            href="/parent/classes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>{locale === "en" ? "Classes & Tutors" : "Classes & Tuteurs"}</span>
          </Link>
          <NotificationBell variant="light" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("AWAITING")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "AWAITING"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/20"
              : "bg-white border-slate-200 shadow-xs hover:border-slate-300"
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            {locale === "en" ? "Awaiting Review" : "À Valider"}
          </span>
          <span className="text-2xl font-bold text-amber-900 mt-1 block">{stats.awaitingValidation}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Lessons to validate" : "Séances prêtes pour validation"}
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
            {locale === "en" ? "Validated" : "Séances Validées"}
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{stats.validated}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Approved by you" : "Cours confirmés et acquis"}
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
            {locale === "en" ? "Disputes" : "Litiges en Cours"}
          </span>
          <span className="text-2xl font-bold text-rose-900 mt-1 block">{stats.disputed}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "Under administrative review" : "Dossiers en instruction"}
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
            {locale === "en" ? "Total Delivered" : "Total Suivis"}
          </span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">{stats.total}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {locale === "en" ? "All lessons recorded" : "Historique académique complet"}
          </span>
        </button>
      </div>

      {/* 3. Filter Bar with Tabs & Child Selector */}
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
              {locale === "en" ? "All Lessons" : "Tous les cours"} ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("AWAITING")}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "AWAITING"
                  ? "bg-white text-amber-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {locale === "en" ? "To Validate" : "À Valider"} ({stats.awaitingValidation})
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

          {/* Child Picker & Search */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {childrenOptions.length > 1 && (
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              >
                <option value="ALL">{locale === "en" ? "All Children" : "Tous mes enfants"}</option>
                {childrenOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={locale === "en" ? "Search subject, teacher..." : "Rechercher matière, tuteur..."}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lesson Reports List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          {locale === "en" ? "Loading reports..." : "Chargement des comptes rendus..."}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">
            {locale === "en" ? "No lesson reports found" : "Aucun compte rendu trouvé"}
          </h3>
          <p className="text-slate-400 text-xs">
            {locale === "en"
              ? "Your child has no lesson reports matching this filter."
              : "Aucune séance ne correspond aux critères sélectionnés."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => {
            const r = session.report;
            const isDisputed = session.status === SessionStatus.PARENT_DISPUTED || !!session.dispute;
            const isValidated = session.status === SessionStatus.PARENT_APPROVED || r?.status === ReportStatus.VALIDATED;
            const isAwaiting = (session.status === SessionStatus.TEACHER_COMPLETED || r?.status === ReportStatus.SUBMITTED) && !isDisputed && !isValidated;

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
                    <span className="text-xs text-emerald-800 font-medium">
                      Prof. {session.classroom.teacherProfile.user.fullName}
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
                        <span>{locale === "en" ? "Dispute in progress" : "Litige en cours"}</span>
                      </span>
                    ) : isAwaiting ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>{locale === "en" ? "Action Needed" : "À Valider"}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {session.status}
                      </span>
                    )}
                  </div>
                </div>

                {/* Dispute Alert if present */}
                {isDisputed && session.dispute && (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-rose-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{locale === "en" ? "Dispute opened:" : "Votre réclamation :"} ({session.dispute.category || "Général"})</span>
                    </span>
                    <p className="italic text-rose-950">« {session.dispute.reason} »</p>
                    {session.dispute.teacherResponse && (
                      <p className="text-[11px] text-slate-700 pt-1 border-t border-rose-200/50">
                        <span className="font-semibold">{locale === "en" ? "Teacher response:" : "Réponse de l'enseignant :"}</span> « {session.dispute.teacherResponse} »
                      </p>
                    )}
                  </div>
                )}

                {/* Report Content Snippet */}
                {r ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                    <div>
                      <span className="font-semibold text-slate-700">{locale === "en" ? "Topics covered:" : "Sujets abordés :"} </span>
                      <span className="text-slate-600">{r.topicsCovered}</span>
                    </div>

                    {r.homeworkGiven && (
                      <div className="text-indigo-900 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{locale === "en" ? "Homework:" : "Devoirs :"}</span>
                        <span>{r.homeworkGiven}</span>
                        {r.homeworkDueDate && (
                          <span className="text-[10px] text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
                            {locale === "en" ? "Due:" : "Pour le :"} {new Date(r.homeworkDueDate).toLocaleDateString(locale === "en" ? "en-GB" : "fr-GN")}
                          </span>
                        )}
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
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
                    <span>
                      {locale === "en"
                        ? "Teacher has not yet filed the lesson report for this session."
                        : "Le compte rendu de cette séance est en attente de rédaction par le professeur."}
                    </span>
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Séance #{session.sessionSequence}
                  </span>

                  <div className="flex items-center gap-2">
                    {isAwaiting && (
                      <button
                        type="button"
                        onClick={() => {
                          setDisputingSessionId(session.id);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer"
                      >
                        {locale === "en" ? "Dispute" : "Contester"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setInspectingSession(session)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isAwaiting
                          ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                          : "bg-[#16385c] text-white hover:bg-[#1f4a7a]"
                      }`}
                    >
                      {isAwaiting ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "Review & Validate" : "Consulter & Valider"}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "View Full Report" : "Consulter le compte rendu"}</span>
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
      {inspectingSession && (
        <ParentReportDetailModal
          session={{
            id: inspectingSession.id,
            classroomId: inspectingSession.classroomId,
            subjectName: inspectingSession.classroom.subjectName,
            studentName: inspectingSession.classroom.student.fullName,
            teacherName: inspectingSession.classroom.teacherProfile.user.fullName,
            scheduledStart: inspectingSession.scheduledStart,
            scheduledEnd: inspectingSession.scheduledEnd,
            durationMinutes: inspectingSession.durationMinutes,
            actualDurationMinutes: inspectingSession.actualDurationMinutes,
            attendanceStatus: inspectingSession.attendanceStatus,
            status: inspectingSession.status,
            report: inspectingSession.report,
            approval: inspectingSession.approval,
            dispute: inspectingSession.dispute,
          }}
          onClose={() => setInspectingSession(null)}
          onApproveSuccess={() => {
            setInspectingSession(null);
            fetchReports();
          }}
          onOpenDispute={() => {
            const sid = inspectingSession.id;
            setInspectingSession(null);
            setDisputingSessionId(sid);
          }}
        />
      )}

      {disputingSessionId && (
        <DisputeSessionModal
          sessionId={disputingSessionId}
          subjectName={
            sessions.find((s) => s.id === disputingSessionId)?.classroom.subjectName
          }
          studentName={
            sessions.find((s) => s.id === disputingSessionId)?.classroom.student.fullName
          }
          onClose={() => setDisputingSessionId(null)}
          onSuccess={() => {
            setDisputingSessionId(null);
            fetchReports();
          }}
        />
      )}
    </div>
  );
}

