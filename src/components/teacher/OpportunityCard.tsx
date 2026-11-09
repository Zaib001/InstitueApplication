"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send,
  Home,
  Monitor,
  Layers,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { MatchResult } from "@/lib/marketplace/matching";

export interface OpportunityItem {
  id: string;
  subjectId?: string | null;
  subjectName: string;
  customSubject?: string | null;
  cycle?: string | null;
  customCycle?: string | null;
  gradeLevelName: string;
  mode: string;
  frequency?: string | null;
  preferredSchedule?: string | null;
  sessionDurationMinutes: number;
  budgetGnf: number;
  budgetType: string;
  city: string;
  commune?: string | null;
  neighborhood?: string | null;
  learningGoals?: string | null;
  publishedAt: string;
  status: string;
  studentDisplay?: string;
  matchResult: MatchResult;
  hasApplied: boolean;
  applicationId?: string | null;
  applicationStatus?: string | null;
}

interface OpportunityCardProps {
  opportunity: OpportunityItem;
  isTeacherApproved: boolean;
}

export function OpportunityCard({ opportunity, isTeacherApproved }: OpportunityCardProps) {
  const { locale } = useTranslation();

  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "HOME":
      case "IN_HOME":
        return {
          label: locale === "en" ? "In-Home" : "À domicile",
          icon: <Home className="w-3 h-3" />,
          color: "bg-blue-50 text-[#16385c] border-blue-200/60",
        };
      case "ONLINE":
        return {
          label: locale === "en" ? "Online" : "En ligne",
          icon: <Monitor className="w-3 h-3" />,
          color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
        };
      default:
        return {
          label: locale === "en" ? "Hybrid" : "Hybride",
          icon: <Layers className="w-3 h-3" />,
          color: "bg-purple-50 text-purple-700 border-purple-200/60",
        };
    }
  };

  const modeInfo = getModeBadge(opportunity.mode);
  const isCustom = opportunity.subjectName.toLowerCase() === "autre" && opportunity.customSubject;
  const match = opportunity.matchResult;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 hover:border-[#16385c]/40 transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden group">
      {/* Top Header */}
      <div className="p-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 group-hover:text-[#16385c] transition-colors">
                {isCustom ? opportunity.customSubject : opportunity.subjectName}
              </span>
              {isCustom && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  {locale === "en" ? "Custom" : "Spécifique"}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500">
              {opportunity.gradeLevelName}
              {opportunity.cycle && ` • ${opportunity.cycle}`}
            </p>
          </div>

          {/* Match Score Badge */}
          {match.score > 0 && (
            <div
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                match.isRecommended
                  ? "bg-amber-50 text-[#e59a38] border-[#e59a38]/40"
                  : "bg-slate-50 text-slate-600 border-slate-200"
              }`}
              title={match.reasons.join("\n")}
            >
              <Sparkles className="w-3 h-3" />
              <span>{match.score}% {locale === "en" ? "Match" : "Compatible"}</span>
            </div>
          )}
        </div>

        {/* Modal & Location Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-medium ${modeInfo.color}`}
          >
            {modeInfo.icon}
            {modeInfo.label}
          </span>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-medium">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>
              {opportunity.commune ? `${opportunity.commune}, ` : ""}
              {opportunity.city}
            </span>
          </span>
        </div>

        {/* Learning Goals Snippet */}
        {opportunity.learningGoals && (
          <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
            &laquo; {opportunity.learningGoals} &raquo;
          </p>
        )}

        {/* Key Logistics */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{opportunity.sessionDurationMinutes} min / séance</span>
          </div>
          {opportunity.frequency && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{opportunity.frequency}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Budget & CTA Buttons */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            {locale === "en" ? "Declared Budget" : "Budget déclaré"}
          </span>
          <span className="text-sm font-bold text-[#16385c]">
            {formatGnf(opportunity.budgetGnf)}
            <span className="text-xs font-normal text-slate-500">
              {opportunity.budgetType === "HOURLY"
                ? locale === "en" ? " / hr" : " / h"
                : locale === "en" ? " / mo" : " / mois"}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {opportunity.hasApplied ? (
            <Link
              href="/teacher/applications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Applied" : "Déjà postulé"}</span>
            </Link>
          ) : (
            <Link
              href={`/teacher/opportunities/${opportunity.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#16385c] hover:bg-[#10243d] text-white transition-colors shadow-xs"
            >
              <span>{locale === "en" ? "Apply" : "Postuler"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

