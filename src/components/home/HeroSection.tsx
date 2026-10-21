"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#16385c] via-[#153456] to-[#0f243c] text-white pt-8 pb-16 lg:pt-14 lg:pb-24">
      {/* 1. Lignes de niveau / Courbes topographiques concentriques inspirées de Lexicon */}
      <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden opacity-20">
        <svg
          className="absolute -top-32 -left-32 w-[900px] h-[900px] text-cyan-300"
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
          className="absolute -bottom-48 -right-48 w-[1000px] h-[1000px] text-amber-300"
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
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Colonne Gauche — Titre Serif, Boutons Pill Lexicon & Carte Métrique */}
          <div className="lg:col-span-7 space-y-7 sm:space-y-8 text-left">
            
            {/* Titre Principal Editorial Serif (Lexicon Match) */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-serif font-bold text-white tracking-tight leading-[1.08]">
              {t("hero.headline", "Le Pont vers l'Excellence de Vos Enfants")}
              <span className="inline-block w-3 h-3 bg-[#e59a38] rounded-xs ml-1.5 align-baseline shadow-sm" aria-hidden="true" />
            </h1>

            {/* Boutons d'Action Pill Exactement Identiques à Lexicon */}
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/register?role=parent"
                className="px-8 py-3.5 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm sm:text-base shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center justify-center cursor-pointer"
              >
                {t("hero.tryLesson", "Essayer un cours")}
              </Link>

              <a
                href="#comment-ca-marche"
                className="px-8 py-3.5 rounded-full bg-[#1c436b]/60 hover:bg-[#1c436b] text-white border border-white/20 font-semibold text-sm sm:text-base transition-all backdrop-blur-sm inline-flex items-center justify-center cursor-pointer"
              >
                {t("hero.howItWorks", "Comment ça marche")}
              </a>
            </div>

            {/* Sous-titre Réassurance */}
            <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-xl font-normal">
              {t(
                "hero.subtitle",
                "Accédez à des répétiteurs d'élite rigoureusement certifiés à Conakry et en Guinée pour propulser l'avenir scolaire de vos enfants et révéler leur plein potentiel."
              )}
            </p>

            {/* Carte Métrique Réplique Exacte Lexicon (Card avec bordure dorée fine & gauge SVG) */}
            <div className="pt-2">
              <div className="rounded-2xl border border-amber-400/40 bg-[#163557]/60 backdrop-blur-md p-5 sm:p-6 shadow-2xl max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                  
                  {/* Puces avec tiret doré "—" */}
                  <div className="sm:col-span-7 space-y-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2 text-base">—</span>
                      <span>{t("hero.metricPoint1", "Progression Rapide")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2 text-base">—</span>
                      <span>{t("hero.metricPoint2", "Maîtrise des Notions")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2 text-base">—</span>
                      <span>{t("hero.metricPoint3", "99% Satisfaction Parents")}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-[#e59a38] font-bold mr-2 text-base">—</span>
                      <span>{t("hero.metricPoint4", "Suivi Personnalisé")}</span>
                    </div>
                  </div>

                  {/* Jauge Donut Circulaire 96.7% Success Rate */}
                  <div className="sm:col-span-5 flex flex-col items-center justify-center sm:border-l sm:border-white/10 sm:pl-4">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Piste de fond sombre */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="#1e3e60"
                          strokeWidth="8"
                          fill="transparent"
                        />
                        {/* Arc de progression doré 96.7% */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="#e59a38"
                          strokeWidth="8"
                          strokeDasharray="238.76"
                          strokeDashoffset="28"
                          strokeLinecap="round"
                          fill="transparent"
                        />
                      </svg>

                      {/* Indicateur point lumineux sur l'arc */}
                      <div
                        className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] border-2 border-[#e59a38]"
                        style={{
                          top: "84px",
                          left: "40px",
                        }}
                      />

                      {/* Texte au centre de la jauge */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-extrabold text-white tracking-tight leading-none">
                          96.7%
                        </span>
                        <span className="text-[9px] text-slate-300 font-medium tracking-tight mt-1 leading-tight">
                          {t("hero.successRate", "Taux de Réussite")}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Colonne Droite — Étudiante Française Sans Fond avec Effet 3D & Animation Infinitésimale */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end items-end">
            <div className="relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[520px] flex items-end justify-center">
              
              {/* Image Détourée Transparente de l'Étudiante avec Effet 3D & Animation Flottante Infinie */}
              <div className="relative w-full aspect-[3/4] animate-float-infinite">
                <Image
                  src="/images/hero_student_transparent.png"
                  alt="Étudiante française Monsieur Fanyi avec classeur et cahiers de cours"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 520px"
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
