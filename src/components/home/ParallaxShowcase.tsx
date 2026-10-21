"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
  GraduationCap,
  Quote,
} from "lucide-react";

export function ParallaxShowcase() {
  const { t } = useTranslation();

  return (
    <SectionContainer className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      {/* Arrière-plan avec orbes animées en pulsation douce */}
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

      <div className="max-w-5xl mx-auto mt-8 space-y-6">
        
        {/* Carte Centrale Principale : La Passerelle de Matching Sécurisé */}
        <motion.div
          className="rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-2xl border border-slate-800 relative z-10 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-blue/20 rounded-full blur-[100px] pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* Côté Parent */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-800/70 border border-slate-700/70 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-brand-blue" />
                  {t("showcase.parentRequestTitle", "Demande Parent Publiée")}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  Kipé • Conakry
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-white text-sm">
                  {t("showcase.studentGrade", "Élève en 10ème Année (Brevet BEPC)")}
                </div>
                <div>{t("showcase.needDetails", "Besoin : 2 séances / semaine en Physique-Chimie")}</div>
                <div className="text-xs text-[#e59a38] font-bold">
                  {t("showcase.budget", "Budget : 400 000 GNF / mois")}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("showcase.appsReceived", "3 Candidatures reçues sous 24h")}</span>
              </div>
            </div>

            {/* Passerelle Centrale de Matching avec animation fluide */}
            <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-2">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-brand-blue to-brand-teal flex items-center justify-center text-white shadow-glow animate-pulse-subtle">
                  <GraduationCap className="w-7 h-7 text-[#e59a38]" aria-hidden="true" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-300 mt-2.5 uppercase tracking-wider">
                {t("showcase.verifiedMatching", "Matching Vérifié")}
              </span>
            </div>

            {/* Côté Professeur Sélectionné */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-slate-800/70 border border-slate-700/70 space-y-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-teal" />
                  {t("showcase.certifiedTeacher", "Professeur Certifié")}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  {t("showcase.adminApproved", "Validé Admin")}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1.5">
                <div className="font-bold text-white text-sm">
                  {t("showcase.teacherName", "M. Diallo • Master Physique Appliquée")}
                </div>
                <div>{t("showcase.teacherExp", "Expérience : 6 ans d'enseignement en lycée")}</div>
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                  <span>{t("showcase.reviews", "4.9 / 5.0 (24 avis vérifiés)")}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-xs text-teal-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{t("showcase.payoutPerSession", "Rémunération 85% garantie par cours")}</span>
              </div>
            </div>

          </div>

          {/* Bandeau d'Action Bas de Carte */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 text-center sm:text-left leading-relaxed">
              {t("showcase.bottomNote", "Chaque mise en relation fait l'objet d'un suivi pédagogique et d'un compte de classe sécurisé.")}
            </div>
            <Link
              href="/register?role=parent"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-xs shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 shrink-0"
            >
              <span>{t("showcase.postNeedBtn", "Publier un besoin d'enseignement")}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>

        {/* Témoignages Authentiques en Grille 2 Colonnes Élégante (Sans Aucun Rognage) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* Témoignage Parent */}
          <motion.div
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-premium flex flex-col justify-between"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-brand-blue font-bold text-sm flex items-center justify-center">
                    F
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-navy">Fatoumata C.</div>
                    <div className="text-[11px] text-brand-muted">
                      {t("showcase.testimonial1Role", "Mère d'élève • Lambanyi")}
                    </div>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                {t(
                  "showcase.testimonial1Text",
                  "« En 2 mois de cours de maths, les notes de mon fils sont passées de 9 à 14/20. Le rapport après chaque cours me rassure énormément. »"
                )}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Parent Vérifié • Progression Attestée</span>
            </div>
          </motion.div>

          {/* Témoignage Enseignant */}
          <motion.div
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-premium flex flex-col justify-between"
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-brand-teal font-bold text-sm flex items-center justify-center">
                    A
                  </div>
                  <div>
                    <div className="text-xs font-bold text-brand-navy">Amadou K.</div>
                    <div className="text-[11px] text-brand-muted">
                      {t("showcase.testimonial2Role", "Professeur de Français • Dixinn")}
                    </div>
                  </div>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                {t(
                  "showcase.testimonial2Text",
                  "« 85% de commission nette et des versements directs sur mon Orange Money dès que le parent valide. C'est sérieux et valorisant. »"
                )}
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-brand-teal font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Professeur Certifié • Paiements Ponctuels</span>
            </div>
          </motion.div>

        </div>

      </div>
    </SectionContainer>
  );
}
