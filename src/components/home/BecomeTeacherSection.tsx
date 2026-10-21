"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  Wallet,
  CalendarCheck,
  CheckCircle2,
  Users,
} from "lucide-react";

export function BecomeTeacherSection() {
  const { t } = useTranslation();

  const teacherPerks = [
    {
      icon: <Wallet className="w-5 h-5 text-brand-gold" aria-hidden="true" />,
      title: t("teacherRecruit.perk1Title", "85 % de rémunération nette"),
      desc: t("teacherRecruit.perk1Desc", "L'une des commissions les plus justes d'Afrique de l'Ouest : 85 % vous reviennent directement."),
    },
    {
      icon: <CalendarCheck className="w-5 h-5 text-teal-400" aria-hidden="true" />,
      title: t("teacherRecruit.perk2Title", "Maîtrise totale de votre planning"),
      desc: t("teacherRecruit.perk2Desc", "Définissez vos créneaux libres, votre tarif horaire et vos zones de déplacement à Conakry."),
    },
    {
      icon: <Users className="w-5 h-5 text-blue-400" aria-hidden="true" />,
      title: t("teacherRecruit.perk3Title", "Familles motivées & respectueuses"),
      desc: t("teacherRecruit.perk3Desc", "Accédez aux demandes de parents engagés dans la réussite de leurs enfants."),
    },
  ];

  return (
    <SectionContainer className="bg-slate-50/60">
      <div className="relative rounded-3xl bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy-dark text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-slate-800">
        {/* Gradients d'accentuation */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-teal/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-gold">
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>{t("teacherRecruit.badge", "Recrutement d'Excellence — Guinée")}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight leading-[1.15]">
              {t("teacherRecruit.title", "Transmettez votre savoir et valorisez votre expertise pédagogique")}
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              {t(
                "teacherRecruit.subtitle",
                "Vous êtes diplômé d'université ou enseignant en exercice ? Rejoignez la première communauté de professeurs particuliers vérifiés en Guinée."
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              {teacherPerks.map((perk, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    {perk.icon}
                  </div>
                  <h3 className="text-xs font-bold text-white">{perk.title}</h3>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{perk.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/register?role=teacher"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>{t("teacherRecruit.cta", "Postuler comme professeur")}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <span className="text-xs text-slate-400 text-center sm:text-left">
                {t("teacherRecruit.subtextNote", "Inscription gratuite • Dossier examiné sous 48h")}
              </span>
            </div>
          </div>

          {/* Carte visuelle droite */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm p-6 rounded-3xl glass-card-dark shadow-2xl border border-white/15 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-bold text-slate-200">
                  {t("teacherRecruit.sampleTitle", "Revenus d'un Enseignant Type")}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {t("teacherRecruit.sampleShare", "Part 85%")}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-slate-300">
                    {t("teacherRecruit.sampleStudents", "3 Élèves réguliers (2x/sem) :")}
                  </span>
                  <span className="font-bold text-white">
                    {t("teacherRecruit.sampleSessions", "24 séances / mois")}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-slate-300">
                    {t("teacherRecruit.sampleGross", "Chiffre d'affaires brut :")}
                  </span>
                  <span className="font-bold text-slate-200">1 200 000 GNF</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center">
                  <span className="text-amber-300 font-semibold">
                    {t("teacherRecruit.sampleNet", "Net versé au professeur :")}
                  </span>
                  <span className="font-extrabold text-base text-brand-gold">1 020 000 GNF</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                {t(
                  "teacherRecruit.samplePayoutNote",
                  "* Reversements manuels enregistrés avec traçabilité complète sur votre numéro Orange Money ou MTN Mobile Money."
                )}
              </p>
            </div>
          </div>

        </div>
      </div>
    </SectionContainer>
  );
}
