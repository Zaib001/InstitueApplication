"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Target,
  HeartHandshake,
  Clock,
} from "lucide-react";

export function LearningExperienceSection() {
  const { t } = useTranslation();

  const points = [
    {
      icon: <Target className="w-5 h-5 text-brand-blue" aria-hidden="true" />,
      title: t("experience.point1Title", "Diagnostic initial ciblé"),
      desc: t("experience.point1Desc", "Identification précise des blocages de l'élève dès la première séance."),
    },
    {
      icon: <HeartHandshake className="w-5 h-5 text-brand-teal" aria-hidden="true" />,
      title: t("experience.point2Title", "Pédagogie positive et bienveillante"),
      desc: t("experience.point2Desc", "Redonner le goût d'apprendre et la confiance en soi face aux épreuves."),
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-500" aria-hidden="true" />,
      title: t("experience.point3Title", "Rythme adapté et régularité"),
      desc: t("experience.point3Desc", "Séances de 60 à 120 minutes calées sur les disponibilités de votre foyer."),
    },
  ];

  return (
    <SectionContainer className="bg-slate-50/40">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Colonne Gauche — Visuel immersif de séance de cours */}
        <div className="lg:col-span-6 relative">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
            <Image
              src="/images/tutor_session.jpg"
              alt="Professeur et élève en séance de soutien scolaire à Conakry"
              fill
              className="object-cover hover:scale-102 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 550px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Badge flottant pédagogique */}
          <div className="absolute -bottom-6 -right-2 sm:right-6 p-4 rounded-2xl glass-card shadow-premium max-w-xs border border-white/90">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-brand-teal shrink-0">
                <Sparkles className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-bold text-brand-navy">
                  {t("experience.badgeTitle", "Méthodologie Active")}
                </div>
                <div className="text-[11px] text-brand-muted">
                  {t("experience.badgeDesc", "Exercices d'application directe")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Droite — Récit d'apprentissage */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/60 text-brand-teal text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t("experience.badge", "Pédagogie d'Excellence")}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-brand-navy tracking-tight leading-[1.15]">
            {t("experience.title", "Chaque enfant mérite une méthode adaptée à son potentiel")}
          </h2>

          <p className="text-base text-brand-muted leading-relaxed">
            {t(
              "experience.subtitle",
              "En classe surchargée, les élèves n'osent pas toujours poser leurs questions. Avec un professeur dédié de Monsieur Fanyi, votre enfant bénéficie d'une écoute totale et d'un accompagnement personnalisé."
            )}
          </p>

          <div className="space-y-4 pt-2">
            {points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-xs">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                  {pt.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-navy mb-0.5">{pt.title}</h3>
                  <p className="text-xs text-brand-muted leading-relaxed">{pt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Link
              href="/register?role=parent"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-navy hover:bg-brand-blue text-white font-semibold text-sm shadow-md transition-colors"
            >
              <span>{t("experience.cta", "Commencer avec un professeur adapté")}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

      </div>
    </SectionContainer>
  );
}
