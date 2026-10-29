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
  availableSubjects: SubjectOption[];
}

export function SubjectSelector({
  selectedSubjects,
  onChange,
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

  const defaultList: SubjectOption[] = availableSubjects.length
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">
          {locale === "en"
            ? "Target Tutoring Subjects (Select all that apply)"
            : "Matières prioritaires pour le soutien scolaire"}
        </label>
        <span className="text-[10px] text-slate-400">
          {selectedSubjects.length} {locale === "en" ? "selected" : "sélectionnée(s)"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {defaultList.map((sub) => {
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
    </div>
  );
}
