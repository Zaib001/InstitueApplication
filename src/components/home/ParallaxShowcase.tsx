"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Star,
  Users,
  MessageSquare,
  GraduationCap,
} from "lucide-react";

export function ParallaxShowcase() {
  const { t } = useTranslation();

  return (
    <SectionContainer className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Arrière-plan avec orbes animées en parallax / pulsation */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-blue-400/10 blur-[80px] animate-blob" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 rounded-full bg-teal-400/10 blur-[90px] animate-blob animation-delay-2000" />
      </div>

      <SectionHeading
        badge={t("showcase.badge", "Expérience Concrète")}
        badgeIcon={<Sparkles className="w-3.5 h-3.5 text-brand-gold" />}
        title={t("showcase.title", "Une mise en relation vivante entre parents et professeurs")}
        subtitle={t(
          "showcase.subtitle",
          "Découvrez comment Monsieur Fanyi simplifie la recherche d'enseignants fiables pour les familles à Conakry."
        )}
      />

      {/* Composition à plusieurs calques de profondeur */}
      <div className="relative max-w-5xl mx-auto mt-8">
        
        {/* Carte Centrale : La Passerelle de Matching */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800 relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Côté Parent */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-blue" />
                  Demande Parent Publiée
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                  Kipé • Conakry
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">Élève en 10ème Année (Brevet BEPC)</div>
                <div>Besoin : 2 séances / semaine en Physique-Chimie</div>
                <div className="text-[11px] text-brand-gold font-bold">Budget : 400 000 GNF / mois</div>
              </div>
              <div className="pt-2 border-t border-slate-700/50 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3 Candidatures reçues sous 24h</span>
              </div>
            </div>

            {/* Passerelle / Symbole de Connexion Centrale */}
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-blue to-brand-teal flex items-center justify-center text-white shadow-glow animate-pulse-subtle">
                <GraduationCap className="w-6 h-6 text-brand-gold" aria-hidden="true" />
              </div>
              <span className="text-[11px] font-bold text-slate-300 mt-2 uppercase tracking-wider">
                Matching Vérifié
              </span>
            </div>

            {/* Côté Professeur Sélectionné */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-teal" />
                  Professeur Certifié
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                  Validé Admin
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">M. Diallo • Master Physique Appliquée</div>
                <div>Expérience : 6 ans d'enseignement en lycée</div>
                <div className="flex items-center gap-1 text-brand-gold text-[11px] font-bold">
                  <Star className="w-3.5 h-3.5 fill-brand-gold" />
                  <span>4.9 / 5.0 (24 avis vérifiés)</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700/50 flex items-center gap-1 text-[11px] text-teal-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Rémunération 85% garantie par cours</span>
              </div>
            </div>

          </div>

          {/* Bandeau d'Action Bas de Carte */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Chaque mise en relation fait l'objet d'un suivi pédagogique et d'un compte de classe sécurisé.
            </div>
            <Link
              href="/register?role=parent"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-light text-white font-semibold text-xs shadow-xs transition-colors shrink-0"
            >
              <span>Publier un besoin d'enseignement</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Témoignages Flottants en Profondeur / Parallax */}
        <div className="hidden lg:block absolute -top-8 -left-10 w-64 p-4 rounded-2xl glass-card shadow-premium border border-white animate-float-slow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-brand-blue font-bold text-xs flex items-center justify-center">
              F
            </div>
            <div>
              <div className="text-xs font-bold text-brand-navy">Fatoumata C.</div>
              <div className="text-[10px] text-brand-muted">Mère d'élève • Lambanyi</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-700 italic leading-snug">
            « En 2 mois de cours de maths, les notes de mon fils sont passées de 9 à 14/20. Le rapport après chaque cours me rassure énormément. »
          </p>
        </div>

        <div className="hidden lg:block absolute -bottom-8 -right-10 w-64 p-4 rounded-2xl glass-card shadow-premium border border-white animate-float">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-teal-100 text-brand-teal font-bold text-xs flex items-center justify-center">
              A
            </div>
            <div>
              <div className="text-xs font-bold text-brand-navy">Amadou K.</div>
              <div className="text-[10px] text-brand-muted">Professeur de Français • Dixinn</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-700 italic leading-snug">
            « 85% de commission nette et des versements directs sur mon Orange Money dès que le parent valide. C'est sérieux et valorisant. »
          </p>
        </div>

      </div>
    </SectionContainer>
  );
}
