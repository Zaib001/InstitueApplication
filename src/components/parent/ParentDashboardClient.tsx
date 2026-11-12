"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Edit3,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Search,
  Bell,
  X,
  Award,
  RotateCcw,
  Percent,
  Calendar,
  Wallet,
  ChevronRight,
  PlusCircle,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { RequestStatus } from "@prisma/client";
import { RequestStatusBadge } from "@/components/requests/RequestStatusBadge";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { AuthenticatedUser } from "@/lib/auth/session";
import { StudentCardData } from "./StudentCard";
import { StudentList } from "./StudentList";
import { StudentProfileForm } from "./StudentProfileForm";
import { ParentProfileForm } from "./ParentProfileForm";
import { ConfirmStudentActionDialog } from "./ConfirmStudentActionDialog";
import { ProfileCompletionIndicator } from "./ProfileCompletionIndicator";
import { GradeLevelOption } from "./EducationLevelSelect";
import { SubjectOption } from "./SubjectSelector";

export interface ParentActionCenterItem {
  id: string;
  type: "PENDING_REPORT" | "UNSUBMITTED_REQUEST";
  priority: number;
  titleFr: string;
  titleEn: string;
  actionLabelFr: string;
  actionLabelEn: string;
  actionHref: string;
  sessionId?: string;
  studentName?: string;
  teacherName?: string;
  subjectName?: string;
  lessonDate?: string;
  submittedDate?: string;
  topicsExcerpt?: string | null;
  studentId?: string;
  gradeLevel?: string;
  descriptionFr?: string;
  descriptionEn?: string;
}

interface ParentDashboardClientProps {
  user: AuthenticatedUser;
  initialParentProfile: {
    id: string;
    city: string;
    address: string | null;
  };
  initialChildren: StudentCardData[];
  masterData: {
    gradeLevels: GradeLevelOption[];
    subjects: SubjectOption[];
  };
  stats?: {
    totalChildren: number;
    completedSessions: number;
    hoursSpentTotal: string;
    activeEscrowOrders: number;
  };
  upcomingSession?: {
    id: string;
    childName: string;
    subjectName: string;
    teacherName: string;
    scheduledText: string;
    locationText?: string;
  } | null;
  actionCenterItems?: ParentActionCenterItem[];
  requestsSummary?: {
    totalCount: number;
    recentRequests: Array<{
      id: string;
      subjectName: string;
      customSubject?: string | null;
      gradeLevelName: string;
      mode: string;
      budgetGnf: number;
      status: RequestStatus;
      createdAt: string;
      studentName: string;
      applicationsCount: number;
    }>;
  };
}

