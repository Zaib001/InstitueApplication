"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export function FinalCTASection() {
  const { t } = useTranslation();

  return (
    <SectionContainer className="pt-0">
      <div className="relative rounded-3xl bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy-dark text-white p-8 sm:p-12 lg:p-16 text-center shadow-2xl overflow-hidden border border-slate-800">
        {/* Cercles de diffusion de lumière */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 right-1/4 w-[400px] h-[250px] bg-brand-teal/20 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-gold">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            <span>{t("finalCta.badge", "Prenez une Longueur d'Avance")}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight leading-[1.15]">
            {t(
              "finalCta.title",
              "Prêt à faire progresser votre enfant dès cette semaine ?"
            )}
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            {t(
              "finalCta.subtitle",
              "Inscrivez-vous gratuitement et recevez les premières propositions de professeurs certifiés à Conakry et dans toute la Guinée."
            )}
          </p>

          <div className="pt-4 flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4">
            <Link
              href="/register?role=parent"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all transform hover:-translate-y-0.5"
            >
              <span>{t("finalCta.btnParent", "Trouver un professeur pour mon enfant")}</span>
              <ArrowRight className="w-5 h-5 text-slate-950" aria-hidden="true" />
            </Link>

            <Link
              href="/register?role=teacher"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-base transition-colors"
            >
              <GraduationCap className="w-5 h-5 text-brand-teal" aria-hidden="true" />
              <span>{t("finalCta.btnTeacher", "Postuler comme enseignant")}</span>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
              <span>Inscription sans frais d'entrée</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
              <span>Paiement protégé par séance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
              <span>Orange Money & MTN Guinée</span>
            </div>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
