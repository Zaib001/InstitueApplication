"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Sparkles,
  Smartphone,
  BookOpen,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export function InfiniteMarquee() {
  const { t } = useTranslation();

  const items = [
    {
      icon: <GraduationCap className="w-4 h-4 text-brand-blue" aria-hidden="true" />,
      text: t("marquee.curriculum", "Mathématiques, Physique, Français • Primaire au Bac Unique"),
      accent: "text-brand-navy",
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-brand-teal" aria-hidden="true" />,
      text: t("marquee.vetted", "Diplômes Universitaires & CNI Contrôlés Manuellement"),
      accent: "text-brand-teal",
    },
    {
      icon: <Smartphone className="w-4 h-4 text-amber-500" aria-hidden="true" />,
      text: t("marquee.payments", "Paiements Sécurisés Orange Money & MTN Guinée"),
      accent: "text-amber-600",
    },
    {
      icon: <Award className="w-4 h-4 text-brand-blue" aria-hidden="true" />,
      text: t("marquee.satisfaction", "98.4 % de Progression et Satisfaction des Familles"),
      accent: "text-brand-navy",
    },
    {
      icon: <BookOpen className="w-4 h-4 text-emerald-600" aria-hidden="true" />,
      text: t("marquee.reports", "Rapport Pédagogique Détaillé après Chaque Séance"),
      accent: "text-emerald-700",
    },
    {
      icon: <MapPin className="w-4 h-4 text-rose-500" aria-hidden="true" />,
      text: t("marquee.locations", "Conakry (Ratoma, Matoto, Dixinn, Kaloum) & En Ligne"),
      accent: "text-slate-800",
    },
    {
      icon: <Sparkles className="w-4 h-4 text-brand-gold" aria-hidden="true" />,
      text: t("marquee.fairModel", "Modèle Équitable SRD V2.0 : 85% au Professeur / 15% Plateforme"),
      accent: "text-brand-navy",
    },
  ];

  return (
    <div className="w-full py-4 border-y border-slate-200/80 bg-gradient-to-r from-blue-50/50 via-white to-teal-50/50 overflow-hidden select-none marquee-container">
      <div className="relative flex w-full">
        {/* Double défilement infini fluide */}
        <div className="flex shrink-0 items-center gap-8 animate-marquee marquee-content">
          {items.concat(items).map((item, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/70 shadow-xs whitespace-nowrap text-xs font-semibold"
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={item.accent}>{item.text}</span>
            </div>
          ))}
        </div>

        <div aria-hidden="true" className="flex shrink-0 items-center gap-8 animate-marquee marquee-content">
          {items.concat(items).map((item, index) => (
            <div
              key={`dup-${index}`}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200/70 shadow-xs whitespace-nowrap text-xs font-semibold"
            >
              <span className="shrink-0">{item.icon}</span>
              <span className={item.accent}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
