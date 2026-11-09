"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  GraduationCap,
  MapPin,
  Laptop,
  Home,
  Sparkles,
  Video,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  X,
  CalendarDays,
  FileText,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { LessonAttendance, SessionStatus, UserRole } from "@prisma/client";

export interface CalendarSessionItem {
  id: string;
  classroomId: string;
  packageId?: string | null;
  sessionSequence: number;
  title?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string | null;
  actualEnd?: string | null;
  durationMinutes: number;
  actualDurationMinutes?: number | null;
  attendanceStatus: LessonAttendance;
  attendanceNotes?: string | null;
  allocatedAmountGnf: number;
  platformCommissionGnf: number;
  teacherNetGnf: number;
  isFunded: boolean;
  status: SessionStatus;
  rescheduledFromStart?: string | null;
  rescheduledFromEnd?: string | null;
  rescheduleReason?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  classroom: {
    id: string;
    subjectName: string;
    mode: string;
    externalVideoUrl?: string | null;
    student: {
      id: string;
      fullName: string;
      gradeLevel?: string | null;
      parent: {
        id: string;
        user: { fullName: string; phoneNumber?: string | null };
      };
    };
    teacherProfile: {
      id: string;
      user: { fullName: string; phoneNumber?: string | null; email: string };
    };
  };
}

interface SessionDetailModalProps {
  session: CalendarSessionItem;
  userRole: UserRole;
  onClose: () => void;
  onOpenReschedule: () => void;
  onOpenCancel: () => void;
  onOpenAttendance: () => void;
}

