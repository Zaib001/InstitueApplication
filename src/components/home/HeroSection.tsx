"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:pt-10 lg:pb-24">
      {/* Arrière-plan atmosphérique avec gradients radiaux doux */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-brand-blue/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-brand-teal/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Colonne Gauche — Accroche et Conversion */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* Badge de certification Guinée */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue-surface border border-blue-200/80 text-brand-blue text-xs font-semibold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
              <span>{t("hero.badge", "Plateforme Certifiée — République de Guinée")}</span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-brand-teal" />
              <span className="hidden sm:inline-block text-brand-muted text-[11px]">
                {t("hero.badgeSub", "Conakry & En ligne")}
              </span>
            </div>

            {/* Titre Principal percutant */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading text-brand-navy tracking-tight leading-[1.12]">
              {t("hero.titleHighlight", "L'Excellence Scolaire")} à portée de main pour vos enfants en{" "}
              <span className="relative inline-block text-brand-blue">
                Guinée
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-brand-teal/40"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path d="M0 6 C 30 1, 70 1, 100 6" stroke="currentColor" strokeWidth="3" fill="none" />
                </svg>
              </span>
            </h1>

            {/* Description orientée réassurance */}
            <p className="text-base sm:text-lg lg:text-xl text-brand-muted leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              {t(
                "hero.subtitle",
                "Trouvez un professeur particulier rigoureusement vérifié à Conakry et dans toute la Guinée. Paiements sécurisés par Orange Money et MTN, suivi pédagogique transparent après chaque séance."
              )}
            </p>

            {/* Actions principales CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/register?role=parent"
                className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{t("hero.ctaParent", "Trouver un professeur pour mon enfant")}</span>
                <ArrowRight className="w-5 h-5 text-slate-950" aria-hidden="true" />
              </Link>

              <Link
                href="/register?role=teacher"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-brand-navy font-semibold text-base shadow-xs hover:border-slate-300 transition-all"
              >
                <Sparkles className="w-4 h-4 text-brand-teal" aria-hidden="true" />
                <span>{t("hero.ctaTeacher", "Devenir professeur Monsieur Fanyi")}</span>
              </Link>
            </div>

            {/* 3 piliers de confiance compacts */}
            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-200/80 text-left">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-brand-navy">
                  {t("hero.pillTutors", "Diplômes & CNI vérifiés")}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-brand-navy">
                  {t("hero.pillReports", "Rapport après chaque cours")}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/60 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-brand-navy">
                  {t("hero.pillPayments", "Paiement 100% protégé")}
                </span>
              </div>
            </div>
          </div>

          {/* Colonne Droite — Composition Visuelle Inspirée de Lexicon */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[420px] lg:max-w-none">
              
              {/* Cadre Principal avec Photo de l'Élève */}
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                <Image
                  src="/images/hero_student.jpg"
                  alt="Élève confiante accompagnée par Monsieur Fanyi en Guinée"
                  fill
                  priority
                  className="object-cover object-top hover:scale-102 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 420px"
                />

                {/* Voile dégradé subtil au pied pour lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent pointer-events-none" />

                {/* Badge en bas de la photo */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/60 shadow-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center text-white shrink-0">
                      <BookOpen className="w-5 h-5 text-brand-gold" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-navy">
                        {t("hero.courseTitle", "Mathématiques & Physique")}
                      </div>
                      <div className="text-[11px] text-brand-muted">
                        {t("hero.courseLevel", "Programme Lycée — Terminale SM")}
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60">
                    {t("hero.courseStatus", "Progression +28%")}
                  </span>
                </div>
              </div>

              {/* Carte Métrique Flottante 1 (Haut Droite) */}
              <div className="absolute -top-6 -right-4 sm:-right-6 w-48 sm:w-52 p-3.5 rounded-2xl glass-card shadow-premium border border-white/90 animate-float">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-brand-teal">
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-brand-navy">
                      98.4 %
                    </div>
                    <div className="text-[10px] text-brand-muted">
                      {t("hero.metricSatisfaction", "Taux de satisfaction")}
                    </div>
                  </div>
                </div>
                {/* Jauge de progression */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-brand-blue to-brand-teal h-full rounded-full w-[98%]" />
                </div>
              </div>

              {/* Carte Séance Flottante 2 (Milieu Gauche) */}
              <div className="hidden sm:flex absolute top-1/2 -left-8 -translate-y-1/2 p-3.5 rounded-2xl glass-card shadow-premium border border-white/90 items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-brand-blue shrink-0">
                  <CalendarCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xs font-bold text-brand-navy">
                    {t("hero.nextSession", "Prochaine séance")}
                  </div>
                  <div className="text-[11px] text-brand-muted">
                    {t("hero.sessionSchedule", "Aujourd'hui à 16h30 • Conakry")}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
