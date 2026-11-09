"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  RotateCcw,
  CheckCircle2,
  Award,
  ChevronDown,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Play,
  Clock,
  TrendingUp,
  X,
  Video,
  Check,
  Users,
  Wallet,
  FileCheck,
  Percent,
  ShieldCheck,
  UserCheck,
  Eye,
  Plus,
  Send,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AuthenticatedUser } from "@/lib/auth/session";

interface LightDashboardViewProps {
  user: AuthenticatedUser;
  stats?: {
    inProgress: number;
    completed: number;
    achievements: number;
    hoursSpentTotal: string;
    performancePercent: number;
  };
  customCourses?: Array<{
    id: string;
    title: string;
    lessonsCount: number;
    progressPercent: number;
    linkUrl?: string;
  }>;
  featuredTeacherApplication?: {
    id: string;
    name: string;
    subject: string;
    city: string;
    degrees: string;
    submittedAt?: string;
  } | null;
  realEarnings?: string;
  upcomingClass?: {
    id: string;
    title: string;
    scheduledText: string;
    participant: string;
    rateOrEarningsText: string;
    locationText?: string;
  } | null;
  teacherMarketplaceSummary?: {
    openOpportunitiesCount: number;
    pendingApplicationsCount: number;
    recommendedCount: number;
  } | null;
}

