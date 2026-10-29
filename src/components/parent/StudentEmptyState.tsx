"use client";

import React from "react";
import { GraduationCap, Plus, Sparkles, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface StudentEmptyStateProps {
  onAddChild: () => void;
}

export function StudentEmptyState({ onAddChild }: StudentEmptyStateProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="p-8 sm:p-12 rounded-3xl bg-white border border-dashed border-slate-300 text-center space-y-5 shadow-xs">
      <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#16385c] mx-auto shadow-xs">
        <GraduationCap className="w-8 h-8 text-[#16385c]" />
      </div>

      <div className="max-w-md mx-auto space-y-1.5">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
          {t("parent.noChildrenTitle", "Aucun enfant enregistré pour le moment")}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {t(
            "parent.noChildrenDesc",
            "Ajoutez le profil de votre enfant pour débuter les cours et choisir un tuteur adapté."
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto pt-2 text-left">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">
            {locale === "en" ? "1. Create Profile" : "1. Enregistrer l'enfant"}
          </span>
          <span className="text-[11px] text-slate-500 block leading-tight">
            {locale === "en"
              ? "Specify school grade & focus subjects."
              : "Renseignez sa classe et ses matières clés."}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">
            {locale === "en" ? "2. Matched Tutors" : "2. Sélection du tuteur"}
          </span>
          <span className="text-[11px] text-slate-500 block leading-tight">
            {locale === "en"
              ? "Access verified teachers in Conakry."
              : "Accédez aux enseignants accrédités de Conakry."}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
          <span className="font-bold text-slate-800 block">
            {locale === "en" ? "3. Secure Escrow" : "3. Séquestre Garanti"}
          </span>
          <span className="text-[11px] text-slate-500 block leading-tight">
            {locale === "en"
              ? "Funds protected until you confirm."
              : "Paiement débloqué après chaque cours."}
          </span>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={onAddChild}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4 text-[#e59a38]" />
          <span>{t("parent.addChildBtn", "+ Ajouter un enfant")}</span>
        </button>
      </div>
    </div>
  );
}
