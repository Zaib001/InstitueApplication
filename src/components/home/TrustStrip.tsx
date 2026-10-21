"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { ShieldCheck, FileCheck, Lock, Sparkles } from "lucide-react";

export function TrustStrip() {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-blue" aria-hidden="true" />,
      title: t("trust.tutorsTitle", "Professeurs Vérifiés"),
      desc: t("trust.tutorsDesc", "Pièces d'identité et diplômes universitaires certifiés manuellement."),
      badge: t("trust.badgeVerified", "Contrôle 100%"),
    },
    {
      icon: <FileCheck className="w-6 h-6 text-brand-teal" aria-hidden="true" />,
      title: t("trust.reportsTitle", "Rapport après Chaque Cours"),
      desc: t("trust.reportsDesc", "Notions abordées, devoirs et niveau d'effort visibles par le parent."),
      badge: t("trust.badgePedagogy", "Transparence"),
    },
    {
      icon: <Lock className="w-6 h-6 text-amber-500" aria-hidden="true" />,
      title: t("trust.financeTitle", "Paiement 100% Protégé"),
      desc: t("trust.financeDesc", "Fonds conservés : le professeur n'est payé que si vous validez la séance."),
      badge: t("trust.badgeSecurity", "Zéro Risque"),
    },
    {
      icon: <Sparkles className="w-6 h-6 text-indigo-500" aria-hidden="true" />,
      title: t("trust.flexTitle", "Apprentissage Flexible"),
      desc: t("trust.flexDesc", "À domicile à Conakry ou en visio selon l'emploi du temps de votre enfant."),
      badge: t("trust.badgeFlex", "Sur mesure"),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {benefits.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-premium hover:shadow-premium-hover transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {item.badge}
              </span>
            </div>
            <h3 className="text-base font-bold font-heading text-brand-navy mb-1.5 group-hover:text-brand-blue transition-colors">
              {item.title}
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
