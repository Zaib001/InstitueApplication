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
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface StudentCardData {
  id: string;
  fullName: string;
  gradeLevel: string;
  cycle?: string | null;
  schoolName?: string | null;
  dateOfBirth?: string | null;
  supportNeeds?: string | null;
  preferredSubjects?: string[];
  notes?: string | null;
  isArchived?: boolean;
  createdAt?: string;
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
                {student.cycle}
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

        {/* Preferred Subjects Chips */}
        {student.preferredSubjects && student.preferredSubjects.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t("parent.preferredSubjects", "Matières cibles :")}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {student.preferredSubjects.slice(0, 3).map((sub, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/60"
                >
                  {sub}
                </span>
              ))}
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
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link
          href={`/parent/children/${student.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{t("parent.viewDossier", "Consulter la fiche")}</span>
        </Link>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(student)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
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
              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
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
