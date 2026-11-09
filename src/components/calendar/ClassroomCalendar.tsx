"use client";

import React, { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
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
  Video,
  Eye,
  CheckCircle2,
  XCircle,
  CalendarDays,
  LayoutGrid,
  List,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LessonAttendance, SessionStatus, UserRole } from "@prisma/client";
import {
  CalendarSessionItem,
  SessionDetailModal,
} from "./SessionDetailModal";
import { RescheduleSessionModal } from "./RescheduleSessionModal";
import { CancelSessionModal } from "./CancelSessionModal";
import { AttendanceRecordModal } from "./AttendanceRecordModal";
import {
  ClassroomOption,
  SchedulePackageModal,
} from "./SchedulePackageModal";

interface ClassroomCalendarProps {
  initialSessions: CalendarSessionItem[];
  classrooms: ClassroomOption[];
  userRole: UserRole;
  userFullName: string;
  initialClassroomId?: string;
}

export function ClassroomCalendar({
  initialSessions,
  classrooms,
  userRole,
  userFullName,
  initialClassroomId,
}: ClassroomCalendarProps) {
  const { t, locale } = useTranslation();

  const [sessions, setSessions] = useState<CalendarSessionItem[]>(initialSessions);
  const [viewMode, setViewMode] = useState<"month" | "week" | "list">("month");

  // Current calendar pivot date
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Filters
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    initialClassroomId && classrooms.some((c) => c.id === initialClassroomId)
      ? initialClassroomId
      : "ALL"
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedSession, setSelectedSession] = useState<CalendarSessionItem | null>(null);
  const [reschedulingSession, setReschedulingSession] = useState<CalendarSessionItem | null>(null);
  const [cancellingSession, setCancellingSession] = useState<CalendarSessionItem | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<CalendarSessionItem | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Month navigation
  const prevPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "week") {
        d.setUTCDate(d.getUTCDate() - 7);
      } else {
        d.setUTCMonth(d.getUTCMonth() - 1);
      }
      return d;
    });
  };

  const nextPeriod = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "week") {
        d.setUTCDate(d.getUTCDate() + 7);
      } else {
        d.setUTCMonth(d.getUTCMonth() + 1);
      }
      return d;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (selectedClassroomId !== "ALL" && s.classroomId !== selectedClassroomId) {
        return false;
      }
      if (selectedStatus !== "ALL" && s.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSub = (s.classroom?.subjectName || "").toLowerCase().includes(q);
        const matchStud = (s.classroom?.student?.fullName || "").toLowerCase().includes(q);
        const matchTeach = (s.classroom?.teacherProfile?.user?.fullName || "").toLowerCase().includes(q);
        return matchSub || matchStud || matchTeach;
      }
      return true;
    });
  }, [sessions, selectedClassroomId, selectedStatus, searchQuery]);

  // Calendar stats
  const totalPlanned = filteredSessions.length;
  const completedCount = filteredSessions.filter(
    (s) => s.status === "TEACHER_COMPLETED" || s.status === "PARENT_APPROVED"
  ).length;
  const pendingPaymentCount = filteredSessions.filter((s) => !s.isFunded && s.status !== "CANCELLED").length;
  const cancelledCount = filteredSessions.filter((s) => s.status === "CANCELLED").length;

  // Month Grid Computation
  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth(); // 0-indexed

  const monthTitle = currentDate.toLocaleDateString(locale === "en" ? "en-US" : "fr-GN", {
    month: "long",
    year: "numeric",
    timeZone: "Africa/Conakry",
  });

  const monthGridDays = useMemo(() => {
    // First day of month
    const firstDay = new Date(Date.UTC(year, month, 1));
    // Day of week: 0 = Sunday, 1 = Monday... We want Monday = 0
    let startDayOfWeek = firstDay.getUTCDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    // Days in current month
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

    // Days in previous month
    const daysInPrevMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const days: {
      date: Date;
      dateNumber: number;
      isCurrentMonth: boolean;
      dateKey: string;
    }[] = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const d = new Date(Date.UTC(year, month - 1, dNum));
      days.push({
        date: d,
        dateNumber: dNum,
        isCurrentMonth: false,
        dateKey: d.toISOString().slice(0, 10),
      });
    }

    // Current month days
    for (let dNum = 1; dNum <= daysInMonth; dNum++) {
      const d = new Date(Date.UTC(year, month, dNum));
      days.push({
        date: d,
        dateNumber: dNum,
        isCurrentMonth: true,
        dateKey: d.toISOString().slice(0, 10),
      });
    }

    // Next month padding to fill complete weeks (multiple of 7)
    const remainder = days.length % 7;
    if (remainder > 0) {
      const fillCount = 7 - remainder;
      for (let dNum = 1; dNum <= fillCount; dNum++) {
        const d = new Date(Date.UTC(year, month + 1, dNum));
        days.push({
          date: d,
          dateNumber: dNum,
          isCurrentMonth: false,
          dateKey: d.toISOString().slice(0, 10),
        });
      }
    }

    return days;
  }, [year, month]);

  // Map sessions by dateKey YYYY-MM-DD
  const sessionsByDate = useMemo(() => {
    const map: Record<string, CalendarSessionItem[]> = {};
    for (const s of filteredSessions) {
      const dKey = s.scheduledStart.slice(0, 10);
      if (!map[dKey]) map[dKey] = [];
      map[dKey].push(s);
    }
    return map;
  }, [filteredSessions]);

  const todayKey = new Date().toISOString().slice(0, 10);

  const dayHeaders = [
    locale === "en" ? "Mon" : "Lun",
    locale === "en" ? "Tue" : "Mar",
    locale === "en" ? "Wed" : "Mer",
    locale === "en" ? "Thu" : "Jeu",
    locale === "en" ? "Fri" : "Ven",
    locale === "en" ? "Sat" : "Sam",
    locale === "en" ? "Sun" : "Dim",
  ];

  // Callback handlers for modal updates
  const handleSessionUpdated = (updatedSession: CalendarSessionItem) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === updatedSession.id ? updatedSession : s))
    );
    if (selectedSession && selectedSession.id === updatedSession.id) {
      setSelectedSession(updatedSession);
    }
    setReschedulingSession(null);
    setCancellingSession(null);
    setAttendanceSession(null);
  };

  const handleBatchPlanned = (data: { sessions: CalendarSessionItem[] }) => {
    if (data.sessions && data.sessions.length > 0) {
      const hydrated: CalendarSessionItem[] = data.sessions.map((sess) => {
        if (sess.classroom?.subjectName) return sess;
        const matchingClass = classrooms.find((c) => c.id === sess.classroomId);
        return {
          ...sess,
          classroom: sess.classroom || {
            id: sess.classroomId,
            subjectName: matchingClass?.subjectName || "Séance de cours",
            mode: "HOME" as any,
            student: {
              id: "",
              fullName: matchingClass?.studentName || "Élève",
              gradeLevel: "",
              parent: { id: "", user: { fullName: "", phoneNumber: "" } },
            },
            teacherProfile: {
              id: "",
              user: { fullName: matchingClass?.teacherName || "Tuteur", phoneNumber: "", email: "" },
            },
          },
        };
      });
      setSessions((prev) => [...prev, ...hydrated]);
    }
    setShowScheduleModal(false);
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                userRole === "TEACHER"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : userRole === "PARENT"
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {userRole === "TEACHER"
                ? locale === "en"
                  ? "Teacher Space"
                  : "Espace Enseignant"
                : userRole === "PARENT"
                ? locale === "en"
                  ? "Parent Space"
                  : "Espace Famille"
                : locale === "en"
                ? "Admin Console"
                : "Console d'Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Classroom Calendar & Sessions" : "Calendrier des Cours & Séances"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en" ? "Tutoring Schedule & Lessons" : "Calendrier & Emploi du Temps des Cours"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Accurate session planning, conflict detection, deterministic GNF allocation, and attendance records."
              : "Planification des séances, prévention des conflits d'horaires, répartition exacte en GNF et émargement des cours."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {classrooms.some((c) => c.remainingToSchedule > 0) && (
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#e59a38]" />
              <span>{locale === "en" ? "Plan Sessions" : "Planifier des séances"}</span>
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            {locale === "en" ? "Total Sessions" : "Total Séances"}
          </span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">{totalPlanned}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {locale === "en" ? "In selected range" : "Toutes classes confondues"}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="truncate">{locale === "en" ? "Pending Payment" : "Attente de Paiement"}</span>
          </span>
          <span className="text-2xl font-bold text-amber-800 mt-1 block">{pendingPaymentCount}</span>
          <span className="text-[11px] text-amber-600 mt-1 block">
            {locale === "en" ? "Prepayment required" : "Prépaiement parent requis"}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">{locale === "en" ? "Delivered / Validated" : "Dispensées / Validées"}</span>
          </span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">{completedCount}</span>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            {locale === "en" ? "With attendance record" : "Émargement enregistré"}
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <XCircle className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{locale === "en" ? "Cancelled" : "Annulées"}</span>
          </span>
          <span className="text-2xl font-bold text-slate-700 mt-1 block">{cancelledCount}</span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {locale === "en" ? "History preserved" : "Traçabilité conservée"}
          </span>
        </div>
      </div>

      {/* 3. Toolbar & Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              title={locale === "en" ? "Previous" : "Précédent"}
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              {locale === "en" ? "Today" : "Aujourd'hui"}
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              title={locale === "en" ? "Next" : "Suivant"}
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            <span className="font-extrabold text-sm sm:text-base text-slate-800 ml-2 capitalize">
              {monthTitle}
            </span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "month"
                    ? "bg-white text-[#16385c] shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Month" : "Mois"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === "list"
                    ? "bg-white text-[#16385c] shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Upcoming" : "Liste à venir"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-slate-100">
          {/* Classroom Dropdown */}
          <div className="flex-1">
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-hidden"
            >
              <option value="ALL">
                {locale === "en" ? "All Classrooms & Subjects" : "Toutes les matières & classes"}
              </option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c?.subjectName || "Cours"} — {c?.studentName || "Élève"} ({c?.teacherName || "Tuteur"})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "ALL", label: locale === "en" ? "All" : "Toutes" },
              { id: "SCHEDULED", label: locale === "en" ? "Scheduled" : "Planifiées" },
              { id: "RESCHEDULED", label: locale === "en" ? "Rescheduled" : "Reportées" },
              { id: "TEACHER_COMPLETED", label: locale === "en" ? "Completed" : "Dispensées" },
              { id: "CANCELLED", label: locale === "en" ? "Cancelled" : "Annulées" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? "bg-[#16385c] text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Main Calendar Content */}
      {viewMode === "month" ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-[11px] font-bold text-slate-400 py-3 uppercase tracking-wider">
            {dayHeaders.map((dh, i) => (
              <div key={i}>{dh}</div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 border-b border-slate-100">
            {monthGridDays.map((dayItem, idx) => {
              const daySessions = sessionsByDate[dayItem.dateKey] || [];
              const isToday = dayItem.dateKey === todayKey;

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                    dayItem.isCurrentMonth ? "bg-white hover:bg-slate-50/40" : "bg-slate-50/30 text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? "bg-[#16385c] text-white shadow-2xs"
                          : dayItem.isCurrentMonth
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {dayItem.dateNumber}
                    </span>
                    {daySessions.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {daySessions.length} {locale === "en" ? "sess." : "cours"}
                      </span>
                    )}
                  </div>

                  {/* Sessions Pills in Day Cell */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-24 [scrollbar-width:none]">
                    {daySessions.map((sess) => {
                      const timeStr = new Date(sess.scheduledStart).toLocaleTimeString("fr-GN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Africa/Conakry",
                      });

                      const isPending = !sess.isFunded;
                      const isCancelled = sess.status === "CANCELLED";

                      return (
                        <button
                          key={sess.id}
                          type="button"
                          onClick={() => setSelectedSession(sess)}
                          className={`w-full text-left p-1.5 rounded-lg border text-[11px] font-semibold transition-all block truncate ${
                            isCancelled
                              ? "bg-slate-100 text-slate-400 line-through border-slate-200"
                              : isPending
                              ? "bg-amber-50/80 text-amber-900 border-amber-200 hover:bg-amber-100/70"
                              : sess.status === "RESCHEDULED"
                              ? "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
                              : "bg-blue-50/80 text-[#16385c] border-blue-200 hover:bg-blue-100"
                          }`}
                          title={`${sess.classroom?.subjectName || "Cours"} (${timeStr})`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold truncate">{sess.classroom?.subjectName || "Cours"}</span>
                            <span className="text-[10px] opacity-75 shrink-0">{timeStr}</span>
                          </div>
                          {isPending && (
                            <span className="block text-[9px] text-amber-700 truncate font-normal">
                              {locale === "en" ? "Pending payment" : "Attente paiement"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Upcoming / List View */
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                {locale === "en" ? "No scheduled sessions found" : "Aucune séance planifiée"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {locale === "en"
                  ? "No sessions match the selected classroom or filter criteria."
                  : "Aucune séance ne correspond aux filtres sélectionnés. Utilisez le bouton « Planifier des séances » pour établir le calendrier."}
              </p>
            </div>
          ) : (
            filteredSessions.map((sess) => {
              const startD = new Date(sess.scheduledStart);
              const endD = new Date(sess.scheduledEnd);
              const dateStr = startD.toLocaleDateString(locale === "en" ? "en-US" : "fr-GN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Africa/Conakry",
              });
              const timeStr = `${startD.toLocaleTimeString("fr-GN", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Africa/Conakry",
              })} — ${endD.toLocaleTimeString("fr-GN", {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Africa/Conakry",
              })}`;

              const isPending = !sess.isFunded;
              const isCancelled = sess.status === "CANCELLED";

              return (
                <div
                  key={sess.id}
                  className={`p-4 sm:p-5 rounded-2xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs ${
                    isCancelled
                      ? "opacity-60 border-slate-200"
                      : isPending
                      ? "border-amber-200 ring-1 ring-amber-500/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#16385c] flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      #{sess.sessionSequence}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {sess.classroom?.subjectName || "Séance de cours"}
                        </span>
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                            <span>{locale === "en" ? "Pending Payment" : "Attente de paiement"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{locale === "en" ? "Funded" : "Financée"}</span>
                          </span>
                        )}
                        {sess.status === "RESCHEDULED" && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Reportée
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="capitalize">{dateStr}</span>
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{timeStr}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {locale === "en" ? "Student:" : "Élève :"} {sess.classroom?.student?.fullName || "Élève"}
                        </span>
                        <span>•</span>
                        <span>
                          {locale === "en" ? "Tutor:" : "Tuteur :"} {sess.classroom?.teacherProfile?.user?.fullName || "Tuteur"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Allocated GNF & Inspect Button */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-right">
                      <span className="font-extrabold text-slate-900 block text-xs">
                        {formatGnf(sess.allocatedAmountGnf)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{sess.durationMinutes} min</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedSession(sess)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{locale === "en" ? "Details" : "Détails"}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          userRole={userRole}
          onClose={() => setSelectedSession(null)}
          onOpenReschedule={() => {
            setReschedulingSession(selectedSession);
            setSelectedSession(null);
          }}
          onOpenCancel={() => {
            setCancellingSession(selectedSession);
            setSelectedSession(null);
          }}
          onOpenAttendance={() => {
            setAttendanceSession(selectedSession);
            setSelectedSession(null);
          }}
        />
      )}

      {/* Reschedule Modal */}
      {reschedulingSession && (
        <RescheduleSessionModal
          session={reschedulingSession}
          onClose={() => setReschedulingSession(null)}
          onSuccess={handleSessionUpdated}
        />
      )}

      {/* Cancel Modal */}
      {cancellingSession && (
        <CancelSessionModal
          session={cancellingSession}
          onClose={() => setCancellingSession(null)}
          onSuccess={handleSessionUpdated}
        />
      )}

      {/* Attendance Modal */}
      {attendanceSession && (
        <AttendanceRecordModal
          session={attendanceSession}
          onClose={() => setAttendanceSession(null)}
          onSuccess={handleSessionUpdated}
        />
      )}

      {/* Batch Schedule Modal */}
      {showScheduleModal && (
        <SchedulePackageModal
          classrooms={classrooms}
          defaultClassroomId={selectedClassroomId !== "ALL" ? selectedClassroomId : undefined}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={handleBatchPlanned}
        />
      )}
    </div>
  );
}

