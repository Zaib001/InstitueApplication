"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import {
  ShieldCheck,
  FileCheck2,
  UserCheck,
  Scale,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export function TeacherVerificationSection() {
  const { t } = useTranslation();

  const criteria = [
    {
      step: "1",
      icon: <FileCheck2 className="w-5 h-5 text-brand-blue" aria-hidden="true" />,
      title: t("verify.cniTitle", "Vérification d'Identité"),
      desc: t(
        "verify.cniDesc",
        "Chaque professeur fournit une copie authentifiée de sa CNI ou de son Passeport Guinéen."
      ),
    },
    {
      step: "2",
      icon: <ShieldCheck className="w-5 h-5 text-brand-teal" aria-hidden="true" />,
      title: t("verify.diplomaTitle", "Contrôle des Diplômes"),
      desc: t(
        "verify.diplomaDesc",
        "Vérification des attestations universitaires (UGANC, UGLC Sonfonia, etc.) et diplômes d'enseignement."
      ),
    },
    {
      step: "3",
      icon: <UserCheck className="w-5 h-5 text-amber-500" aria-hidden="true" />,
      title: t("verify.interviewTitle", "Examen par l'Administration"),
      desc: t(
        "verify.interviewDesc",
        "Revue manuelle de chaque dossier par notre équipe pédagogique avant toute autorisation de postuler."
      ),
    },
    {
      step: "4",
      icon: <Scale className="w-5 h-5 text-indigo-500" aria-hidden="true" />,
      title: t("verify.ethicsTitle", "Charte de Déontologie"),
      desc: t(
        "verify.ethicsDesc",
        "Engagement formel sur la ponctualité, l'éthique pédagogique et la protection des mineurs."
      ),
    },
  ];

  return (
    <SectionContainer className="bg-slate-50/60">
      <SectionHeading
        badge={t("verify.badge", "Sélection Rigoureuse")}
        badgeIcon={<ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />}
        title={t("verify.title", "La confiance n'exclut pas le contrôle : Notre protocole de vérification")}
        subtitle={t(
          "verify.subtitle",
          "Seuls les enseignants dont l'identité et les compétences ont été validées par l'administrateur peuvent être mis en relation avec les familles."
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {criteria.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-premium hover:shadow-premium-hover transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="w-7 h-7 rounded-full bg-brand-blue-surface text-brand-blue text-xs font-bold flex items-center justify-center">
                  {item.step}
                </span>
              </div>
              <h3 className="text-base font-bold font-heading text-brand-navy mb-2">
                {item.title}
              </h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                {item.desc}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t("verify.mandatoryCheck", "Contrôle obligatoire")}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 max-w-2xl mx-auto flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          {t(
            "verify.transparencyNote",
            "Note de transparence : Un professeur en attente de vérification ne peut soumettre aucune candidature à une offre de soutien tant que son dossier complet n'est pas approuvé par l'administrateur."
          )}
        </span>
      </div>
    </SectionContainer>
  );
}
