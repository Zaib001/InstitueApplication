"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import {
  FileText,
  UserCheck,
  Calendar,
  Award,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function HowItWorksSection() {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      icon: <FileText className="w-6 h-6 text-brand-blue" aria-hidden="true" />,
      title: t("howItWorks.step1Title", "Décrivez votre besoin"),
      desc: t(
        "howItWorks.step1Desc",
        "Indiquez la classe de votre enfant, la matière (Maths, Français, Physique...), le budget et votre quartier à Conakry ou en ligne."
      ),
      highlight: false,
    },
    {
      number: "02",
      icon: <UserCheck className="w-6 h-6 text-brand-teal" aria-hidden="true" />,
      title: t("howItWorks.step2Title", "Choisissez votre professeur"),
      desc: t(
        "howItWorks.step2Desc",
        "Recevez les candidatures de professeurs dont les diplômes et l'identité ont été vérifiés manuellement par l'administration."
      ),
      highlight: true, // Carte mise en valeur comme dans la référence Image 3
    },
    {
      number: "03",
      icon: <Calendar className="w-6 h-6 text-amber-500" aria-hidden="true" />,
      title: t("howItWorks.step3Title", "Planifiez vos cours"),
      desc: t(
        "howItWorks.step3Desc",
        "Définissez le calendrier hebdomadaire en accord avec l'enseignant, à domicile ou via visioconférence sécurisée."
      ),
      highlight: false,
    },
    {
      number: "04",
      icon: <Award className="w-6 h-6 text-emerald-500" aria-hidden="true" />,
      title: t("howItWorks.step4Title", "Suivez et validez"),
      desc: t(
        "howItWorks.step4Desc",
        "Le professeur soumet son compte-rendu. Le reversement n'a lieu QUE si vous confirmez que la séance a bien été effectuée."
      ),
      highlight: false,
    },
  ];

  return (
    <SectionContainer id="comment-ca-marche" className="bg-slate-50/50">
      <SectionHeading
        badge={t("howItWorks.badge", "Méthode Éprouvée")}
        badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />}
        title={t("howItWorks.title", "Une mise en relation simple, transparente et sécurisée")}
        subtitle={t(
          "howItWorks.subtitle",
          "Chaque étape est pensée pour protéger l'investissement des parents et valoriser l'excellence des enseignants."
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`relative rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between ${
              step.highlight
                ? "bg-gradient-to-b from-brand-blue to-brand-blue-deep text-white shadow-xl shadow-brand-blue/20 transform lg:-translate-y-2 border border-blue-400/40"
                : "bg-white text-brand-charcoal border border-slate-200 shadow-premium hover:shadow-premium-hover hover:-translate-y-1"
            }`}
          >
            {/* Numérotation de l'étape */}
            <div className="flex items-center justify-between mb-6">
              <span
                className={`text-2xl font-black font-heading ${
                  step.highlight ? "text-white/40" : "text-slate-300"
                }`}
              >
                {step.number}
              </span>
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${
                  step.highlight
                    ? "bg-white/15 text-white backdrop-blur-xs"
                    : "bg-slate-50 border border-slate-100"
                }`}
              >
                {step.icon}
              </div>
            </div>

            {/* Contenu */}
            <div className="space-y-3">
              <h3
                className={`text-lg font-bold font-heading ${
                  step.highlight ? "text-white" : "text-brand-navy"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`text-xs sm:text-sm leading-relaxed ${
                  step.highlight ? "text-blue-100" : "text-brand-muted"
                }`}
              >
                {step.desc}
              </p>
            </div>

            {/* Indicateur de flux */}
            <div className="pt-6 mt-4 border-t border-slate-100/20 flex items-center text-xs font-semibold">
              <span className={step.highlight ? "text-white" : "text-brand-blue"}>
                Étape {index + 1} sur 4
              </span>
              <ArrowRight
                className={`w-3.5 h-3.5 ml-2 ${
                  step.highlight ? "text-white" : "text-brand-blue"
                }`}
                aria-hidden="true"
              />
            </div>
          </div>
        ))}
      </div>
    </SectionContainer>
  );
}