export function ParentDashboardClient({
  user,
  initialParentProfile,
  initialChildren,
  masterData,
  stats = {
    totalChildren: 0,
    completedSessions: 0,
    hoursSpentTotal: "0h 00m",
    activeEscrowOrders: 0,
  },
  upcomingSession,
  actionCenterItems = [],
  requestsSummary,
}: ParentDashboardClientProps) {
  const { t, locale } = useTranslation();

  const [childrenList, setChildrenList] = useState<StudentCardData[]>(initialChildren);
  const [parentProfile, setParentProfile] = useState({
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    city: initialParentProfile.city || "Conakry",
    address: initialParentProfile.address,
  });

  // Top header search & notification popup
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTimeRangeDropdown, setShowTimeRangeDropdown] = useState(false);
  const [timeRangeKey, setTimeRangeKey] = useState<"timeRange7Days" | "timeRange30Days">("timeRange7Days");

  // Modal dialog states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentCardData | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showParentProfileModal, setShowParentProfileModal] = useState(false);

  // Success Notification state
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  // Handle successful student creation
  const handleStudentCreated = (newStudent: StudentCardData) => {
    setChildrenList((prev) => [newStudent, ...prev]);
    setShowAddStudentModal(false);
    setBannerSuccess(
      locale === "en"
        ? `Student profile for "${newStudent.fullName}" created successfully.`
        : `Profil élève créé avec succès pour "${newStudent.fullName}".`
    );
    setTimeout(() => setBannerSuccess(null), 5000);
  };

  // Handle successful student edit
  const handleStudentUpdated = (updatedStudent: StudentCardData) => {
    setChildrenList((prev) =>
      prev.map((item) => (item.id === updatedStudent.id ? updatedStudent : item))
    );
    setEditingStudent(null);
    setBannerSuccess(
      locale === "en"
        ? `Student profile for "${updatedStudent.fullName}" updated successfully.`
        : `Fiche de "${updatedStudent.fullName}" mise à jour avec succès.`
    );
    setTimeout(() => setBannerSuccess(null), 5000);
  };

  // Handle student deletion or archival
  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/parent/children/${deletingStudent.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur lors de la suppression.");
      }

      if (json.action === "ARCHIVED") {
        setChildrenList((prev) =>
          prev.map((item) =>
            item.id === deletingStudent.id ? { ...item, isArchived: true } : item
          )
        );
        setBannerSuccess(
          locale === "en"
            ? `Student "${deletingStudent.fullName}" was archived to protect lesson records.`
            : `L'élève "${deletingStudent.fullName}" a été archivé pour conserver l'historique pédagogique.`
        );
      } else {
        setChildrenList((prev) => prev.filter((item) => item.id !== deletingStudent.id));
        setBannerSuccess(
          locale === "en"
            ? `Student profile "${deletingStudent.fullName}" was removed.`
            : `Profil élève "${deletingStudent.fullName}" supprimé.`
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
      setDeletingStudent(null);
      setTimeout(() => setBannerSuccess(null), 5000);
    }
  };

  // Handle parent profile update
  const handleParentProfileUpdated = (updated: {
    fullName: string;
    phoneNumber: string | null;
    city: string;
    address: string | null;
  }) => {
    setParentProfile((prev) => ({
      ...prev,
      fullName: updated.fullName,
      phoneNumber: updated.phoneNumber,
      city: updated.city,
      address: updated.address,
    }));
    setBannerSuccess(
      locale === "en"
        ? "Parent information updated successfully."
        : "Vos coordonnées ont été mises à jour avec succès."
    );
    setTimeout(() => setBannerSuccess(null), 5000);
  };

  const dayLabels =
    locale === "en"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const activeChildrenCount = childrenList.filter((c) => !c.isArchived).length;
  const noRequestCount = childrenList.filter(
    (c) => !c.isArchived && (!c.requestStatus || c.requestStatus.state === "NO_REQUEST")
  ).length;
  const inProgressCount = childrenList.filter(
    (c) => !c.isArchived && (c.requestStatus?.state === "PUBLISHED" || c.requestStatus?.state === "DRAFT")
  ).length;
  const matchedCount = childrenList.filter(
    (c) => !c.isArchived && c.requestStatus?.state === "MATCHED"
  ).length;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar: Title, Search, Notifications, Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            {t("parent.welcomeTitle", "Espace Famille & Enfants")}
          </h1>
          <p className="text-xs text-slate-400">
            {t(
              "parent.welcomeSub",
              "Suivez le parcours pédagogique, les cours et les progrès de vos enfants à Conakry"
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Search Pill */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("parent.searchPlaceholder", "Rechercher un enfant, une matière...")}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-slate-200/90 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
            />
          </div>

          {/* Universal Notification Bell */}
          <NotificationBell variant="light" />

          <LanguageSwitcher />
        </div>
      </div>

      {/* Success Notification Banner */}
      {bannerSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{bannerSuccess}</span>
        </div>
      )}

      {/* 2. Top 3 Metric Cards for Parent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Children */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              {locale === "en" ? "Registered Children" : "Enfants inscrits"}
            </span>
            <div className="text-lg font-black text-slate-800">
              {activeChildrenCount} {activeChildrenCount > 1 ? (locale === "en" ? "Children" : "Enfants") : (locale === "en" ? "Child" : "Enfant")}
            </div>
          </div>
        </div>

        {/* Metric 2: Completed Sessions */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              {locale === "en" ? "Completed Sessions" : "Séances délivrées"}
            </span>
            <div className="text-lg font-black text-slate-800">
              {stats.completedSessions} {locale === "en" ? "Sessions" : "Séances"}
            </div>
          </div>
        </div>

        {/* Metric 3: Escrow / Active Tutoring Protection */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              {locale === "en" ? "Escrow Protection" : "Séquestre Garanti"}
            </span>
            <div className="text-lg font-black text-slate-800">
              {stats.activeEscrowOrders > 0 ? (locale === "en" ? "1 Active Package" : "1 Forfait Actif") : (locale === "en" ? "Protected" : "Sécurisé")}
            </div>
          </div>
        </div>
      </div>

      {/* 2.5 Priority Action Center: "Actions à effectuer" & Status Breakdown */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-4 h-4 text-[#e59a38]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {locale === "en" ? "Action Center" : "Actions à effectuer"}
                </h2>
                {actionCenterItems.length > 0 ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {actionCenterItems.length} {locale === "en" ? "action(s) required" : "action(s) requise(s)"}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {locale === "en" ? "All up to date" : "À jour"}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {locale === "en"
                  ? "Priority tasks requiring your attention (lesson report approvals, tutoring requests)"
                  : "Tâches prioritaires nécessitant votre intervention (validation des comptes rendus, création des demandes)"}
              </p>
            </div>
          </div>

          {/* Children Summary Badges (Requirement 3) */}
          {activeChildrenCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>{noRequestCount} sans demande</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span>{inProgressCount} demande(s) en cours</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{matchedCount} attribué(s)</span>
              </span>
            </div>
          )}
        </div>

        {/* Action Items List */}
        {actionCenterItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionCenterItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border transition-all shadow-xs flex flex-col justify-between gap-3 ${
                  item.type === "PENDING_REPORT"
                    ? "bg-amber-50/50 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 border-amber-200/90 hover:border-amber-300"
                    : "bg-blue-50/50 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/30 border-blue-200/80 hover:border-blue-300"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          item.type === "PENDING_REPORT"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#122b49] text-white"
                        }`}
                      >
                        {item.type === "PENDING_REPORT" ? (
                          <FileCheck className="w-4 h-4 text-amber-700" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-[#e59a38]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400 truncate">
                          {item.type === "PENDING_REPORT"
                            ? (locale === "en" ? "Urgent: Lesson Review" : "Validation de séance • Prioritaire")
                            : (locale === "en" ? "Tutoring Request Needed" : "Demande de cours à créer")}
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 line-clamp-1">
                          {locale === "en" ? item.titleEn : item.titleFr}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${
                        item.type === "PENDING_REPORT"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {item.type === "PENDING_REPORT" ? "Urgent" : "Action"}
                    </span>
                  </div>

                  {/* Context Details */}
                  {item.type === "PENDING_REPORT" ? (
                    <div className="text-xs text-slate-600 space-y-1 bg-white/80 p-2.5 rounded-2xl border border-amber-100">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700">
                          Élève : <strong className="text-slate-900">{item.studentName}</strong>
                        </span>
                        <span className="text-slate-500">
                          Matière : <strong className="text-slate-800">{item.subjectName}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Professeur : <span className="font-medium text-slate-700">{item.teacherName}</span>
                      </div>
                      {item.topicsExcerpt && (
                        <p className="text-[11px] text-slate-600 italic line-clamp-1 border-t border-slate-100 pt-1">
                          &laquo; {item.topicsExcerpt} &raquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-2xl border border-blue-100">
                      {locale === "en" ? item.descriptionEn : item.descriptionFr}
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {item.type === "PENDING_REPORT"
                      ? (locale === "en" ? "Direct validation & payout release" : "Déblocage sécurisé de la rémunération")
                      : (locale === "en" ? "Fast teacher matching" : "Mise en relation certifiée")}
                  </span>

                  <Link
                    href={item.actionHref}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      item.type === "PENDING_REPORT"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "bg-[#122b49] hover:bg-[#1b3d66] text-white"
                    }`}
                  >
                    <span>{locale === "en" ? item.actionLabelEn : item.actionLabelFr}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-900 flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="font-bold block text-emerald-950">
                  {locale === "en" ? "All actions completed!" : "Toutes vos actions sont à jour"}
                </span>
                <span className="text-emerald-800 text-[11px]">
                  {locale === "en"
                    ? "No pending lesson reports or missing requests. Your family progress is on track."
                    : "Aucun compte rendu en attente de validation. Vos enfants disposent de demandes de cours actives ou de professeurs attribués."}
                </span>
              </div>
            </div>
            <Link
              href="/parent/children"
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-900 font-bold hover:bg-emerald-50 transition text-xs shrink-0 shadow-2xs"
            >
              {locale === "en" ? "Manage children" : "Gérer mes enfants"}
            </Link>
          </div>
        )}
      </div>

      {/* 3. Middle 2 Analytics Cards: Hours Chart & Completion Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Hours of Tutoring Received */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between relative">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {locale === "en" ? "Tutoring Hours Received" : "Heures de soutien dispensées"}
              </h2>
              <div className="text-xs text-slate-400 font-medium pt-0.5">
                {stats.hoursSpentTotal}
              </div>
            </div>

            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              {locale === "en" ? "Last 7 Days" : "7 derniers jours"}
            </span>
          </div>

          {/* Spline Wave Chart */}
          <div className="relative pt-4 pb-2">
            <div className="absolute top-2 left-[58%] -translate-x-1/2 bg-[#122b49] text-white px-3 py-1.5 rounded-xl shadow-lg text-[10px] flex items-center gap-2 z-10 pointer-events-none">
              <Clock className="w-3 h-3 text-[#e59a38]" />
              <div>
                <span className="font-semibold block">
                  {stats.completedSessions > 0
                    ? (locale === "en" ? "Hours Delivered" : "Heures Enregistrées")
                    : (locale === "en" ? "Tutoring Volume" : "Volume d'heures")}
                </span>
                <span className="text-[#e59a38] font-bold">{stats.hoursSpentTotal}</span>
              </div>
            </div>

            <svg
              className="w-full h-44 overflow-visible"
              viewBox="0 0 600 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="parentWaveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {stats.completedSessions > 0 && (
                <rect x="330" y="20" width="40" height="130" rx="12" fill="#eff6ff" />
              )}

              <path
                d={stats.completedSessions > 0
                  ? `M 10 100 
                     C 60 90, 80 40, 130 50 
                     C 170 58, 200 115, 250 110 
                     C 290 105, 310 25, 350 35 
                     C 390 45, 430 110, 480 95 
                     C 520 85, 550 105, 590 100 
                     L 590 150 L 10 150 Z`
                  : "M 10 120 L 590 120 L 590 150 L 10 150 Z"}
                fill="url(#parentWaveGrad)"
              />

              <path
                d={stats.completedSessions > 0
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

              {stats.completedSessions > 0 && (
                <>
                  <circle cx="350" cy="35" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx="350" cy="35" r="9" stroke="#2563eb" strokeOpacity="0.3" strokeWidth="2" />
                </>
              )}
            </svg>

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

        {/* Right Gauge: Learning Regularity & Feedback */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full text-left">
            <h2 className="text-sm font-bold text-slate-800">
              {locale === "en" ? "Attendance & Progression" : "Assiduité & Satisfaction"}
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
                strokeDashoffset={stats.completedSessions > 0 ? 0 : 188.5}
              />
            </svg>

            <div className="absolute bottom-2 text-center">
              <span className="text-2xl font-black text-slate-800">
                {stats.completedSessions > 0 ? "100%" : "0%"}
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                {locale === "en" ? "Validated Sessions" : "Séances Validées"}
              </span>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {stats.completedSessions > 0
                ? (locale === "en"
                  ? "100% of completed sessions approved with high satisfaction ratings."
                  : "Toutes les séances ont été validées sans retard avec d'excellents rapports pédagogiques.")
                : (locale === "en"
                  ? "No completed sessions yet. Metrics will update when your lessons take place."
                  : "Aucune séance validée pour le moment. Vos métriques s'actualiseront après vos premiers cours.")}
            </p>
            <a
              href="#children"
              className="block w-full py-2.5 px-4 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white font-bold text-xs shadow-md shadow-blue-900/10 transition-all cursor-pointer transform hover:-translate-y-0.5 text-center"
            >
              {locale === "en" ? "Manage Children Profiles" : "Gérer les fiches de mes enfants"}
            </a>
          </div>
        </div>
      </div>

      {/* 4. Operational Banner: Next Upcoming Session */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800">
          {locale === "en" ? "Next Scheduled Lesson" : "Prochaine séance programmée"}
        </h2>

        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/30 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <GraduationCap className="w-7 h-7 text-indigo-500" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {upcomingSession
                  ? `${upcomingSession.subjectName} (${upcomingSession.childName})`
                  : (locale === "en"
                    ? "No scheduled session yet"
                    : "Aucune séance programmée")}
              </h3>
              <p className="text-xs text-slate-500">
                {upcomingSession
                  ? `${upcomingSession.scheduledText} • Tuteur : ${upcomingSession.teacherName}${upcomingSession.locationText ? ` • ${upcomingSession.locationText}` : ""}`
                  : (locale === "en"
                    ? "Publish a tutoring request to connect with approved teachers in Conakry."
                    : "Publiez une demande de cours pour être mis en relation avec des professeurs agréés.")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                {locale === "en" ? "Duration" : "Durée"}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {upcomingSession ? "02 h 00 m" : "00 h 00 m"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="#children"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                {locale === "en" ? "Student Dossier" : "Fiche élève"}
              </a>
              <Link
                href="/parent/requests"
                className="px-4 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-sm shadow-blue-900/15 transition-all cursor-pointer transform hover:-translate-y-0.5 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Tutoring Requests" : "Demandes de cours"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Parent Info Card & Profile Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#e59a38] uppercase tracking-wider">
              {locale === "en" ? "Parent Information" : "Coordonnées Parent"}
            </span>
            <button
              type="button"
              onClick={() => setShowParentProfileModal(true)}
              className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              {t("parent.editDossier", "Modifier")}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold">
              <User className="w-4 h-4 text-[#16385c] shrink-0" />
              <span>{parentProfile.fullName}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{parentProfile.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {parentProfile.phoneNumber ||
                  (locale === "en" ? "No phone number set" : "Numéro non renseigné")}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {parentProfile.city}
                {parentProfile.address ? ` • ${parentProfile.address}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <ProfileCompletionIndicator
            hasPhone={Boolean(parentProfile.phoneNumber)}
            hasCity={Boolean(parentProfile.city)}
            childrenCount={childrenList.length}
          />
        </div>
      </div>

      {/* 6. Children Management Section */}
      <div id="children" className="pt-2">
        <StudentList
          childrenList={childrenList}
          onAddChild={() => setShowAddStudentModal(true)}
          onEditChild={(student) => setEditingStudent(student)}
          onDeleteChild={(student) => setDeletingStudent(student)}
        />
      </div>

      {/* 7. Parent Tutoring Requests Section */}
      <div id="requests" className="pt-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span>{locale === "en" ? "My Tutoring Requests" : "Mes Demandes de Soutien"}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {requestsSummary?.totalCount || 0}
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              {locale === "en"
                ? "Active requests for your children looking for verified tutors in Conakry"
                : "Demandes actives pour vos enfants à la recherche de professeurs vérifiés à Conakry"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/parent/requests"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <span>{locale === "en" ? "Manage all requests" : "Gérer mes demandes"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              href="/parent/requests"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>{locale === "en" ? "New Request" : " Créer une demande"}</span>
            </Link>
          </div>
        </div>

        {(!requestsSummary?.recentRequests || requestsSummary.recentRequests.length === 0) ? (
          <div className="p-8 rounded-3xl bg-white border border-slate-200/90 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-sm text-slate-800">
                {locale === "en" ? "No tutoring requests yet" : "Aucune demande de cours pour le moment"}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? "Publish a tutoring request for your child to start receiving verified teacher applications."
                  : "Publiez une demande de soutien pour votre enfant afin de recevoir les candidatures de professeurs vérifiés."}
              </p>
            </div>
            <Link
              href="/parent/requests"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4 text-[#e59a38]" />
              <span>{locale === "en" ? "Create Tutoring Request" : "Créer une première demande"}</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {requestsSummary.recentRequests.map((req) => (
              <Link
                key={req.id}
                href={`/parent/requests/${req.id}${req.applicationsCount > 0 ? "#applications" : ""}`}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all space-y-3 block group"
              >
                <div className="flex items-start justify-between gap-2">
                  <RequestStatusBadge status={req.status} />
                  <span className="text-[10px] text-slate-400">
                    {new Date(req.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-[#16385c] group-hover:text-blue-600 transition-colors line-clamp-1">
                    {req.customSubject ? `${req.customSubject} (${req.subjectName})` : req.subjectName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {req.studentName} • {req.gradeLevelName}
                  </p>
                </div>

                {/* Application Activity Display */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  {req.applicationsCount > 0 ? (
                    <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold text-[11px]">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {req.applicationsCount === 1
                          ? locale === "en" ? "1 application received" : "1 candidature reçue"
                          : `${req.applicationsCount} ${locale === "en" ? "applications received" : "candidatures reçues"}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      {locale === "en" ? "No applications yet" : "Aucune candidature reçue pour le moment."}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {new Intl.NumberFormat("fr-GN").format(req.budgetGnf)} GNF
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16385c] group-hover:text-blue-600 bg-slate-50 group-hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors">
                    <span>
                      {req.applicationsCount > 0
                        ? locale === "en" ? "View Applications" : "Voir les candidatures"
                        : locale === "en" ? "Details" : "Voir la demande"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddStudentModal && (
        <StudentProfileForm
          gradeLevels={masterData.gradeLevels}
          availableSubjects={masterData.subjects}
          onSaveSuccess={handleStudentCreated}
          onCancel={() => setShowAddStudentModal(false)}
        />
      )}

      {editingStudent && (
        <StudentProfileForm
          initialData={editingStudent}
          gradeLevels={masterData.gradeLevels}
          availableSubjects={masterData.subjects}
          onSaveSuccess={handleStudentUpdated}
          onCancel={() => setEditingStudent(null)}
        />
      )}

      {showParentProfileModal && (
        <ParentProfileForm
          initialData={parentProfile}
          onSaveSuccess={handleParentProfileUpdated}
          onCancel={() => setShowParentProfileModal(false)}
        />
      )}

      {deletingStudent && (
        <ConfirmStudentActionDialog
          student={deletingStudent}
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteStudent}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </div>
  );
}
