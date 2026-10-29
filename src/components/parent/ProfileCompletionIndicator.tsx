"use client";

import React from "react";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ProfileCompletionIndicatorProps {
  hasPhone: boolean;
  hasCity: boolean;
  childrenCount: number;
}

export function ProfileCompletionIndicator({
  hasPhone,
  hasCity,
  childrenCount,
}: ProfileCompletionIndicatorProps) {
  const { locale } = useTranslation();

  const steps = [
    {
      title: locale === "en" ? "Account Created" : "Compte Parent Créé",
      completed: true,
    },
    {
      title: locale === "en" ? "Phone & City Set" : "Téléphone & Ville Renseignés",
      completed: hasPhone && hasCity,
    },
    {
      title: locale === "en" ? "Child Registered" : "Profil Enfant Ajouté",
      completed: childrenCount > 0,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const percentage = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 block">
            {locale === "en" ? "Family Profile Readiness" : "Progression de votre dossier famille"}
          </span>
          <span className="text-[11px] text-slate-400">
            {locale === "en"
              ? `${completedCount} of ${steps.length} steps complete`
              : `${completedCount} sur ${steps.length} étapes validées`}
          </span>
        </div>
        <span className="text-xs font-black text-[#16385c] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
          {percentage}%
        </span>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#16385c] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600">
        {steps.map((st, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {st.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 shrink-0" />
            )}
            <span className={`text-[11px] ${st.completed ? "font-semibold text-slate-800" : "text-slate-400"}`}>
              {st.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
