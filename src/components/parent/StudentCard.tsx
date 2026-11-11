"use client";

import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  School,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Sparkles,
  Archive,
  BarChart3,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  StudentRequestStatusInfo,
  deriveStudentRequestStatus,
} from "@/lib/requests/student-request-status";

export interface StudentCardData {
  id: string;
  fullName: string;
  gradeLevel: string;
  cycle?: string | null;
  customCycle?: string | null;
  schoolName?: string | null;
  dateOfBirth?: string | null;
  supportNeeds?: string | null;
  preferredSubjects?: string[];
  customSubject?: string | null;
  notes?: string | null;
  isArchived?: boolean;
  createdAt?: string;
  requestStatus?: StudentRequestStatusInfo;
  _count?: {
    tutoringRequests?: number;
    classrooms?: number;
  };
}

interface StudentCardProps {
  student: StudentCardData;
  onEdit?: (student: StudentCardData) => void;
  onDelete?: (student: StudentCardData) => void;
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  const { t, locale } = useTranslation();

  const cycleColors: Record<string, { bg: string; text: string; border: string }> = {
    PRIMAIRE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    COLLEGE: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    LYCEE: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    SUPERIEUR: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    AUTRE: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  };

  const cycleStyle = student.cycle && cycleColors[student.cycle.toUpperCase()]
    ? cycleColors[student.cycle.toUpperCase()]
    : { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  return (
    <div
      className={`p-5 rounded-3xl bg-white border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between gap-4 ${
        student.isArchived
          ? "border-slate-200/60 opacity-75 bg-slate-50/50"
          : "border-slate-200/90 hover:border-blue-300"
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Header: Avatar, Name & Cycle Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#16385c] to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              {student.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 line-clamp-1">
                {student.fullName}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {student.gradeLevel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {student.isArchived && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Archive className="w-3 h-3" />
                <span>{t("parent.archivedBadge", "Archivé")}</span>
              </span>
            )}
            {student.cycle && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cycleStyle.bg} ${cycleStyle.text} ${cycleStyle.border}`}
              >
                {student.cycle === "AUTRE" && student.customCycle ? student.customCycle : student.cycle}
              </span>
            )}
          </div>
        </div>

        {/* School Name */}
        {student.schoolName && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="line-clamp-1">{student.schoolName}</span>
          </div>
        )}

        {/* Status Banner: Clear Distinction Between Registered and Tutoring Request */}
        {(() => {
          const statusInfo =
            student.requestStatus ||
            deriveStudentRequestStatus(
              student.id,
              student._count?.tutoringRequests ? [{ id: "temp", status: "PUBLISHED" }] : [],
              student._count?.classrooms ? [{ id: "temp", status: "ACTIVE" }] : []
            );

          return (
            <div
              className={`p-3 rounded-2xl border transition-all ${
                statusInfo.state === "MATCHED"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                  : statusInfo.state === "PUBLISHED"
                  ? "bg-indigo-50/80 border-indigo-200 text-indigo-900"
                  : statusInfo.state === "DRAFT"
                  ? "bg-amber-50/80 border-amber-200 text-amber-900"
                  : "bg-slate-50 border-slate-200 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      statusInfo.state === "MATCHED"
                        ? "bg-emerald-500 animate-pulse"
                        : statusInfo.state === "PUBLISHED"
                        ? "bg-indigo-500"
                        : statusInfo.state === "DRAFT"
                        ? "bg-amber-500"
                        : "bg-amber-600"
                    }`}
                  />
                  <span className="font-bold text-xs truncate">
                    {locale === "en" ? statusInfo.labelEn : statusInfo.labelFr}
                  </span>
                </div>

                {statusInfo.state === "NO_REQUEST" && (
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md shrink-0 border border-amber-200">
                    {locale === "en" ? "Action required" : "Action requise"}
                  </span>
                )}
              </div>

              <p className="mt-1 text-[11px] opacity-80 leading-relaxed line-clamp-2">
                {locale === "en" ? statusInfo.descriptionEn : statusInfo.descriptionFr}
              </p>

              {/* Dedicated direct CTA button right inside the status box */}
              <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between gap-2">
                <Link
                  href={statusInfo.actionHref}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    statusInfo.state === "NO_REQUEST"
                      ? "bg-[#122b49] text-white hover:bg-[#1a3d66]"
                      : statusInfo.state === "DRAFT"
                      ? "bg-amber-600 text-white hover:bg-amber-700"
                      : statusInfo.state === "PUBLISHED"
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
                  <span>{locale === "en" ? statusInfo.actionLabelEn : statusInfo.actionLabelFr}</span>
                </Link>

                <span className="text-[10px] opacity-70 font-semibold shrink-0">
                  {statusInfo.activeRequestsCount > 0
                    ? `${statusInfo.activeRequestsCount} ${locale === "en" ? "request(s)" : "demande(s)"}`
                    : (locale === "en" ? "0 request" : "0 demande")}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Preferred Subjects Chips */}
        {student.preferredSubjects && student.preferredSubjects.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t("parent.preferredSubjects", "Matières cibles :")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {student.preferredSubjects.slice(0, 3).map((sub, idx) => {
                const isCustom = sub === "Autre" && student.customSubject;
                return (
                  <span
                    key={idx}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    {isCustom ? `Autre (${student.customSubject})` : sub}
                  </span>
                );
              })}
              {student.preferredSubjects.length > 3 && (
                <span className="text-[10px] font-bold text-slate-400 self-center">
                  +{student.preferredSubjects.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Support Needs / Goals Excerpt */}
        {student.supportNeeds && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
            <span className="font-semibold text-slate-700 block text-[11px] mb-0.5">
              {t("parent.supportNeeds", "Besoins pédagogiques :")}
            </span>
            <p className="line-clamp-2 text-[11px] leading-relaxed">
              {student.supportNeeds}
            </p>
          </div>
        )}
      </div>

      {/* Card Footer: View, Edit, and Delete/Archive Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={`/parent/requests?studentId=${student.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors shrink-0"
            title={locale === "en" ? "Tutoring Requests" : "Demandes de cours"}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-600" />
            <span>{locale === "en" ? "Requests" : "Demandes"}</span>
          </Link>

          <Link
            href={`/parent/children/${student.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{t("parent.viewDossier", "Consulter la fiche")}</span>
          </Link>

          <Link
            href={`/parent/students/${student.id}/progress`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors shrink-0"
            title={locale === "en" ? "Digital Progress Book" : "Carnet de progression"}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>{locale === "en" ? "Progress" : "Carnet"}</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(student)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title={t("parent.editDossier", "Modifier")}
              aria-label={t("parent.editDossier", "Modifier")}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && !student.isArchived && (
            <button
              type="button"
              onClick={() => onDelete(student)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title={t("parent.archiveDossier", "Archiver")}
              aria-label={t("parent.archiveDossier", "Archiver")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
