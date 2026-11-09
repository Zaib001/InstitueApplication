"use client";

import React from "react";
import { Search, Filter, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface StudentOption {
  id: string;
  fullName: string;
}

interface RequestFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStudentId: string | null;
  onStudentChange: (studentId: string | null) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  students: StudentOption[];
  onResetFilters: () => void;
}

export function RequestFilterBar({
  searchQuery,
  onSearchChange,
  selectedStudentId,
  onStudentChange,
  selectedStatus,
  onStatusChange,
  students,
  onResetFilters,
}: RequestFilterBarProps) {
  const { locale } = useTranslation();

  const hasActiveFilters =
    Boolean(searchQuery) || Boolean(selectedStudentId) || Boolean(selectedStatus);

  return (
    <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            locale === "en"
              ? "Search by subject, level, student..."
              : "Rechercher par matière, classe, élève..."
          }
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:bg-white transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Student Selector */}
        <select
          value={selectedStudentId || ""}
          onChange={(e) => onStudentChange(e.target.value || null)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
        >
          <option value="">
            {locale === "en" ? "All Children" : "Tous les enfants"}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.fullName}
            </option>
          ))}
        </select>

        {/* Status Selector */}
        <select
          value={selectedStatus || ""}
          onChange={(e) => onStatusChange(e.target.value || null)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
        >
          <option value="">
            {locale === "en" ? "All Statuses" : "Tous les statuts"}
          </option>
          <option value="OPEN">
            {locale === "en" ? "Published / Open" : "Publiée / Ouverte"}
          </option>
          <option value="DRAFT">
            {locale === "en" ? "Draft" : "Brouillon"}
          </option>
          <option value="MATCHED">
            {locale === "en" ? "Tutor Matched" : "Professeur assigné"}
          </option>
          <option value="CANCELLED">
            {locale === "en" ? "Cancelled" : "Annulée"}
          </option>
        </select>

        {/* Reset button if filters active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "Reset" : "Effacer"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

