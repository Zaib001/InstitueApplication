"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import {
  Search,
  ArrowRight,
  User,
  UserCheck,
  Star,
  ShieldCheck,
  Users,
  GraduationCap,
  Heart,
  Sun,
  Sparkles,
} from "lucide-react";

export function HeroSection() {
  const { locale, t } = useTranslation();

  return (
    <div className="w-full bg-[#fdfdfd] text-slate-800 pt-3 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ======================================================== */}
        {/* 1. HERO PRINCIPAL : CITATION MANDELA & ÉLÈVE EN CLASSE    */}
        {/* ======================================================== */}
        <section className="relative pt-4 pb-8 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Colonne Gauche : Titre Nelson Mandela, Description & Boutons CTA */}
            <motion.div
              className="lg:col-span-6 flex flex-col justify-center text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Grand Titre Nelson Mandela avec "la seule arme" en script doré */}
              <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-extrabold text-[#152e4d] tracking-tight leading-[1.12]">
                <span className="block">
                  {t("hero.quoteTitle1", "L'éducation est")}
                </span>
                <span className="block mt-1 sm:mt-1.5">
                  <span className="font-handwriting text-5xl sm:text-6xl lg:text-[70px] font-bold text-[#f59e0b] drop-shadow-xs tracking-wide">
                    {t("hero.quoteHighlight", "la seule arme")}
                  </span>
                </span>
                <span className="block mt-1 sm:mt-1.5">
                  {t("hero.quoteTitle2", "pour s'en sortir.")}
                </span>
              </h1>

              {/* Attribution de la citation */}
              <p className="text-xs sm:text-sm font-semibold text-slate-500 italic mt-2.5">
                {t("hero.quoteAuthor", "— Nelson Mandela")}
              </p>

              {/* Paragraphe descriptif */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mt-5 sm:mt-6">
                {t(
                  "hero.subparagraph",
                  "MonsieurFanyi aide les parents à trouver le bon professeur pour leurs enfants. Des enseignants qualifiés, adaptés aux besoins de chaque élève, pour un avenir meilleur."
                )}
              </p>

              {/* Deux Boutons Pill d'Action */}
              <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mt-7 sm:mt-8">
                {/* CTA Primaire : Trouver un professeur (Bouton Jaune Doré) */}
                <Link
                  href="/parent/dashboard"
                  className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#f9c450] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 group cursor-pointer"
                >
                  <Search className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" />
                  <span>{t("hero.btnFindTeacher", "Trouver un professeur")}</span>
                  <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* CTA Secondaire : Je suis professeur (Bouton Blanc Bordé) */}
                <Link
                  href="/register?role=teacher"
                  className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm border border-slate-700/80 shadow-xs transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-700" />
                  <span>{t("hero.btnImTeacher", "Je suis professeur")}</span>
                </Link>
              </div>
            </motion.div>

            {/* Colonne Droite : Photo Élève en Classe avec Écriture Manuscrite "Chaque enfant peut réussir." */}
            <motion.div
              className="lg:col-span-6 relative w-full"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            >
              <div className="relative w-full aspect-[4/3] sm:aspect-[14/11] lg:aspect-[13/10] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-amber-900/10">
                <Image
                  src="/images/hero_classroom_girl_clean.jpg"
                  alt="Élève souriante et attentive en classe Monsieur Fanyi"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {/* Léger dégradé d'ambiance pour faire ressortir le texte manuscrit */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10 pointer-events-none" />

                {/* Écriture Manuscrite Cursive en Haut à Droite : "Chaque enfant peut réussir." */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-7 lg:top-7 lg:right-9 z-20 text-center select-none rotate-[-4deg] pointer-events-none">
                  <span className="font-handwriting text-white text-2xl sm:text-3xl lg:text-4xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] leading-tight block tracking-wide">
                    {locale === "en" ? (
                      <>Every child<br />can succeed.</>
                    ) : (
                      <>Chaque enfant<br />peut réussir.</>
                    )}
                  </span>

                  {/* Soulignement manuscrit arc de cercle en SVG blanc */}
                  <svg
                    className="w-24 sm:w-32 h-5 mx-auto text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] overflow-visible -mt-1"
                    viewBox="0 0 140 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 14C35 4 105 5 136 18"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Étoile scintillante dorée à droite du texte */}
                  <div className="absolute -top-2.5 -right-3.5 text-amber-300 drop-shadow-md">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. BANDEAU DES 4 PILIERS DE VALEUR AVEC ACCENTS COLORÉS   */}
        {/* ======================================================== */}
        <section className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm py-6 sm:py-8 px-4 sm:px-6 my-6 sm:my-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            
            {/* Pilier 1 : Des professeurs qualifiés (Bleu) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 pb-2">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3 relative">
                <UserCheck className="w-6 h-6" />
                <Star className="w-3 h-3 text-amber-500 fill-amber-500 absolute top-2 right-2" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#152e4d]">
                {t("hero.feature1Title", "Des professeurs qualifiés")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-[210px] leading-relaxed">
                {t("hero.feature1Desc", "Des enseignants vérifiés et expérimentés.")}
              </p>
              <div className="w-10 h-1 bg-blue-600 rounded-full mt-3.5" />
            </div>

            {/* Pilier 2 : Une recherche facile (Vert / Sarcelle) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 pb-2">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#152e4d]">
                {t("hero.feature2Title", "Une recherche facile")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-[210px] leading-relaxed">
                {t("hero.feature2Desc", "Trouvez rapidement le prof qui correspond aux besoins de votre enfant.")}
              </p>
              <div className="w-10 h-1 bg-teal-500 rounded-full mt-3.5" />
            </div>

            {/* Pilier 3 : Un suivi rassurant (Violet) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 pb-2">
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#152e4d]">
                {t("hero.feature3Title", "Un suivi rassurant")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-[210px] leading-relaxed">
                {t("hero.feature3Desc", "Suivez les progrès et les cours de votre enfant en toute simplicité.")}
              </p>
              <div className="w-10 h-1 bg-purple-600 rounded-full mt-3.5" />
            </div>

            {/* Pilier 4 : Pour tous les niveaux (Jaune / Ambre) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 pb-2">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#152e4d]">
                {t("hero.feature4Title", "Pour tous les niveaux")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1 max-w-[210px] leading-relaxed">
                {t("hero.feature4Desc", "Du primaire au lycée, toutes les matières.")}
              </p>
              <div className="w-10 h-1 bg-amber-500 rounded-full mt-3.5" />
            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. SECTION CITATION D'ENGAGEMENT & COLLAGE DE 3 PHOTOS   */}
        {/* ======================================================== */}
        <section className="py-8 sm:py-14" id="a-propos">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Colonne Gauche : Grand Guillemet Doré, Citation Manuscrite & Texte */}
            <div className="lg:col-span-5 flex flex-col justify-center text-left">
              {/* Grand guillemet ouvrant doré */}
              <div className="text-[#f59e0b] text-6xl sm:text-7xl font-serif font-bold leading-none select-none -mb-3 sm:-mb-4">
                “
              </div>

              {/* Titre Manuscrit / Cursive */}
              <h2 className="font-handwriting text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#1b3a60] leading-[1.25] tracking-wide">
                {t(
                  "hero.quote2Title",
                  "Derrière chaque enfant qui réussit, il y a des personnes qui croient en lui."
                )}
              </h2>

              {/* Texte explicatif */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-5 max-w-md">
                {t(
                  "hero.quote2Desc",
                  "Avec MonsieurFanyi, vous ne trouvez pas seulement un professeur, vous trouvez un partenaire pour accompagner la réussite de votre enfant."
                )}
              </p>
            </div>

            {/* Colonne Droite : Composition Polaroid de 3 Photos en Cartes Blanches */}
            <div className="lg:col-span-7 relative w-full h-[360px] sm:h-[420px] flex items-center justify-center">
              
              {/* Photo 1 (Gauche, plus grande) : Professeur masculin aidant un jeune élève */}
              <div className="absolute left-2 sm:left-6 top-6 sm:top-4 w-44 sm:w-56 aspect-[3/4] bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 rotate-[-3deg] z-20 hover:rotate-0 hover:scale-105 transition-all duration-300">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src="/images/collage_teacher_boy.jpg"
                    alt="Professeur Monsieur Fanyi aidant attentivement un élève"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>

              {/* Photo 2 (Haut Droite) : Mère / tutrice accompagnant un enfant */}
              <div className="absolute right-2 sm:right-6 top-1 sm:top-2 w-44 sm:w-52 aspect-[4/3] bg-white p-2 sm:p-2.5 rounded-2xl shadow-lg border border-slate-200/80 rotate-[3.5deg] z-10 hover:rotate-0 hover:scale-105 transition-all duration-300">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src="/images/collage_mother_child.jpg"
                    alt="Séance de travail à la maison avec l'élève"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>

              {/* Photo 3 (Bas Droite) : Enseignante souriante devant le tableau avec livres */}
              <div className="absolute right-4 sm:right-10 bottom-2 sm:bottom-4 w-44 sm:w-52 aspect-[4/3] bg-white p-2 sm:p-2.5 rounded-2xl shadow-xl border border-slate-200/80 rotate-[-2deg] z-20 hover:rotate-0 hover:scale-105 transition-all duration-300">
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                  <Image
                    src="/images/collage_female_teacher.jpg"
                    alt="Enseignante certifiée devant le tableau noir"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. BANNIÈRE BLEUE PANORAMIQUE AVEC VAGUE & 3 VALEURS     */}
        {/* ======================================================== */}
        <section className="relative overflow-hidden rounded-3xl bg-[#0f2a4a] text-white shadow-2xl mt-4 sm:mt-8">
          
          {/* Arrière-plan paysage teinté en bleu nuit océan */}
          <div className="absolute inset-0 opacity-30 mix-blend-overlay">
            <Image
              src="/images/banner_blue_bg.jpg"
              alt="Vue panoramique"
              fill
              className="object-cover object-bottom"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c233f] via-[#112d4e]/95 to-[#163a63]/90" />

          <div className="relative z-10 px-6 sm:px-12 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Texte de gauche : "Ensemble, donnons à chaque enfant les moyens de réussir." */}
            <div className="lg:col-span-6 space-y-1">
              <h2 className="text-2xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-tight">
                <span className="block font-serif font-bold">
                  {t("hero.bannerTitle1", "Ensemble,")}
                </span>
                <span className="block font-serif font-bold">
                  {t("hero.bannerTitle2", "donnons à chaque enfant")}
                </span>
                <span className="block font-handwriting text-[#f9c450] text-3xl sm:text-5xl lg:text-[54px] font-bold mt-1 sm:mt-1.5 drop-shadow-xs">
                  {t("hero.bannerHighlight", "les moyens de réussir.")}
                </span>
              </h2>

              {/* Vaguelette / soulignement doré en SVG */}
              <svg
                className="w-48 sm:w-64 h-4 text-[#f9c450] -mt-1 sm:-mt-0.5"
                viewBox="0 0 240 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 10C60 2 180 3 236 12"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* 3 Piliers d'Impact à droite avec icônes dorées */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
              
              {/* Pilier 1 : Meilleures réussites scolaires */}
              <div className="flex flex-col sm:items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#f9c450] mx-auto mb-2.5 shadow-xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {t("hero.bannerPillar1", "Meilleures réussites scolaires")}
                </p>
              </div>

              {/* Pilier 2 : Plus de confiance en soi */}
              <div className="flex flex-col sm:items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#f9c450] mx-auto mb-2.5 shadow-xs">
                  <Heart className="w-6 h-6 fill-[#f9c450]/20" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {t("hero.bannerPillar2", "Plus de confiance en soi")}
                </p>
              </div>

              {/* Pilier 3 : Un avenir plus serein */}
              <div className="flex flex-col sm:items-center text-center">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#f9c450] mx-auto mb-2.5 shadow-xs">
                  <Sun className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {t("hero.bannerPillar3", "Un avenir plus serein")}
                </p>
              </div>

            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
