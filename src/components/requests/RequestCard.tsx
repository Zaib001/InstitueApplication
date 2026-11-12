"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  Coins,
  ChevronRight,
  Edit2,
  Send,
  XCircle,
  Eye,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";
import { RequestStatus, TutoringMode } from "@prisma/client";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { useTranslation } from "@/lib/i18n";

export interface RequestCardData {
  id: string;
  subjectName: string;
  customSubject?: string | null;
  gradeLevelName: string;
  cycle?: string | null;
  customCycle?: string | null;
  mode: TutoringMode;
  frequency?: string | null;
  preferredSchedule?: string | null;
  budgetGnf: number;
  budgetType?: string | null;
  city: string;
  commune?: string | null;
  neighborhood?: string | null;
  learningGoals?: string | null;
  status: RequestStatus;
  publishedAt?: string | null;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    gradeLevel?: string;
    cycle?: string | null;
  };
  _count?: {
    applications?: number;
  };
}

interface RequestCardProps {
  request: RequestCardData;
  onEdit?: (req: RequestCardData) => void;
  onPublish?: (req: RequestCardData) => void;
  onCancel?: (req: RequestCardData) => void;
}

export function RequestCard({
  request,
  onEdit,
  onPublish,
  onCancel,
}: RequestCardProps) {
  const { locale } = useTranslation();

  const formattedBudget =
    new Intl.NumberFormat("fr-GN").format(request.budgetGnf) + " GNF";
  const budgetUnit =
    request.budgetType === "HOURLY"
      ? locale === "en"
        ? "/ hour"
        : "/ heure"
      : locale === "en"
      ? "/ month"
      : "/ mois";

  const displaySubject =
    request.subjectName === "Autre" && request.customSubject
      ? `Autre (${request.customSubject})`
      : request.subjectName;

  const displayCycle =
    request.cycle === "AUTRE" && request.customCycle
      ? request.customCycle
      : request.cycle;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 group">
      {/* Top Header: Student & Status */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#16385c] to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            {request.student.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-400">
                {locale === "en" ? "Student:" : "Élève :"}
              </span>
              <span className="font-extrabold text-sm text-slate-900">
                {request.student.fullName}
              </span>
              {displayCycle && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {displayCycle}
                </span>
              )}
            </div>
            <h3 className="font-bold text-base text-[#16385c] group-hover:text-blue-700 transition-colors">
              {displaySubject}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {request.gradeLevelName}
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto shrink-0 flex flex-col sm:items-end gap-1.5">
          <RequestStatusBadge status={request.status} />
          {request.status === "OPEN" && (
            (request._count?.applications || 0) > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Users className="w-3 h-3 text-emerald-600" />
                <span>
                  {(request._count?.applications || 0) === 1
                    ? locale === "en" ? "1 candidature reçue" : "1 candidature reçue"
                    : `${request._count?.applications} ${locale === "en" ? "candidatures reçues" : "candidatures reçues"}`}
                </span>
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 italic">
                {locale === "en" ? "No applications yet" : "Aucune candidature reçue pour le moment."}
              </span>
            )
          )}
        </div>
      </div>

      {/* Middle Specs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs border-t border-slate-100">
        {/* Mode */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            {locale === "en" ? "Format" : "Modalité"}
          </span>
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                request.mode === "HOME" ? "bg-amber-500" : "bg-blue-500"
              }`}
            />
            {request.mode === "HOME"
              ? locale === "en"
                ? "In-home"
                : "À domicile"
              : locale === "en"
              ? "Online"
              : "En ligne"}
          </span>
        </div>

        {/* Location */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            {locale === "en" ? "Zone / City" : "Lieu"}
          </span>
          <span className="font-bold text-slate-800 truncate block">
            {request.commune
              ? `${request.commune}${request.neighborhood ? ` (${request.neighborhood})` : ""}`
              : request.city}
          </span>
        </div>

        {/* Frequency */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
            {locale === "en" ? "Frequency" : "Rythme"}
          </span>
          <span className="font-bold text-slate-800 truncate block">
            {request.frequency === "2_WEEKLY"
              ? "2 séances / sem."
              : request.frequency === "3_WEEKLY"
              ? "3 séances / sem."
              : request.frequency === "1_WEEKLY"
              ? "1 séance / sem."
              : request.frequency === "WEEKEND"
              ? "Week-ends"
              : request.frequency === "INTENSIVE"
              ? "Stage intensif"
              : request.frequency || (locale === "en" ? "Flexible" : "Régulier")}
          </span>
        </div>

        {/* Budget */}
        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100/80 space-y-0.5">
          <span className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider block">
            {locale === "en" ? "Budget (GNF)" : "Budget indicatif"}
          </span>
          <span className="font-black text-emerald-900 block truncate">
            {formattedBudget} <span className="text-[10px] font-normal">{budgetUnit}</span>
          </span>
        </div>
      </div>

      {/* Learning Goals Excerpt if present */}
      {request.learningGoals && (
        <p className="text-xs text-slate-500 line-clamp-2 italic bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
          "{request.learningGoals}"
        </p>
      )}

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/parent/requests/${request.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16385c] hover:text-blue-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{locale === "en" ? "View Details" : "Détails de la demande"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>

          {(request._count?.applications || 0) > 0 && (
            <Link
              href={`/parent/requests/${request.id}#applications`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>
                {locale === "en" ? "View Applications" : "Voir les candidatures"} (
                {request._count?.applications})
              </span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {request.status === "DRAFT" && onPublish && (
            <button
              type="button"
              onClick={() => onPublish(request)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Publish" : "Publier"}</span>
            </button>
          )}

          {(request.status === "DRAFT" || request.status === "OPEN") && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(request)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{locale === "en" ? "Edit" : "Modifier"}</span>
            </button>
          )}

          {(request.status === "DRAFT" || request.status === "OPEN") && onCancel && (
            <button
              type="button"
              onClick={() => onCancel(request)}
              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title={locale === "en" ? "Cancel request" : "Annuler la demande"}
              aria-label={locale === "en" ? "Cancel request" : "Annuler la demande"}
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

