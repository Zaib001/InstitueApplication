"use client";

import React, { useState } from "react";
import { Search, Plus, Filter, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { StudentCard, StudentCardData } from "./StudentCard";
import { StudentEmptyState } from "./StudentEmptyState";

interface StudentListProps {
  childrenList: StudentCardData[];
  onAddChild: () => void;
  onEditChild: (student: StudentCardData) => void;
  onDeleteChild: (student: StudentCardData) => void;
}

export function StudentList({
  childrenList,
  onAddChild,
  onEditChild,
  onDeleteChild,
}: StudentListProps) {
  const { t, locale } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>("ALL");

  const cycles = [
    { id: "ALL", label: locale === "en" ? "All Cycles" : "Tous les cycles" },
    { id: "PRIMAIRE", label: locale === "en" ? "Primary" : "Primaire" },
    { id: "COLLEGE", label: locale === "en" ? "Middle School" : "Collège" },
    { id: "LYCEE", label: locale === "en" ? "High School" : "Lycée" },
    { id: "SUPERIEUR", label: locale === "en" ? "Higher Ed" : "Supérieur" },
  ];

  const filtered = childrenList.filter((child) => {
    const matchesSearch =
      child.fullName.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      child.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      (child.schoolName &&
        child.schoolName.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
      (child.preferredSubjects &&
        child.preferredSubjects.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase().trim())
        ));

    const matchesCycle =
      selectedCycleFilter === "ALL" ||
      (child.cycle && child.cycle.toUpperCase() === selectedCycleFilter);

    return matchesSearch && matchesCycle;
  });

  return (
    <div className="space-y-4">
      {/* Section Header with Title & Add Child CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black text-slate-800 font-heading">
              {t("parent.childrenSectionTitle", "Mes Enfants Inscrits")}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
              {childrenList.length}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {t(
              "parent.childrenSectionSubtitle",
              "Profils scolaires actifs et encadrement pédagogique"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddChild}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-center transform hover:-translate-y-0.5"
        >
          <Plus className="w-3.5 h-3.5 text-[#e59a38]" />
          <span>{t("parent.addChildBtn", "+ Ajouter un enfant")}</span>
        </button>
      </div>

      {childrenList.length === 0 ? (
        <StudentEmptyState onAddChild={onAddChild} />
      ) : (
        <>
          {/* Search & Cycle Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  locale === "en"
                    ? "Search child by name, grade, school or subject..."
                    : "Rechercher par nom, classe, école ou matière..."
                }
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/60 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#16385c]"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {cycles.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCycleFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCycleFilter === c.id
                      ? "bg-[#16385c] text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Children Grid */}
          {filtered.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
              {locale === "en"
                ? "No student matches your search criteria."
                : "Aucun élève ne correspond à votre filtre de recherche."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((child) => (
                <StudentCard
                  key={child.id}
                  student={child}
                  onEdit={onEditChild}
                  onDelete={onDeleteChild}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
