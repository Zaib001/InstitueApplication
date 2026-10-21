"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { RadialDonutGauge } from "./RadialDonutGauge";

export function HeroSection() {
  const { locale, t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#16385c] via-[#153456] to-[#0f243c] text-white min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] lg:max-h-[880px] flex flex-col justify-center">
      {/* 1. Lignes de niveau / Courbes topographiques concentriques inspirées de Lexicon */}
      <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden opacity-25">
        <svg
          className="absolute -top-28 -left-28 w-[820px] h-[820px] text-cyan-300"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="400" cy="400" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="400" cy="400" r="260" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="400" cy="400" r="340" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="400" cy="400" r="420" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="400" cy="400" r="500" stroke="currentColor" strokeWidth="1" />
        </svg>

        <svg
          className="absolute -bottom-40 -right-40 w-[900px] h-[900px] text-amber-300"
          viewBox="0 0 900 900"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="450" cy="450" rx="220" ry="280" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx="450" cy="450" rx="320" ry="380" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="450" cy="450" rx="420" ry="480" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" />
          <ellipse cx="450" cy="450" rx="520" ry="580" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Halo lumineux d'ambiance */}
      <div className="absolute top-1/4 right-1/4 w-[480px] h-[480px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full h-full flex flex-col justify-center py-4 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center h-full">
          
          {/* Colonne Gauche — Titre 2 Lignes, Boutons Pill, Paragraphe 2 Lignes, Carte Métrique */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-5 text-left flex flex-col justify-center">
            
            {/* Titre Principal Editorial Serif — EXACTEMENT 2 LIGNES comme la référence Lexicon */}
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[58px] font-serif font-bold text-white tracking-tight leading-[1.08] max-w-2xl"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {locale === "en" ? (
                <>
                  <span className="block">The Bridge to</span>
                  <span className="block">
                    Your Child's Best Self
                    <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#e59a38] rounded-xs ml-1.5 align-baseline shadow-sm" aria-hidden="true" />
                  </span>
                </>
              ) : (
                <>
                  <span className="block">Le Pont vers l'Excellence</span>
                  <span className="block">
                    de Vos Enfants
                    <span className="inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#e59a38] rounded-xs ml-1.5 align-baseline shadow-sm" aria-hidden="true" />
                  </span>
                </>
              )}
            </motion.h1>

            {/* Boutons d'Action Pill Exactement Identiques à Lexicon */}
            <motion.div
              className="flex flex-wrap items-center gap-3.5 pt-1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            >
              <Link
                href="/register?role=parent"
                className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center cursor-pointer hover:shadow-amber-500/40"
              >
                {t("hero.tryLesson", "Essayer un cours")}
              </Link>

              <a
                href="#comment-ca-marche"
                className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#1c436b]/60 hover:bg-[#1c436b] text-white border border-white/20 font-semibold text-sm sm:text-base transition-all backdrop-blur-sm inline-flex items-center justify-center cursor-pointer hover:border-white/40"
              >
                {t("hero.howItWorks", "Comment ça marche")}
              </a>
            </motion.div>

            {/* Sous-titre Réassurance — EXACTEMENT 2 LIGNES comme Lexicon */}
            <motion.div
              className="text-sm sm:text-[15px] text-slate-200/90 leading-relaxed max-w-xl font-normal pt-0.5"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            >
              {locale === "en" ? (
                <>
                  <p className="block">Access certified elite tutors in Conakry and across Guinea designed to help</p>
                  <p className="block">your children excel academically and reach their peak potential.</p>
                </>
              ) : (
                <>
                  <p className="block">Accédez à des répétiteurs d'élite rigoureusement certifiés à Conakry et en Guinée pour</p>
                  <p className="block">propulser l'avenir scolaire de vos enfants et révéler leur plein potentiel.</p>
                </>
              )}
            </motion.div>

            {/* Carte Métrique Réplique Exacte Lexicon avec Jauge Circulaire à Lignes Séparées Bégère & Agrandie */}
            <motion.div
              className="pt-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            >
              <div className="rounded-2xl border border-amber-400/40 bg-[#163557]/70 backdrop-blur-md p-4 sm:p-5 shadow-2xl max-w-[490px]">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Puces de gauche avec tiret doré "—" et espacement soigné */}
                  <div className="sm:col-span-7 space-y-2.5 text-xs sm:text-[13px] text-slate-100 font-medium">
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2.5 text-base leading-none">—</span>
                      <span>{t("hero.metricPoint1", "Progression Rapide")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2.5 text-base leading-none">—</span>
                      <span>{t("hero.metricPoint2", "Maîtrise des Notions")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2.5 text-base leading-none">—</span>
                      <span>{t("hero.metricPoint3", "99% Satisfaction Parents")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2.5 text-base leading-none">—</span>
                      <span>{t("hero.metricPoint4", "Suivi Personnalisé")}</span>
                    </div>
                  </div>

                  {/* Jauge Donut Circulaire 96.7% Bégère avec Barres Séparées (Tick Lines) */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center sm:border-l sm:border-white/10 sm:pl-3">
                    <RadialDonutGauge value={96.7} />
                  </div>

                </div>
              </div>
            </motion.div>

          </div>

          {/* Colonne Droite — Étudiante Française Sans Fond avec Effet 3D & Animation Infinitésimale */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-end h-full">
            <div className="relative w-full max-w-[380px] sm:max-w-[440px] lg:max-w-[500px] flex items-end justify-center">
              
              {/* Image Détourée Transparente avec Effet 3D et Animation Flottante Infinie */}
              <div className="relative w-full aspect-[3/4] max-h-[calc(100vh-120px)] animate-float-infinite">
                <Image
                  src="/images/hero_student_transparent.png"
                  alt="Étudiante française Monsieur Fanyi avec classeur et cahiers de cours"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 500px"
                  className="object-contain object-bottom drop-shadow-[0_25px_35px_rgba(0,0,0,0.55)] drop-shadow-[0_10px_20px_rgba(15,36,60,0.7)]"
                />
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