export function SessionDetailModal({
  session,
  userRole,
  onClose,
  onOpenReschedule,
  onOpenCancel,
  onOpenAttendance,
}: SessionDetailModalProps) {
  const { t, locale } = useTranslation();

  const startDate = new Date(session.scheduledStart);
  const endDate = new Date(session.scheduledEnd);

  const formattedDate = startDate.toLocaleDateString(locale === "en" ? "en-US" : "fr-GN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Conakry",
  });

  const formattedTime = `${startDate.toLocaleTimeString("fr-GN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Conakry",
  })} — ${endDate.toLocaleTimeString("fr-GN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Conakry",
  })}`;

  const isCancelled = session.status === "CANCELLED";
  const isCompleted =
    session.status === "TEACHER_COMPLETED" || session.status === "PARENT_APPROVED";
  const canModify = !isCancelled && !isCompleted;
  const canRecordAttendance = (userRole === "TEACHER" || userRole === "ADMIN") && !isCancelled;

  const getAttendanceLabel = (att: LessonAttendance) => {
    switch (att) {
      case "PRESENT":
        return { label: locale === "en" ? "Present" : "Présent", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "ABSENT_STUDENT":
        return { label: locale === "en" ? "Absent (Student)" : "Absent (Élève)", cls: "bg-rose-50 text-rose-700 border-rose-200" };
      case "ABSENT_TEACHER":
        return { label: locale === "en" ? "Absent (Tutor)" : "Absent (Professeur)", cls: "bg-rose-50 text-rose-700 border-rose-200" };
      case "EXCUSED":
        return { label: locale === "en" ? "Excused" : "Absence Excusée", cls: "bg-amber-50 text-amber-700 border-amber-200" };
      case "LATE":
        return { label: locale === "en" ? "Late arrival" : "En retard", cls: "bg-purple-50 text-purple-700 border-purple-200" };
      default:
        return { label: att, cls: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const attMeta = getAttendanceLabel(session.attendanceStatus);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5 text-xs text-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#16385c]/10 text-[#16385c]">
                Séance #{session.sessionSequence}
              </span>
              {session.isFunded ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                  <span>{locale === "en" ? "Funded & Escrowed" : "Financée & Séquestrée"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                  <span>{locale === "en" ? "Pending Payment" : "En attente de paiement"}</span>
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
              {session.classroom?.subjectName || "Séance de cours"}
            </h3>
            <p className="text-[11px] text-slate-400 capitalize">{formattedDate}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Schedule & Duration Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#16385c]" />
              <span>Horaire prévu :</span>
            </span>
            <span className="font-bold text-slate-900">{formattedTime}</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
            <span className="text-slate-500">Durée prévue :</span>
            <span className="font-bold text-slate-900">{session.durationMinutes} minutes</span>
          </div>
          {session.actualDurationMinutes && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-emerald-800">
              <span className="font-semibold">Durée effective dispensée :</span>
              <span className="font-extrabold">{session.actualDurationMinutes} minutes</span>
            </div>
          )}
        </div>

        {/* Attendance Status */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-white">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Attendance" : "Statut de Présence"}
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${attMeta.cls}`}>
              {attMeta.label}
            </span>
          </div>

          {canRecordAttendance && (
            <button
              type="button"
              onClick={onOpenAttendance}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#16385c] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
            >
              {locale === "en" ? "Record Attendance" : "Pointer la présence"}
            </button>
          )}
        </div>

        {/* Participants & Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Student */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3 h-3 text-[#16385c]" />
              <span>{locale === "en" ? "Student" : "Élève"}</span>
            </span>
            <span className="font-bold text-slate-800 block text-xs truncate">
              {session.classroom?.student?.fullName || "Élève"}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              {session.classroom?.student?.gradeLevel || "Soutien scolaire"}
            </span>
          </div>

          {/* Teacher */}
          <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <User className="w-3 h-3 text-emerald-600" />
              <span>{locale === "en" ? "Tutor" : "Enseignant"}</span>
            </span>
            <span className="font-bold text-slate-800 block text-xs truncate">
              {session.classroom?.teacherProfile?.user?.fullName || "Enseignant"}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              {session.classroom?.teacherProfile?.user?.phoneNumber || session.classroom?.teacherProfile?.user?.email || "—"}
            </span>
          </div>
        </div>

        {/* Online Video Link Support */}
        {session.classroom?.mode === "ONLINE" && session.classroom?.externalVideoUrl && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Video className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-indigo-900 block truncate">Salle de visioconférence</span>
                <span className="text-[10px] text-indigo-600 block truncate">Lien de télé-enseignement officiel</span>
              </div>
            </div>
            <a
              href={session.classroom.externalVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shrink-0"
            >
              <span>Rejoindre</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Exact Financial Allocation Breakdown */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {locale === "en" ? "Allocated Session Value" : "Allocation Financière Déterministe"}
            </span>
            <span className="font-extrabold text-slate-800 text-xs">
              {formatGnf(session.allocatedAmountGnf)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px]">
            <div>
              <span className="text-slate-400 block">Commission plateforme (15%) :</span>
              <span className="font-bold text-blue-700">{formatGnf(session.platformCommissionGnf)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Part enseignant (85%) :</span>
              <span className="font-bold text-emerald-700">{formatGnf(session.teacherNetGnf)}</span>
            </div>
          </div>
        </div>

        {/* Reschedule Audit History */}
        {session.rescheduledFromStart && (
          <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 text-[11px] text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-600" />
              <span>Séance reprogrammée</span>
            </div>
            <p>
              Prévue initialement le{" "}
              {new Date(session.rescheduledFromStart).toLocaleDateString("fr-GN", { timeZone: "Africa/Conakry" })} à{" "}
              {new Date(session.rescheduledFromStart).toLocaleTimeString("fr-GN", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Conakry" })}.
            </p>
            {session.rescheduleReason && (
              <p className="italic text-purple-800">« {session.rescheduleReason} »</p>
            )}
          </div>
        )}

        {/* Cancellation Notice */}
        {session.status === "CANCELLED" && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Séance annulée</span>
            </div>
            {session.cancellationReason && (
              <p className="italic text-rose-800">Motif : « {session.cancellationReason} »</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div>
            {userRole === UserRole.TEACHER && session.status !== "CANCELLED" && (
              <Link
                href={`/teacher/reports?sessionId=${session.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>{locale === "en" ? "Lesson Report" : "Compte rendu"}</span>
              </Link>
            )}

            {userRole === UserRole.PARENT && (
              <Link
                href={`/parent/reports?sessionId=${session.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>{locale === "en" ? "Reports & Validation" : "Compte rendu & Validation"}</span>
              </Link>
            )}
          </div>

          {canModify && (
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onOpenCancel}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
              >
                {locale === "en" ? "Cancel Session" : "Annuler la séance"}
              </button>
              <button
                type="button"
                onClick={onOpenReschedule}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Reschedule Session" : "Reprogrammer"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

