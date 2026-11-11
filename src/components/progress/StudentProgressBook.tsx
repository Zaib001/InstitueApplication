"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Star,
  Users,
  FileText,
  Plus,
  Send,
  Eye,
  Table as TableIcon,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { CreateHomeworkModal } from "./CreateHomeworkModal";
import { CreateAssessmentModal } from "./CreateAssessmentModal";
import { CreateObservationModal } from "./CreateObservationModal";
import { HomeworkDetailModal, HomeworkItem } from "./HomeworkDetailModal";
import { AssessmentDetailModal, AssessmentItem } from "./AssessmentDetailModal";

export interface StudentProgressBookProps {
  data: any;
  actorRole: "PARENT" | "TEACHER" | "ADMIN";
  onRefresh: () => void;
  childrenList?: Array<{ id: string; fullName: string; gradeLevel: string }>;
}

export function StudentProgressBook({
  data,
  actorRole,
  onRefresh,
  childrenList,
}: StudentProgressBookProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  // View Mode: Interactive Dashboard vs Official Tabular Report
  const [viewMode, setViewMode] = useState<"DASHBOARD" | "BULLETIN">("DASHBOARD");

  // Modals state
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentItem | null>(null);

  // Filters
  const [timelineFilter, setTimelineFilter] = useState<"ALL" | "LESSON" | "HOMEWORK" | "ASSESSMENT">("ALL");
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState<string>("ALL");

  const student = data.student;
  const summary = data.summary;
  const attendance = data.attendance;
  const subjects = data.subjects || [];
  const assessments = data.assessments || [];
  const homework = data.homework || [];
  const observations = data.observations || [];
  const timeline = data.timeline || [];

  const classroomOptions = subjects.map((s: any) => ({
    id: s.classroomId,
    subjectName: s.subjectName,
  }));

  const filteredTimeline = timeline.filter((item: any) => {
    if (timelineFilter === "ALL") return true;
    return item.type === timelineFilter;
  });

  const filteredHomework = homework.filter((item: any) => {
    if (homeworkStatusFilter === "ALL") return true;
    return item.status === homeworkStatusFilter;
  });

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const lessonTimeline = timeline.filter((t: any) => t.type === "LESSON");

  return (
    <div className="w-full space-y-8">
      {/* Print-specific CSS injected for pixel-perfect A4 Tabular Report */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, .print\\:hidden, #sidebar, button {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            margin-bottom: 14px !important;
          }
          th, td {
            border: 1px solid #1e293b !important;
            padding: 5px 8px !important;
            font-size: 10px !important;
            line-height: 1.35 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Screen Controls & Multi-Child Switcher Header (Hidden on Print) */}
      <div className="space-y-4 print:hidden">
        {/* Prominent Multi-Child Selector Bar */}
        {childrenList && childrenList.length > 1 && (
          <div className="p-4 sm:p-5 rounded-3xl bg-[#122b49] bg-gradient-to-r from-[#122b49] via-[#16385c] to-[#1c3f66] text-white shadow-md border border-[#234b76] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#e59a38]/20 text-[#e59a38] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-bold tracking-wide uppercase text-white/95">
                  {locale === "en" ? "Switch Child Progress Book" : "Changer d'enfant"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#e59a38]/25 text-[#e59a38] border border-[#e59a38]/40">
                  {childrenList.length} {locale === "en" ? "children" : "enfants inscrits"}
                </span>
              </div>
              <span className="text-xs text-white/90">
                {locale === "en" ? "Currently viewing: " : "Carnet affiché : "}
                <strong className="text-white font-bold underline decoration-[#e59a38] decoration-2 underline-offset-2">
                  {student.fullName}
                </strong>
              </span>
            </div>

            {/* Horizontal Tabs for all registered children */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
              {childrenList.map((c) => {
                const isCurrent = c.id === student.id;
                return (
                  <Link
                    key={c.id}
                    href={`/parent/students/${c.id}/progress`}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-white text-slate-900 border-[#e59a38] ring-3 ring-[#e59a38]/40 shadow-sm"
                        : "bg-[#18365a] text-white border-[#2c5380] hover:bg-[#204470] hover:border-[#3b6da7]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isCurrent
                            ? "bg-[#122b49] text-[#e59a38]"
                            : "bg-white/20 text-white"
                        }`}
                      >
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className={`block font-bold text-xs truncate ${isCurrent ? "text-slate-900" : "text-white"}`}>
                          {c.fullName}
                        </span>
                        <span className={`block text-[10px] font-medium truncate ${isCurrent ? "text-slate-500" : "text-slate-300"}`}>
                          {c.gradeLevel}
                        </span>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{locale === "en" ? "Active" : "Actif"}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#e59a38] hover:text-white shrink-0">
                        {locale === "en" ? "Open →" : "Consulter →"}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Executive Progress Book Header Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#122b49] bg-gradient-to-br from-[#122b49] via-[#16385c] to-indigo-800 text-2xl font-black text-white shadow-md">
                {student.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
                    {locale === "en"
                      ? `Digital Progress Book: ${student.fullName}`
                      : `Carnet de progression de : ${student.fullName}`}
                  </h1>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                    {student.gradeLevel}
                  </span>
                  {student.cycle && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      Cycle : {student.cycle}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {student.schoolName ? `Établissement : ${student.schoolName} • ` : ""}
                  Parent référent : <span className="font-semibold text-slate-700">{student.parent.fullName}</span>
                  {student.parent.phone ? ` (${student.parent.phone})` : ""}
                </p>
                {student.preferredSubjects && student.preferredSubjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-400">Matières suivies :</span>
                    {student.preferredSubjects.map((sub: string) => (
                      <span
                        key={sub}
                        className="rounded-lg bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-700"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons & Switchers */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile Child Dropdown Switcher */}
              {childrenList && childrenList.length > 1 && (
                <div className="sm:hidden w-full">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
                    {locale === "en" ? "Change child" : "Changer d'enfant :"}
                  </label>
                  <select
                    value={student.id}
                    onChange={(e) => {
                      router.push(`/parent/students/${e.target.value}/progress`);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition focus:outline-none"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode("DASHBOARD")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "DASHBOARD"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>{t("progressBook.actions.viewDashboard", "Tableau de bord")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("BULLETIN")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    viewMode === "BULLETIN"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TableIcon className="h-3.5 w-3.5" />
                  <span>{t("progressBook.actions.viewOfficialBulletin", "Format Tabulaire (Bulletin)")}</span>
                </button>
              </div>

              {/* Primary Print / PDF Download Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition cursor-pointer"
                title="Télécharger en PDF ou imprimer le bulletin scolaire officiel"
              >
                <Download className="h-4 w-4 text-amber-300" />
                <span>{t("progressBook.actions.downloadPdf", "Télécharger en PDF")}</span>
              </button>

              {/* Teacher Specific Action Buttons */}
              {actorRole === "TEACHER" && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHomeworkModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("progressBook.homework.newHomeworkBtn", "Assigner devoir")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAssessmentModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{t("progressBook.assessments.newAssessmentBtn", "Noter contrôle")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsObservationModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t("progressBook.observations.newObservationBtn", "Bilan")}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State Banner if student has no academic history yet */}
      {(!summary.totalScheduledSessions || summary.totalScheduledSessions === 0) && assessments.length === 0 && homework.length === 0 && observations.length === 0 && timeline.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 sm:p-12 text-center shadow-xs print:hidden space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {locale === "en"
                ? "This student's progress book does not contain any data yet."
                : "Le carnet de progression de cet élève ne contient pas encore de données."}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {locale === "en"
                ? "Lesson reports, attendance, test scores, homework assignments, and teacher digests will automatically populate here once classes are scheduled and delivered."
                : "Les comptes rendus de cours, l'assiduité, les devoirs et les bilans d'apprentissage apparaîtront automatiquement dès que les cours auront débuté."}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/parent/requests?action=new&studentId=${student.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#122b49] hover:bg-[#1b3d66] text-white text-xs font-bold shadow-xs transition"
            >
              <Sparkles className="w-4 h-4 text-[#e59a38]" />
              <span>{locale === "en" ? "Create a tutoring request" : "Faire une demande de cours"}</span>
            </Link>
            <Link
              href="/parent/children"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              <span>{locale === "en" ? "Back to children" : "Retour à mes enfants"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. SCREEN MODE A: INTERACTIVE DASHBOARD VIEW (Shown when viewMode === "DASHBOARD") */}
      {/* ========================================================================= */}
      <div className={viewMode === "DASHBOARD" ? "space-y-8 print:hidden" : "hidden"}>
        {/* KPI Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("progressBook.kpi.overallGrade", "Moyenne Générale")}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {summary.overallAverageScore20 !== null ? `${summary.overallAverageScore20}` : "—"}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 20</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {summary.overallAveragePercentage !== null
                ? `${summary.overallAveragePercentage}% de réussite globale`
                : "Aucune note enregistrée"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("progressBook.kpi.attendanceRate", "Assiduité")}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {summary.attendanceRatePercentage}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {attendance.deliveredSessions} séances délivrées
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("progressBook.kpi.completedSessions", "Séances")}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {summary.deliveredSessions}
              </span>
              <span className="text-xs text-slate-400">/ {summary.totalScheduledSessions} planifiées</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Avec validation parentale
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t("progressBook.kpi.activeHomework", "Devoirs en cours")}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {summary.activeHomeworkCount}
              </span>
              <span className="text-xs text-slate-400">en cours</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {summary.completedHomeworkCount} devoirs rendus et validés
            </p>
          </div>
        </div>

        {/* Charts & Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {t("progressBook.charts.evolutionTitle", "Courbe d'Évolution Académique")}
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {t("progressBook.charts.scoreScale", "Échelle normalisée (sur 20)")}
              </span>
            </div>

            <div className="mt-6">
              {!summary.hasEnoughChartData ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {t(
                      "progressBook.charts.notEnoughData",
                      "Pas encore assez de données pour afficher l'évolution."
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm">
                    Au moins 2 évaluations notées sont nécessaires pour tracer la dynamique de progression.
                  </p>
                </div>
              ) : (
                <div className="relative h-48 w-full">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 500 160">
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeDasharray="4" />
                    <text x="5" y="16" fill="#94a3b8" fontSize="10">20/20 (100%)</text>
                    <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="4" />
                    <text x="5" y="76" fill="#94a3b8" fontSize="10">10/20 (50%)</text>
                    <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeDasharray="4" />
                    <text x="5" y="136" fill="#94a3b8" fontSize="10">0/20 (0%)</text>

                    {(() => {
                      const points = assessments.map((a: any, idx: number) => {
                        const x = 50 + (idx / (assessments.length - 1)) * 420;
                        const y = 140 - (a.percentage / 100) * 120;
                        return `${x},${y}`;
                      });
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points.join(" ")}
                          />
                          {assessments.map((a: any, idx: number) => {
                            const x = 50 + (idx / (assessments.length - 1)) * 420;
                            const y = 140 - (a.percentage / 100) * 120;
                            return (
                              <g key={a.id} className="cursor-pointer group">
                                <circle
                                  cx={x}
                                  cy={y}
                                  r="5"
                                  fill="#ffffff"
                                  stroke="#4f46e5"
                                  strokeWidth="3"
                                  className="transition-transform group-hover:scale-125"
                                />
                                <text
                                  x={x}
                                  y={y - 10}
                                  textAnchor="middle"
                                  fill="#1e293b"
                                  fontSize="10"
                                  fontWeight="bold"
                                >
                                  {a.score}/{a.maxScore}
                                </text>
                                <text
                                  x={x}
                                  y={155}
                                  textAnchor="middle"
                                  fill="#64748b"
                                  fontSize="9"
                                >
                                  {new Date(a.date).toLocaleDateString("fr-FR", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </text>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                {t("progressBook.attendanceBreakdown.title", "Assiduité & Ponctualité")}
              </h2>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                {attendance.ratePercentage}%
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700">Présent ({attendance.presentCount})</span>
                  <span className="text-slate-500">
                    {attendance.deliveredSessions > 0
                      ? Math.round((attendance.presentCount / attendance.deliveredSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${
                        attendance.deliveredSessions > 0
                          ? (attendance.presentCount / attendance.deliveredSessions) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-amber-700">En retard ({attendance.lateCount})</span>
                  <span className="text-slate-500">
                    {attendance.deliveredSessions > 0
                      ? Math.round((attendance.lateCount / attendance.deliveredSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${
                        attendance.deliveredSessions > 0
                          ? (attendance.lateCount / attendance.deliveredSessions) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-blue-700">Absence justifiée ({attendance.excusedCount})</span>
                  <span className="text-slate-500">
                    {attendance.deliveredSessions > 0
                      ? Math.round((attendance.excusedCount / attendance.deliveredSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${
                        attendance.deliveredSessions > 0
                          ? (attendance.excusedCount / attendance.deliveredSessions) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-700">Absence non justifiée ({attendance.absentStudentCount})</span>
                  <span className="text-slate-500">
                    {attendance.deliveredSessions > 0
                      ? Math.round((attendance.absentStudentCount / attendance.deliveredSessions) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${
                        attendance.deliveredSessions > 0
                          ? (attendance.absentStudentCount / attendance.deliveredSessions) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-Level Cards */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">
              {t("progressBook.subjects.title", "Bilan Détaillé par Matière")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Notions abordées, compétences acquises et recommandations pédagogiques par discipline
            </p>
          </div>

          {subjects.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {t("progressBook.subjects.noSubjects", "Aucune matière active pour le moment.")}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {subjects.map((sub: any) => (
                <div
                  key={sub.subjectName}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-4 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded-lg bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
                        {sub.subjectName}
                      </span>
                      <p className="text-xs text-slate-500 mt-2">
                        Professeur : <span className="font-semibold text-slate-700">{sub.teacherName}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">
                        {sub.averageScore20 !== null ? `${sub.averageScore20} / 20` : "—"}
                      </div>
                      <span className="text-xs text-slate-400">
                        {sub.completedLessonsCount} cours dispensés
                      </span>
                    </div>
                  </div>

                  {sub.topicsCovered && sub.topicsCovered.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                        Notions abordées
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sub.topicsCovered.slice(0, 5).map((topic: string, i: number) => (
                          <span
                            key={i}
                            className="rounded-md bg-white border border-slate-200 px-2.5 py-0.5 text-xs text-slate-700"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-emerald-50/80 p-3 border border-emerald-100">
                      <span className="font-bold text-emerald-800 block mb-0.5">Points forts</span>
                      <p className="text-emerald-950 line-clamp-3">
                        {sub.strengths && sub.strengths.length > 0
                          ? sub.strengths[0]
                          : "En cours d'évaluation"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-100">
                      <span className="font-bold text-amber-800 block mb-0.5">Axes de progrès</span>
                      <p className="text-amber-950 line-clamp-3">
                        {sub.areasForImprovement && sub.areasForImprovement.length > 0
                          ? sub.areasForImprovement[0]
                          : "Consolider la pratique"}
                      </p>
                    </div>
                  </div>

                  {sub.recommendations && sub.recommendations.length > 0 && (
                    <div className="rounded-xl bg-white p-3.5 border border-slate-200 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Conseil du professeur :</span>
                      <p className="text-slate-600 italic">"{sub.recommendations[0]}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Homework Section */}
        <div id="homework" className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t("progressBook.homework.title", "Devoirs & Travail Personnel")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consignes données après les cours, suivi des rendus et corrections
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={homeworkStatusFilter}
                onChange={(e) => setHomeworkStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">Tous les devoirs</option>
                <option value="ASSIGNED">Assignés</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="SUBMITTED">Rendus</option>
                <option value="COMPLETED">Validés</option>
              </select>

              {actorRole === "TEACHER" && (
                <button
                  type="button"
                  onClick={() => setIsHomeworkModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{t("progressBook.homework.newHomeworkBtn", "Nouveau devoir")}</span>
                </button>
              )}
            </div>
          </div>

          {filteredHomework.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {t("progressBook.homework.noHomework", "Aucun devoir enregistré pour le moment.")}
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {filteredHomework.map((hw: any) => (
                <div
                  key={hw.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                        {hw.subjectName}
                      </span>
                      <span className="text-xs text-slate-400">
                        {hw.dueDate
                          ? `À rendre pour le ${new Date(hw.dueDate).toLocaleDateString("fr-FR")}`
                          : "Sans date limite"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{hw.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-1">{hw.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        hw.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700"
                          : hw.status === "SUBMITTED"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {hw.status === "COMPLETED"
                        ? "Validé"
                        : hw.status === "SUBMITTED"
                        ? "Rendu"
                        : hw.status === "IN_PROGRESS"
                        ? "En cours"
                        : "Assigné"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedHomework(hw)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Détails</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chronological Timeline */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t("progressBook.timeline.title", "Chronologie Pédagogique Détaillée")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Historique complet des séances, comptes rendus, devoirs et évaluations
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              {(["ALL", "LESSON", "HOMEWORK", "ASSESSMENT"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setTimelineFilter(filter)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                    timelineFilter === filter
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {filter === "ALL"
                    ? "Tout"
                    : filter === "LESSON"
                    ? "Séances"
                    : filter === "HOMEWORK"
                    ? "Devoirs"
                    : "Évaluations"}
                </button>
              ))}
            </div>
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              {t("progressBook.timeline.noEvents", "Aucun événement pédagogique dans l'historique.")}
            </div>
          ) : (
            <div className="relative mt-6 space-y-6 before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-100">
              {filteredTimeline.map((item: any) => (
                <div key={item.id} className="relative flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl z-10 ${
                      item.type === "LESSON"
                        ? "bg-indigo-50 text-indigo-600 ring-4 ring-white"
                        : item.type === "HOMEWORK"
                        ? "bg-amber-50 text-amber-600 ring-4 ring-white"
                        : "bg-blue-50 text-blue-600 ring-4 ring-white"
                    }`}
                  >
                    {item.type === "LESSON" && <Calendar className="h-5 w-5" />}
                    {item.type === "HOMEWORK" && <BookOpen className="h-5 w-5" />}
                    {item.type === "ASSESSMENT" && <Award className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {item.subjectName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(item.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {item.type === "LESSON" && (
                      <div className="mt-2 text-xs text-slate-600 space-y-1">
                        <p>
                          Professeur : <span className="font-semibold text-slate-700">{item.teacherName}</span>
                        </p>
                        {item.details?.report?.topicsCovered && (
                          <p className="text-slate-700">
                            <span className="font-semibold">Notions :</span> {item.details.report.topicsCovered}
                          </p>
                        )}
                        {item.details?.approval && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 mt-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Validé par le parent
                          </span>
                        )}
                      </div>
                    )}

                    {item.type === "HOMEWORK" && (
                      <div className="mt-2 text-xs text-slate-600 space-y-1">
                        <p>{item.details.description}</p>
                        {item.details.teacherFeedback && (
                          <p className="rounded-lg bg-emerald-50/60 p-2.5 text-emerald-950 italic border border-emerald-100">
                            Correction prof : {item.details.teacherFeedback}
                          </p>
                        )}
                      </div>
                    )}

                    {item.type === "ASSESSMENT" && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                          Note : {item.details.obtainedScore} / {item.details.maxScore} ({item.details.percentage}%)
                        </span>
                        {item.details.teacherComments && (
                          <p className="text-xs text-slate-600 italic">
                            "{item.details.teacherComments}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OFFICIAL TABULAR BULLETIN VIEW (Shown when viewMode === "BULLETIN" AND on PRINT) */}
      {/* ========================================================================= */}
      <div
        className={`w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm print:p-0 print:border-none print:shadow-none ${
          viewMode === "BULLETIN" ? "block" : "hidden print:block"
        }`}
      >
        {/* National Republic & Ministry Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4 text-center sm:text-left">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                République de Guinée
              </p>
              <p className="text-[9px] italic text-slate-500">Travail – Justice – Solidarité</p>
              <p className="text-[9px] font-semibold text-slate-700 mt-0.5">
                Ministère de l'Enseignement Pré-Universitaire et de l'Alphabétisation
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#16385c] text-white font-black text-xs uppercase tracking-wider">
                Monsieur<span className="text-amber-400">Fanyi</span>
              </div>
              <p className="text-[9px] text-slate-500 font-medium mt-1">
                Plateforme d'Excellence & Suivi Scolaire Personnalisé
              </p>
            </div>

            <div className="text-center sm:text-right">
              <p className="text-xs font-black uppercase text-slate-900 tracking-tight">
                Bulletin Pédagogique Officiel
              </p>
              <p className="text-[9px] text-slate-500 font-medium mt-0.5">
                Conakry, le {new Date().toLocaleDateString("fr-FR")}
              </p>
              <p className="text-[9px] text-indigo-700 font-bold">
                Année Scolaire 2025–2026
              </p>
            </div>
          </div>
        </div>

        {/* Student & Parent Identification Table */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left border border-slate-700 text-xs">
            <tbody>
              <tr>
                <td className="bg-slate-100 font-bold text-slate-800 w-1/4 p-2 border border-slate-700">
                  Élève :
                </td>
                <td className="font-extrabold text-slate-900 w-1/4 p-2 border border-slate-700">
                  {student.fullName}
                </td>
                <td className="bg-slate-100 font-bold text-slate-800 w-1/4 p-2 border border-slate-700">
                  Classe / Niveau :
                </td>
                <td className="font-bold text-slate-900 w-1/4 p-2 border border-slate-700">
                  {student.gradeLevel} {student.cycle ? `(${student.cycle})` : ""}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-100 font-bold text-slate-800 p-2 border border-slate-700">
                  Établissement :
                </td>
                <td className="p-2 border border-slate-700">
                  {student.schoolName || "Non renseigné"}
                </td>
                <td className="bg-slate-100 font-bold text-slate-800 p-2 border border-slate-700">
                  Parent Référent :
                </td>
                <td className="p-2 border border-slate-700 font-medium">
                  {student.parent.fullName} ({student.parent.phone || student.parent.email || "—"})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* TABLE 1: Synthèse Générale des Résultats & de l'Assiduité */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-l-4 border-[#16385c] pl-2">
            1. Synthèse Générale des Performances & de l'Assiduité
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center border border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="p-2 border border-slate-700">Moyenne Générale</th>
                  <th className="p-2 border border-slate-700">Taux de Réussite</th>
                  <th className="p-2 border border-slate-700">Séances Dispensées</th>
                  <th className="p-2 border border-slate-700">Taux d'Assiduité</th>
                  <th className="p-2 border border-slate-700">Présences</th>
                  <th className="p-2 border border-slate-700">Retards</th>
                  <th className="p-2 border border-slate-700">Absences Excusées</th>
                  <th className="p-2 border border-slate-700">Absences Injustifiées</th>
                  <th className="p-2 border border-slate-700">Devoirs Validés</th>
                  <th className="p-2 border border-slate-700">Contrôles Notés</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 border border-slate-700 font-black text-slate-900 text-sm">
                    {summary.overallAverageScore20 !== null ? `${summary.overallAverageScore20} / 20` : "—"}
                  </td>
                  <td className="p-2.5 border border-slate-700 font-bold text-indigo-900">
                    {summary.overallAveragePercentage !== null ? `${summary.overallAveragePercentage}%` : "—"}
                  </td>
                  <td className="p-2.5 border border-slate-700 font-semibold">{summary.deliveredSessions}</td>
                  <td className="p-2.5 border border-slate-700 font-black text-emerald-700">
                    {summary.attendanceRatePercentage}%
                  </td>
                  <td className="p-2.5 border border-slate-700">{attendance.presentCount}</td>
                  <td className="p-2.5 border border-slate-700">{attendance.lateCount}</td>
                  <td className="p-2.5 border border-slate-700">{attendance.excusedCount}</td>
                  <td
                    className={`p-2.5 border border-slate-700 ${
                      attendance.absentStudentCount > 0 ? "font-bold text-rose-700" : ""
                    }`}
                  >
                    {attendance.absentStudentCount}
                  </td>
                  <td className="p-2.5 border border-slate-700 font-semibold text-amber-800">
                    {summary.completedHomeworkCount}
                  </td>
                  <td className="p-2.5 border border-slate-700 font-semibold text-blue-800">
                    {summary.totalAssessmentsCount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 2: Bilan Pédagogique Détaillé par Matière */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-l-4 border-indigo-700 pl-2">
            2. Relevé Pédagogique Détaillé par Matière
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="p-2 border border-slate-700 w-[14%]">Discipline</th>
                  <th className="p-2 border border-slate-700 w-[14%]">Professeur</th>
                  <th className="p-2 border border-slate-700 w-[8%] text-center">Séances</th>
                  <th className="p-2 border border-slate-700 w-[10%] text-center">Moyenne</th>
                  <th className="p-2 border border-slate-700 w-[18%]">Notions Abordées</th>
                  <th className="p-2 border border-slate-700 w-[18%]">Points Forts Constatés</th>
                  <th className="p-2 border border-slate-700 w-[18%]">Axes de Progrès & Conseils</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-slate-500 border border-slate-700">
                      Aucune matière active enregistrée.
                    </td>
                  </tr>
                ) : (
                  subjects.map((s: any) => (
                    <tr key={s.subjectName}>
                      <td className="p-2 border border-slate-700 font-bold text-slate-900">
                        {s.subjectName}
                      </td>
                      <td className="p-2 border border-slate-700">{s.teacherName}</td>
                      <td className="p-2 border border-slate-700 text-center font-semibold">
                        {s.completedLessonsCount}
                      </td>
                      <td className="p-2 border border-slate-700 text-center font-extrabold text-slate-900">
                        {s.averageScore20 !== null ? `${s.averageScore20} / 20` : "—"}
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px] leading-tight">
                        {s.topicsCovered && s.topicsCovered.length > 0
                          ? s.topicsCovered.join(", ")
                          : "Non spécifié"}
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px] leading-tight text-emerald-950 font-medium">
                        {s.strengths && s.strengths.length > 0 ? s.strengths.join(". ") : "En observation"}
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px] leading-tight text-slate-800">
                        {s.areasForImprovement && s.areasForImprovement.length > 0
                          ? `${s.areasForImprovement.join(". ")}. `
                          : ""}
                        {s.recommendations && s.recommendations.length > 0
                          ? `Recommandation : ${s.recommendations[0]}`
                          : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 3: Registre des Évaluations & Contrôles Notés */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-l-4 border-blue-700 pl-2">
            3. Registre Détaillé des Contrôles & Évaluations Notées
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="p-2 border border-slate-700 w-[12%]">Date</th>
                  <th className="p-2 border border-slate-700 w-[14%]">Matière</th>
                  <th className="p-2 border border-slate-700 w-[16%]">Nature du Contrôle</th>
                  <th className="p-2 border border-slate-700 w-[20%]">Intitulé de l'Évaluation</th>
                  <th className="p-2 border border-slate-700 w-[10%] text-center">Note / 20</th>
                  <th className="p-2 border border-slate-700 w-[8%] text-center">% Réussite</th>
                  <th className="p-2 border border-slate-700 w-[20%]">Appréciation Enseignant</th>
                </tr>
              </thead>
              <tbody>
                {assessments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-slate-500 border border-slate-700">
                      Aucune évaluation périodique enregistrée pour le moment.
                    </td>
                  </tr>
                ) : (
                  assessments.map((a: any) => (
                    <tr key={a.id}>
                      <td className="p-2 border border-slate-700 text-[10px] whitespace-nowrap">
                        {new Date(a.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-2 border border-slate-700 font-bold">{a.subjectName}</td>
                      <td className="p-2 border border-slate-700 text-[10px]">
                        {a.type === "DIAGNOSTIC"
                          ? "Évaluation Diagnostique"
                          : a.type === "WEEKLY_QUIZ"
                          ? "Interrogation Hebdomadaire"
                          : a.type === "MONTHLY_EXAM"
                          ? "Contrôle Mensuel"
                          : a.type === "TOPIC_TEST"
                          ? "Contrôle de Chapitre"
                          : "Examen Blanc"}
                      </td>
                      <td className="p-2 border border-slate-700 font-medium">{a.title}</td>
                      <td className="p-2 border border-slate-700 text-center font-black text-slate-900">
                        {a.score} / {a.maxScore}
                      </td>
                      <td className="p-2 border border-slate-700 text-center font-bold text-indigo-900">
                        {a.percentage}%
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px] leading-tight italic">
                        {a.teacherComments || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 4: Relevé des Devoirs & Travaux Personnels */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-l-4 border-amber-600 pl-2">
            4. Relevé des Devoirs & Travaux Personnels
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="p-2 border border-slate-700 w-[14%]">Matière</th>
                  <th className="p-2 border border-slate-700 w-[24%]">Intitulé & Consignes</th>
                  <th className="p-2 border border-slate-700 w-[12%] text-center">Échéance</th>
                  <th className="p-2 border border-slate-700 w-[12%] text-center">Statut</th>
                  <th className="p-2 border border-slate-700 w-[18%]">Travail Remis par l'Élève</th>
                  <th className="p-2 border border-slate-700 w-[20%]">Correction du Professeur</th>
                </tr>
              </thead>
              <tbody>
                {homework.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-slate-500 border border-slate-700">
                      Aucun devoir enregistré.
                    </td>
                  </tr>
                ) : (
                  homework.map((hw: any) => (
                    <tr key={hw.id}>
                      <td className="p-2 border border-slate-700 font-bold">{hw.subjectName}</td>
                      <td className="p-2 border border-slate-700 font-medium">
                        <div>{hw.title}</div>
                        <div className="text-[10px] text-slate-600 line-clamp-2 mt-0.5">{hw.description}</div>
                      </td>
                      <td className="p-2 border border-slate-700 text-center text-[10px]">
                        {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString("fr-FR") : "Libre"}
                      </td>
                      <td className="p-2 border border-slate-700 text-center">
                        <span className="font-bold text-[10px] uppercase">
                          {hw.status === "COMPLETED"
                            ? "Validé"
                            : hw.status === "SUBMITTED"
                            ? "Rendu"
                            : hw.status === "IN_PROGRESS"
                            ? "En cours"
                            : "Assigné"}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px] italic">
                        {hw.studentSubmission || "—"}
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px] text-emerald-950 font-medium">
                        {hw.teacherFeedback || "En attente"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE 5: Relevé des Séances Dispensées & Émargement */}
        <div className="mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2 border-l-4 border-emerald-700 pl-2">
            5. Relevé d'Assiduité des Séances de Cours
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-slate-700 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900">
                  <th className="p-2 border border-slate-700 w-[14%]">Date Séance</th>
                  <th className="p-2 border border-slate-700 w-[14%]">Matière</th>
                  <th className="p-2 border border-slate-700 w-[18%]">Professeur</th>
                  <th className="p-2 border border-slate-700 w-[10%] text-center">Durée</th>
                  <th className="p-2 border border-slate-700 w-[16%] text-center">Émargement</th>
                  <th className="p-2 border border-slate-700 w-[28%]">Validation Parentale</th>
                </tr>
              </thead>
              <tbody>
                {lessonTimeline.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-slate-500 border border-slate-700">
                      Aucune séance enregistrée.
                    </td>
                  </tr>
                ) : (
                  lessonTimeline.slice(0, 12).map((l: any) => (
                    <tr key={l.id}>
                      <td className="p-2 border border-slate-700 text-[10px] whitespace-nowrap">
                        {new Date(l.date).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-2 border border-slate-700 font-bold">{l.subjectName}</td>
                      <td className="p-2 border border-slate-700">{l.teacherName}</td>
                      <td className="p-2 border border-slate-700 text-center font-medium">
                        {l.details?.durationMinutes || 120} min
                      </td>
                      <td className="p-2 border border-slate-700 text-center font-semibold text-[10px]">
                        {l.details?.attendanceStatus === "PRESENT"
                          ? "Présent"
                          : l.details?.attendanceStatus === "LATE"
                          ? "En retard"
                          : l.details?.attendanceStatus === "EXCUSED"
                          ? "Excusé"
                          : "Non renseigné"}
                      </td>
                      <td className="p-2 border border-slate-700 text-[10px]">
                        {l.details?.approval
                          ? `Validé par le parent le ${new Date(
                              l.details.approval.approvedAt
                            ).toLocaleDateString("fr-FR")}`
                          : "En attente de validation"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Signatures Section */}
        <div className="page-break-avoid border-t-2 border-slate-900 pt-5 mt-6">
          <div className="text-center font-bold text-xs uppercase tracking-wider mb-4 text-slate-900">
            Visas & Validations Pédagogiques Officielles
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-slate-500 p-3 rounded-lg text-center h-32 flex flex-col justify-between">
              <div className="font-bold text-[11px] text-slate-900">Le Professeur Référent</div>
              <div className="text-[9px] text-slate-500">Certifie l'exactitude des notes et cours</div>
              <div className="border-b border-dotted border-slate-400 my-1"></div>
              <div className="text-[9px] text-slate-400 italic">Signature de l'enseignant</div>
            </div>

            <div className="border border-slate-500 p-3 rounded-lg text-center h-32 flex flex-col justify-between">
              <div className="font-bold text-[11px] text-slate-900">Le Parent / Tuteur Légal</div>
              <div className="text-[9px] text-slate-500">Mention manuscrite "Lu et approuvé"</div>
              <div className="border-b border-dotted border-slate-400 my-1"></div>
              <div className="text-[9px] text-slate-400 italic">Signature du parent</div>
            </div>

            <div className="border border-slate-500 p-3 rounded-lg text-center h-32 flex flex-col justify-between bg-slate-50/70">
              <div className="font-bold text-[11px] text-slate-900">Direction Pédagogique</div>
              <div className="text-[9px] font-bold text-emerald-800">Visa Officiel Certifié Monsieur Fanyi</div>
              <div className="border-b border-dotted border-slate-400 my-1"></div>
              <div className="text-[9px] text-slate-500">Cachet Numérique & Conformité MEPU-A</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateHomeworkModal
        isOpen={isHomeworkModalOpen}
        onClose={() => setIsHomeworkModalOpen(false)}
        studentId={student.id}
        studentName={student.fullName}
        classrooms={classroomOptions}
        onSuccess={onRefresh}
      />

      <CreateAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        studentId={student.id}
        studentName={student.fullName}
        classrooms={classroomOptions}
        onSuccess={onRefresh}
      />

      <CreateObservationModal
        isOpen={isObservationModalOpen}
        onClose={() => setIsObservationModalOpen(false)}
        studentId={student.id}
        studentName={student.fullName}
        classrooms={classroomOptions}
        onSuccess={onRefresh}
      />

      <HomeworkDetailModal
        isOpen={!!selectedHomework}
        onClose={() => setSelectedHomework(null)}
        homework={selectedHomework}
        actorRole={actorRole}
        onSuccess={onRefresh}
      />

      <AssessmentDetailModal
        isOpen={!!selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
        assessment={selectedAssessment}
      />
    </div>
  );
}
