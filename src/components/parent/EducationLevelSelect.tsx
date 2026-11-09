"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { GraduationCap, BookOpen, Award, Sparkles, HelpCircle } from "lucide-react";

export interface GradeLevelOption {
  id: string;
  name: string;
  cycle: string;
  orderIndex?: number;
}

interface EducationLevelSelectProps {
  selectedCycle: string;
  onCycleChange: (cycle: string) => void;
  customCycle?: string;
  onCustomCycleChange?: (custom: string) => void;
  selectedGradeLevel: string;
  onGradeLevelChange: (grade: string) => void;
  gradeLevels: GradeLevelOption[];
}

export function EducationLevelSelect({
  selectedCycle,
  onCycleChange,
  customCycle = "",
  onCustomCycleChange,
  selectedGradeLevel,
  onGradeLevelChange,
  gradeLevels,
}: EducationLevelSelectProps) {
  const { locale } = useTranslation();

  const cycles = [
    {
      id: "PRIMAIRE",
      label: locale === "en" ? "Primary School" : "Primaire",
      sub: "CP - CM2",
      icon: BookOpen,
      color: "blue",
    },
    {
      id: "COLLEGE",
      label: locale === "en" ? "Middle School" : "Collège",
      sub: "7ème - 10ème / BEPC",
      icon: GraduationCap,
      color: "purple",
    },
    {
      id: "LYCEE",
      label: locale === "en" ? "High School" : "Lycée",
      sub: "11ème - Terminale / BAC",
      icon: Award,
      color: "indigo",
    },
    {
      id: "SUPERIEUR",
      label: locale === "en" ? "Higher Ed / Exams" : "Supérieur & Concours",
      sub: "Université / Concours",
      icon: Sparkles,
      color: "emerald",
    },
    {
      id: "AUTRE",
      label: locale === "en" ? "Other" : "Autre",
      sub: locale === "en" ? "Special / Custom" : "Cycle ou formation sur-mesure",
      icon: HelpCircle,
      color: "amber",
    },
  ];

  // Filter grade levels according to selected cycle if available
  const filteredGrades = gradeLevels.filter(
    (g) => !selectedCycle || g.cycle.toUpperCase() === selectedCycle.toUpperCase()
  );

  return (
    <div className="space-y-3">
      {/* 1. Cycle selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          {locale === "en" ? "1. Educational Cycle *" : "1. Cycle d'enseignement *"}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {cycles.map((c) => {
            const isSelected = selectedCycle === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onCycleChange(c.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? "border-[#16385c] bg-[#16385c]/5 text-[#16385c] font-bold shadow-xs ring-1 ring-[#16385c]"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs">{c.label}</span>
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                </div>
                <span className="text-[10px] text-slate-400 font-normal">{c.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* When "AUTRE" is selected, show specialized custom cycle description input */}
      {selectedCycle === "AUTRE" && (
        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-1.5 animate-in fade-in duration-150">
          <label className="block text-xs font-bold text-amber-950">
            {locale === "en"
              ? "Specify educational cycle or specialized training *"
              : "Précisez le cycle ou la formation spécifique *"}
          </label>
          <input
            type="text"
            required
            value={customCycle}
            onChange={(e) => onCustomCycleChange?.(e.target.value)}
            placeholder={
              locale === "en"
                ? "e.g. Professional training, Specialized tutoring, Technical training..."
                : "ex: Formation professionnelle, Alphabétisation, Concours d'entrée spécialisé..."
            }
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="text-[10px] text-amber-800">
            {locale === "en"
              ? "Allows tailored tutoring matches for non-standard academic and vocational curricula."
              : "Permet d'adapter l'attribution d'enseignants pour les filières techniques, professionnelles ou spécialisées."}
          </p>
        </div>
      )}

      {/* 2. Specific Grade / Class */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {locale === "en" ? "2. Specific Grade / Class *" : "2. Classe ou niveau scolaire précis *"}
        </label>

        {selectedCycle !== "AUTRE" && filteredGrades.length > 0 ? (
          <select
            value={selectedGradeLevel}
            onChange={(e) => onGradeLevelChange(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
          >
            <option value="">
              {locale === "en" ? "-- Select grade level --" : "-- Sélectionner la classe --"}
            </option>
            {filteredGrades.map((g) => (
              <option key={g.id} value={g.name}>
                {g.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            required
            value={selectedGradeLevel}
            onChange={(e) => onGradeLevelChange(e.target.value)}
            placeholder={
              selectedCycle === "AUTRE"
                ? (locale === "en" ? "e.g. 1st Year Certificate, Module B, Adult Level 2" : "ex: 1ère Année Brevet, Module B, Niveau 2 Adulte")
                : (locale === "en"
                    ? "e.g. 12th Grade Advanced Math (Terminale SM)"
                    : "ex: Terminale Sciences Mathématiques (SM) ou 10ème Année")
            }
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
          />
        )}
      </div>
    </div>
  );
}
