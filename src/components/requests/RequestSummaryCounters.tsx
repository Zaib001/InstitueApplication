"use client";

import React from "react";
import { FileText, Send, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface RequestSummaryCountersProps {
  counts: {
    total: number;
    draft: number;
    open: number;
    matched: number;
    closed: number;
    cancelled: number;
  };
  activeFilter: string | null;
  onFilterSelect: (status: string | null) => void;
}

export function RequestSummaryCounters({
  counts,
  activeFilter,
  onFilterSelect,
}: RequestSummaryCountersProps) {
  const { locale } = useTranslation();

  const cards = [
    {
      id: null,
      label: locale === "en" ? "All Requests" : "Toutes les demandes",
      count: counts.total,
      icon: FileText,
      color: "blue",
    },
    {
      id: "OPEN",
      label: locale === "en" ? "Published & Open" : "Publiées & Ouvertes",
      count: counts.open,
      icon: Send,
      color: "emerald",
    },
    {
      id: "DRAFT",
      label: locale === "en" ? "Drafts" : "Brouillons privés",
      count: counts.draft,
      icon: FileText,
      color: "amber",
    },
    {
      id: "CANCELLED",
      label: locale === "en" ? "Cancelled" : "Demandes annulées",
      count: counts.cancelled,
      icon: XCircle,
      color: "rose",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const isSelected = activeFilter === card.id;
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onFilterSelect(card.id)}
            className={`p-4 sm:p-5 rounded-3xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 shadow-xs ${
              isSelected
                ? "border-[#16385c] bg-[#16385c]/5 ring-2 ring-[#16385c] shadow-md"
                : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/70"
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                {card.label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  card.color === "emerald"
                    ? "bg-emerald-50 text-emerald-600"
                    : card.color === "amber"
                    ? "bg-amber-50 text-amber-600"
                    : card.color === "rose"
                    ? "bg-rose-50 text-rose-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
              {card.count}
            </div>
          </button>
        );
      })}
    </div>
  );
}

