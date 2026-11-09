"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Check } from "lucide-react";

export interface SubjectOption {
  id: string;
  name: string;
  category?: string | null;
}

interface SubjectSelectorProps {
  selectedSubjects: string[];
  onChange: (subjects: string[]) => void;
  customSubject?: string;
  onCustomSubjectChange?: (val: string) => void;
  availableSubjects: SubjectOption[];
}

export function SubjectSelector({
  selectedSubjects,
  onChange,
  customSubject = "",
  onCustomSubjectChange,
  availableSubjects,
}: SubjectSelectorProps) {
  const { locale } = useTranslation();

  const toggleSubject = (name: string) => {
    if (selectedSubjects.includes(name)) {
      onChange(selectedSubjects.filter((s) => s !== name));
    } else {
      onChange([...selectedSubjects, name]);
    }
  };

  // Ensure "Autre" is present in the list
  const baseList: SubjectOption[] = availableSubjects.length
    ? availableSubjects
    : [
        { id: "1", name: "Mathématiques" },
        { id: "2", name: "Physique-Chimie" },
        { id: "3", name: "Français & Littérature" },
        { id: "4", name: "Sciences de la Vie et de la Terre (SVT)" },
        { id: "5", name: "Anglais" },
        { id: "6", name: "Histoire-Géographie" },
        { id: "7", name: "Philosophie" },
        { id: "8", name: "Informatique & Numérique" },
      ];

  const hasAutreInList = baseList.some((s) => s.name.toLowerCase() === "autre");
  const displayList: SubjectOption[] = hasAutreInList
    ? baseList
    : [...baseList, { id: "custom-other", name: "Autre", category: "Spécialisé" }];

  const isOtherSelected = selectedSubjects.includes("Autre");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {locale === "en"
            ? "Target Tutoring Subjects (Select all that apply) *"
            : "Matières prioritaires pour le soutien scolaire *"}
        </label>
        <span className="text-[10px] text-slate-400">
          {selectedSubjects.length} {locale === "en" ? "selected" : "sélectionnée(s)"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {displayList.map((sub) => {
          const isSelected = selectedSubjects.includes(sub.name);
          return (
            <button
              key={sub.id}
              type="button"
              onClick={() => toggleSubject(sub.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#16385c] text-white shadow-xs"
                  : "bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 text-[#e59a38]" />}
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>

      {/* When "Autre" is selected, render custom subject text input */}
      {isOtherSelected && (
        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-1.5 animate-in fade-in duration-150">
          <label className="block text-xs font-bold text-[#16385c]">
            {locale === "en"
              ? "Specify the subject or training *"
              : "Précisez la matière ou la formation *"}
          </label>
          <input
            type="text"
            required
            value={customSubject}
            onChange={(e) => onCustomSubjectChange?.(e.target.value)}
            placeholder={
              locale === "en"
                ? "e.g. Advanced Economics, Russian, Robotics, Accounting..."
                : "ex: Économie approfondie, Russe, Robotique, Comptabilité..."
            }
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-blue-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
          />
          <p className="text-[10px] text-blue-800">
            {locale === "en"
              ? "This detail helps match with a verified tutor specialized in this discipline."
              : "Cette précision permettra d'identifier un professeur compétent dans ce domaine particulier."}
          </p>
        </div>
      )}
    </div>
  );
}