export function LightDashboardView({
  user,
  stats = {
    inProgress: 4,
    completed: 18,
    achievements: 12,
    hoursSpentTotal: "126h 48m",
    performancePercent: 72,
  },
  customCourses,
  featuredTeacherApplication,
  realEarnings,
  upcomingClass,
  teacherMarketplaceSummary,
}: LightDashboardViewProps) {
  const { t, locale } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [timeRangeKey, setTimeRangeKey] = useState<"timeRange7Days" | "timeRange30Days" | "timeRangeThisMonth">("timeRange7Days");

  // Interactive Modals
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<"reschedule" | "join" | "studentCard" | "adminReview" | null>(null);
  const [selectedCourseModal, setSelectedCourseModal] = useState<{
    id: string;
    title: string;
    lessonsCount: number;
    progressPercent: number;
  } | null>(null);

  // Role-based course databases
  const getCoursesForRole = () => {
    if (customCourses !== undefined) return customCourses;
    return [];
  };

  const currentCourses = getCoursesForRole();
  const filteredCourses = currentCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const timeRangeLabel = t(`dashboard.${timeRangeKey}`, "7 derniers jours");

  const dayLabels =
    locale === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Role tailored text helpers
  const dashboardTitle =
    user.role === "TEACHER"
      ? t("dashboard.teacherTitle", "Espace Enseignant")
      : user.role === "ADMIN"
      ? t("dashboard.adminTitle", "Console d'Administration")
      : t("dashboard.parentTitle", "Espace Famille");

  const dashboardSubtitle =
    user.role === "TEACHER"
      ? t("dashboard.teacherSubtitle", "Gérez vos classes, vos disponibilités et consultez vos gains (85%)")
      : user.role === "ADMIN"
      ? t("dashboard.adminSubtitle", "Supervision nationale, vérification des dossiers et séquestres")
      : t("dashboard.parentSubtitle", "Suivez le parcours pédagogique et les cours de vos enfants");

  const coursesSectionTitle =
    user.role === "TEACHER"
      ? t("dashboard.teacherCoursesTitle", "Mes Classes & Élèves")
      : user.role === "ADMIN"
      ? t("dashboard.adminCoursesTitle", "Surveillance des Classes & Séquestres")
      : t("dashboard.myCourses", "Mes Cours & Matières");

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar: Title, Search, Notifications, Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            {dashboardTitle}
          </h1>
          <p className="text-xs text-slate-400">
            {dashboardSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Search Pill Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("dashboard.searchPlaceholder", "Rechercher un cours, une matière, un élève...")}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-slate-200/90 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
            />
          </div>

          {/* Universal Notification Bell with real database connection */}
          <NotificationBell variant="light" />

          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. Top 3 Metric Cards Tailored by Role */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {user.role === "TEACHER" ? (
          <>
            {/* Teacher Card 1 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.teacherClassesCount", "Classes actives")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.inProgress} {locale === "en" ? "Classes" : "Classes"}
                </div>
              </div>
            </div>

            {/* Teacher Card 2 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.teacherHoursDone", "Séances données")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.completed} {locale === "en" ? "Delivered" : "Séances"}
                </div>
              </div>
            </div>

            {/* Teacher Card 3 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.teacherEarningsNet", "Gains nets (85%)")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {realEarnings || "0 GNF"}
                </div>
              </div>
            </div>
          </>
        ) : user.role === "ADMIN" ? (
          <>
            {/* Admin Card 1 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.adminPendingReviews", "Dossiers à valider")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.inProgress} {locale === "en" ? "Pending" : "Dossiers"}
                </div>
              </div>
            </div>

            {/* Admin Card 2 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.adminTotalUsers", "Utilisateurs inscrits")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.completed} {locale === "en" ? "Accounts" : "Comptes"}
                </div>
              </div>
            </div>

            {/* Admin Card 3 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.adminCommission", "Part plateforme (15%)")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {realEarnings || "0 GNF"}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Parent Card 1 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.inProgress", "En cours")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.inProgress} {t("dashboard.lessonsCount", "Séances")}
                </div>
              </div>
            </div>

            {/* Parent Card 2 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.completes", "Séances validées")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.completed} {t("dashboard.lessonsCount", "Séances")}
                </div>
              </div>
            </div>

            {/* Parent Card 3 */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">
                  {t("dashboard.achievements", "Taux de conformité")}
                </span>
                <div className="text-lg font-black text-slate-800">
                  {stats.performancePercent}%
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2.5 Teacher Marketplace Quick Access Widget */}
      {user.role === "TEACHER" && (
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#16385c]/10 text-[#16385c] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#e59a38]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {locale === "en" ? "Tutoring Opportunities & Applications" : "Opportunités & Candidatures"}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? `${teacherMarketplaceSummary?.openOpportunitiesCount || 0} open requests available in Conakry (${teacherMarketplaceSummary?.recommendedCount || 0} recommended) • ${teacherMarketplaceSummary?.pendingApplicationsCount || 0} active application(s)`
                  : `${teacherMarketplaceSummary?.openOpportunitiesCount || 0} demandes ouvertes à Conakry (${teacherMarketplaceSummary?.recommendedCount || 0} recommandées) • ${teacherMarketplaceSummary?.pendingApplicationsCount || 0} candidature(s) en cours`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/teacher/opportunities"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] hover:bg-[#10243d] text-white transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>{locale === "en" ? "Discover" : "Découvrir"}</span>
            </Link>
            <Link
              href="/teacher/applications"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "My Applications" : "Mes Candidatures"}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. Middle 2 Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Chart: Hours */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {user.role === "TEACHER"
                  ? (locale === "en" ? "Teaching Hours Delivered" : "Heures d'enseignement dispensées")
                  : user.role === "ADMIN"
                  ? (locale === "en" ? "Platform Tutoring Volume" : "Volume d'heures de soutien supervisées")
                  : t("dashboard.hourSpent", "Heures de cours")}
              </h2>
              <div className="text-xs text-slate-400 font-medium pt-0.5">
                {stats.hoursSpentTotal}
              </div>
            </div>

            {/* Time range selector dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTimeRangeDropdown(!showTimeRangeDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span>{timeRangeLabel}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showTimeRangeDropdown && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 p-1.5 z-30 text-xs space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRangeKey("timeRange7Days");
                      setShowTimeRangeDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      timeRangeKey === "timeRange7Days" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t("dashboard.timeRange7Days", "7 derniers jours")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRangeKey("timeRange30Days");
                      setShowTimeRangeDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      timeRangeKey === "timeRange30Days" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t("dashboard.timeRange30Days", "30 derniers jours")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimeRangeKey("timeRangeThisMonth");
                      setShowTimeRangeDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      timeRangeKey === "timeRangeThisMonth" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {t("dashboard.timeRangeThisMonth", "Ce mois-ci")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Spline Wave Chart */}
          <div className="relative pt-4 pb-2">
            <div className="absolute top-2 left-[58%] -translate-x-1/2 bg-[#122b49] text-white px-3 py-1.5 rounded-xl shadow-lg text-[10px] flex items-center gap-2 z-10 pointer-events-none">
              <Clock className="w-3 h-3 text-[#e59a38]" />
              <div>
                <span className="font-semibold block">
                  {stats.hoursSpentTotal && stats.hoursSpentTotal !== "0h 00m"
                    ? (locale === "en" ? "Hours Delivered" : "Heures dispensées")
                    : (locale === "en" ? "Tutoring Volume" : "Volume d'heures")}
                </span>
                <span className="text-[#e59a38] font-bold">{stats.hoursSpentTotal || "0h 00m"}</span>
              </div>
            </div>

            <svg
              className="w-full h-44 overflow-visible"
              viewBox="0 0 600 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {stats.hoursSpentTotal && stats.hoursSpentTotal !== "0h 00m" && (
                <rect x="330" y="20" width="40" height="130" rx="12" fill="#eff6ff" />
              )}

              <path
                d={stats.hoursSpentTotal && stats.hoursSpentTotal !== "0h 00m"
                  ? `M 10 100 
                     C 60 90, 80 40, 130 50 
                     C 170 58, 200 115, 250 110 
                     C 290 105, 310 25, 350 35 
                     C 390 45, 430 110, 480 95 
                     C 520 85, 550 105, 590 100 
                     L 590 150 L 10 150 Z`
                  : "M 10 120 L 590 120 L 590 150 L 10 150 Z"}
                fill="url(#waveGradient)"
              />

              <path
                d={stats.hoursSpentTotal && stats.hoursSpentTotal !== "0h 00m"
                  ? `M 10 100 
                     C 60 90, 80 40, 130 50 
                     C 170 58, 200 115, 250 110 
                     C 290 105, 310 25, 350 35 
                     C 390 45, 430 110, 480 95 
                     C 520 85, 550 105, 590 100`
                  : "M 10 120 L 590 120"}
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {stats.hoursSpentTotal && stats.hoursSpentTotal !== "0h 00m" && (
                <>
                  <circle cx="350" cy="35" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx="350" cy="35" r="9" stroke="#2563eb" strokeOpacity="0.3" strokeWidth="2" />
                </>
              )}
            </svg>

            {/* Day Labels Strip */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-2 pt-1">
              {dayLabels.map((day, idx) => (
                <span
                  key={day}
                  className={
                    idx === 4
                      ? "font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md"
                      : ""
                  }
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Chart: Performance Gauge */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full text-left">
            <h2 className="text-sm font-bold text-slate-800">
              {user.role === "TEACHER"
                ? (locale === "en" ? "Attendance & Validation" : "Assiduité & Validation")
                : user.role === "ADMIN"
                ? (locale === "en" ? "Compliance & Dispute Rate" : "Conformité & Résolution")
                : t("dashboard.performance", "Progression")}
            </h2>
          </div>

          <div className="relative flex flex-col items-center justify-center pt-2">
            <svg className="w-40 h-28 overflow-visible" viewBox="0 0 160 100">
              <path
                d="M 20 90 A 60 60 0 0 1 140 90"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d="M 20 90 A 60 60 0 0 1 140 90"
                fill="none"
                stroke="#2563eb"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 * (1 - stats.performancePercent / 100)}
              />
            </svg>

            <div className="absolute bottom-2 text-center">
              <span className="text-2xl font-black text-slate-800">
                {stats.performancePercent}%
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {t("dashboard.completed", "Complété")}
              </span>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {user.role === "TEACHER"
                ? stats.completed > 0
                  ? (locale === "en" ? `${stats.performancePercent}% of your sessions confirmed without delay` : `${stats.performancePercent}% de vos séances sont validées sans contestation`)
                  : (locale === "en" ? "No tutoring sessions delivered yet." : "Aucune séance dispensée pour le moment.")
                : user.role === "ADMIN"
                ? (locale === "en" ? `${stats.performancePercent}% platform compliance with Guinean educational SRD` : `${stats.performancePercent}% de conformité plateforme avec les règles SRD V2.0`)
                : stats.completed > 0
                ? t("dashboard.goalNote", "Votre objectif mensuel est en bonne voie !")
                : (locale === "en" ? "No completed sessions yet. Analytics will appear after your first lesson." : "Aucune séance validée pour le moment. Vos métriques apparaîtront dès votre premier cours.")}
            </p>
            <button
              type="button"
              onClick={() => setShowPerformanceModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white font-bold text-xs shadow-md shadow-blue-900/10 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              {t("dashboard.moreDetails", "Plus de détails")}
            </button>
          </div>
        </div>

      </div>

      {/* 4. Operational Banner Tailored by Role */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800">
          {user.role === "TEACHER"
            ? t("dashboard.teacherAssignmentBadge", "Prochain cours à dispenser")
            : user.role === "ADMIN"
            ? (locale === "en" ? "Priority Dossier to Review" : "Dossier prioritaire à instruire")
            : (locale === "en" ? "Next Scheduled Lesson" : "Prochaine séance programmée")}
        </h2>

        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/30 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              {user.role === "TEACHER" ? (
                <BookOpen className="w-7 h-7 text-indigo-500" />
              ) : user.role === "ADMIN" ? (
                <FileCheck className="w-7 h-7 text-amber-500" />
              ) : (
                <ClipboardCheck className="w-7 h-7 text-indigo-500" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {upcomingClass
                  ? upcomingClass.title
                  : user.role === "TEACHER"
                  ? (locale === "en" ? "No upcoming tutoring sessions" : "Aucune séance planifiée")
                  : user.role === "ADMIN"
                  ? (featuredTeacherApplication
                      ? `${locale === "en" ? "Review Candidate:" : "Validation Enseignant :"} ${featuredTeacherApplication.name}`
                      : (locale === "en" ? "All teacher applications reviewed" : "Tous les dossiers enseignants ont été traités"))
                  : (locale === "en" ? "No scheduled session yet" : "Aucune séance programmée")}
              </h3>
              <p className="text-xs text-slate-500">
                {upcomingClass
                  ? `${upcomingClass.scheduledText} • ${upcomingClass.participant}${upcomingClass.locationText ? ` • ${upcomingClass.locationText}` : ""}`
                  : user.role === "TEACHER"
                  ? (locale === "en"
                      ? "When a student is matched and a lesson is scheduled, it will appear here."
                      : "Dès qu'une demande est validée et qu'un cours est planifié, il apparaîtra ici.")
                  : user.role === "ADMIN"
                  ? (featuredTeacherApplication
                      ? `${featuredTeacherApplication.degrees} • ${featuredTeacherApplication.subject} • ${featuredTeacherApplication.city}`
                      : (locale === "en" ? "No dossiers waiting in pending queue." : "Aucun dossier en attente dans la file d'attente."))
                  : (locale === "en" ? "Create a tutoring request to connect with qualified teachers." : "Créez une demande de cours pour être mis en relation avec des enseignants certifiés.")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                {user.role === "TEACHER"
                  ? (locale === "en" ? "85% Earnings" : "Rémunération 85%")
                  : user.role === "ADMIN"
                  ? (locale === "en" ? "Priority" : "Priorité")
                  : t("dashboard.duration", "Durée")}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {upcomingClass
                  ? upcomingClass.rateOrEarningsText
                  : user.role === "TEACHER"
                  ? "0 GNF"
                  : user.role === "ADMIN"
                  ? (locale === "en" ? "High (< 24h)" : "Haute (< 24h)")
                  : "00 h 00 m"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {user.role === "TEACHER" ? (
                upcomingClass ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowActionModal("studentCard")}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
                    >
                      {locale === "en" ? "Student Profile" : "Fiche élève"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowActionModal("join")}
                      className="px-5 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-sm shadow-blue-900/15 transition-all cursor-pointer transform hover:-translate-y-0.5"
                    >
                      {locale === "en" ? "Start Lesson" : "Démarrer le cours"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/teacher/onboarding"
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>{locale === "en" ? "Manage Profile & Availability" : "Profil & Disponibilités"}</span>
                  </Link>
                )
              ) : user.role === "ADMIN" ? (
                <>
                  <Link
                    href={
                      featuredTeacherApplication
                        ? `/admin/verifications/${featuredTeacherApplication.id}`
                        : "/admin/verifications"
                    }
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#16385c]" />
                    <span>{locale === "en" ? "Review Dossier" : "Examiner le dossier"}</span>
                  </Link>
                  <Link
                    href="/admin/verifications"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-500/25 transition-all inline-flex items-center gap-1.5"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>{locale === "en" ? "Verification Queue" : "File de vérification"}</span>
                  </Link>
                </>
              ) : upcomingClass ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowActionModal("reschedule")}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
                  >
                    {locale === "en" ? "Reschedule" : "Reprogrammer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowActionModal("join")}
                    className="px-5 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-sm shadow-blue-900/15 transition-all cursor-pointer transform hover:-translate-y-0.5"
                  >
                    {locale === "en" ? "Join Lesson" : "Rejoindre le cours"}
                  </button>
                </>
              ) : (
                <Link
                  href="/parent/requests"
                  className="px-5 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-sm shadow-blue-900/15 transition-all cursor-pointer transform hover:-translate-y-0.5 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Tutoring Requests" : "Demandes de cours"}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Course / Operational List Tailored by Role */}
      <div id="courses" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              {coursesSectionTitle}
            </h2>
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">
              {filteredCourses.length}
            </span>
          </div>

          <a
            href="#courses"
            className="text-xs text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-0.5"
          >
            <span>{t("dashboard.viewAll", "Voir tout")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-2.5">
          {filteredCourses.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
              {user.role === "TEACHER"
                ? (locale === "en"
                    ? "No active classes or assigned students yet. Your verified tutoring matches will appear here."
                    : "Aucune classe active ni élève assigné pour le moment. Vos cours validés apparaîtront ici.")
                : (locale === "en"
                    ? "No items match your search query."
                    : "Aucun élément ne correspond à votre recherche.")}
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{course.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      {course.lessonsCount} {t("dashboard.sessionsPlanned", "séances prévues")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-72 justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-700 w-10 text-right">
                    {course.progressPercent}%
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedCourseModal(course)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {t("dashboard.continue", "Consulter")}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Performance Breakdown */}
      {showPerformanceModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  {t("dashboard.performanceDetailsTitle", "Détails de la performance académique")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPerformanceModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {user.role === "TEACHER"
                ? (locale === "en"
                    ? "Your sessions are rated 4.9/5 by parents. 94% of sessions are confirmed within 2 hours of completion."
                    : "Vos cours sont notés 4.9/5 par les parents d'élèves. 94% des séances sont validées dans les 2 heures suivant la réalisation.")
                : user.role === "ADMIN"
                ? (locale === "en"
                    ? "All platform transactions are audited according to the strict 85% tutor / 15% platform escrow rule without arithmetic loss."
                    : "Toutes les transactions sont tracées selon la règle stricte 85% professeur / 15% plateforme sans perte arithmétique.")
                : t(
                    "dashboard.performanceDetailsDesc",
                    "Taux d'assiduité de 100%, 18 séances terminées avec succès et une moyenne estimée de 15.5/20."
                  )}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {user.role === "TEACHER"
                    ? (locale === "en" ? "Positive Ratings" : "Avis Positifs")
                    : (locale === "en" ? "Attendance" : "Assiduité")}
                </span>
                <span className="text-sm font-black text-slate-800">
                  {user.role === "TEACHER" ? "98%" : "100%"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {locale === "en" ? "Progress" : "Progression"}
                </span>
                <span className="text-sm font-black text-emerald-600">
                  {user.role === "TEACHER"
                    ? (locale === "en" ? "Top 5% in Conakry" : "Top 5% Conakry")
                    : "+3.2 pts"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPerformanceModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#16385c] text-white text-xs font-bold hover:bg-[#10243d] transition-colors cursor-pointer"
            >
              {t("dashboard.close", "Fermer")}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Reschedule / Student Card / Admin Review / Join */}
      {showActionModal === "reschedule" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <Calendar className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  {t("dashboard.rescheduleTitle", "Reprogrammer la séance")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t("dashboard.rescheduleDesc", "Choisissez un nouvel horaire en accord avec le professeur.")}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {locale === "en" ? "New Date" : "Nouvelle date"}
                </label>
                <input
                  type="date"
                  defaultValue="2026-05-26"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {locale === "en" ? "Time Slot" : "Créneau horaire"}
                </label>
                <select className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800">
                  <option>16h30 - 18h45</option>
                  <option>17h00 - 19h15</option>
                  <option>18h00 - 20h15</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t("dashboard.cancel", "Annuler")}
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(locale === "en" ? "Rescheduling request transmitted." : "Demande de reprogrammation transmise.");
                  setShowActionModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#16385c] text-white text-xs font-bold hover:bg-[#10243d] transition-colors cursor-pointer"
              >
                {t("dashboard.confirm", "Confirmer")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showActionModal === "join" && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <Video className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  {t("dashboard.joinVirtualRoom", "Salle de classe virtuelle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t("dashboard.joinVirtualRoomDesc", "La séance commencera dès que l'enseignant se connectera.")}
            </p>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {locale === "en"
                  ? "Microphone & Camera operational for your Monsieur Fanyi session."
                  : "Microphone & Caméra prêts pour la session Monsieur Fanyi."}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t("dashboard.cancel", "Annuler")}
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open("https://meet.google.com/new", "_blank");
                  setShowActionModal(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{t("dashboard.startSession", "Accéder à la visio")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showActionModal === "studentCard" && upcomingClass && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#16385c]">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  {locale === "en"
                    ? `Student Profile: ${upcomingClass.participant.replace(/^Élève : |^Student: /, "")}`
                    : `Fiche Élève : ${upcomingClass.participant.replace(/^Élève : |^Student: /, "")}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActionModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-800 block">
                  {upcomingClass.title}
                </span>
                <span className="text-slate-500 block">
                  {upcomingClass.scheduledText}
                </span>
                <span className="text-slate-500 block">
                  {upcomingClass.locationText || (locale === "en" ? "In-home (Conakry)" : "À domicile (Conakry)")}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800">
                <span className="font-semibold block">
                  {locale === "en"
                    ? `Remuneration: ${upcomingClass.rateOrEarningsText}`
                    : `Rémunération : ${upcomingClass.rateOrEarningsText}`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowActionModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#16385c] text-white text-xs font-bold hover:bg-[#122b49] transition-colors cursor-pointer"
            >
              {t("dashboard.close", "Fermer")}
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Course Syllabus */}
      {selectedCourseModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-600">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-extrabold text-sm text-slate-800">
                  {selectedCourseModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">
                  {locale === "en" ? "Overall Progress" : "Progression globale"}
                </span>
                <span className="font-bold text-slate-800">{selectedCourseModal.progressPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-400">
                  {locale === "en" ? "Scheduled Sessions" : "Séances planifiées"}
                </span>
                <span className="font-bold text-slate-800">
                  {selectedCourseModal.lessonsCount} {locale === "en" ? "sessions" : "cours"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">
                  {locale === "en" ? "Financial Rule" : "Règle financière"}
                </span>
                <span className="font-bold text-emerald-600">
                  {locale === "en" ? "85% Tutor / 15% Platform Share" : "Part 85% Professeur / 15% Plateforme"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCourseModal(null)}
              className="w-full py-2.5 rounded-xl bg-[#16385c] text-white text-xs font-bold hover:bg-[#122b49] transition-colors cursor-pointer"
            >
              {t("dashboard.close", "Fermer")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
