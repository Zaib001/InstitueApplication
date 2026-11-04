"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import {
  Search,
  ArrowRight,
  User,
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
    <div className="w-full flex flex-col">

      {/* ======================================================== */}
      {/* 1. HERO : IMAGE ULTRA-HD 4K, OVERLAY SOMBRE & COURBE      */}
      {/* ======================================================== */}
      <section id="accueil" className="relative w-full overflow-hidden bg-[#0a1626] min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex flex-col justify-between">

        {/* Arrière-plan complet : Photo Ultra-HD 4K nette et détaillée */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_student_ultra_hd_4k.jpg"
            alt="Soutien scolaire d'excellence Monsieur Fanyi"
            fill
            priority
            className="object-cover object-right"
            sizes="100vw"
          />
          {/* Overlay sombre cinématographique à gauche pour contraste parfait du texte */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#071322]/95 via-[#0b1d33]/85 to-transparent sm:w-[70%] lg:w-[60%] pointer-events-none" />
          {/* Vignette sombre générale pour profondeur et cohérence visuelle */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25 pointer-events-none" />
        </div>

        {/* Écriture Manuscrite Cursive "Chaque enfant peut réussir." : Placée en HAUT À DROITE */}
        <div className="absolute top-4 sm:top-6 lg:top-8 right-4 sm:right-6 lg:right-10 xl:right-18 z-20 pointer-events-none">
          <div className="text-center select-none rotate-[-4deg]">
            <span className="font-handwriting text-white text-xl sm:text-2xl lg:text-4xl font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] leading-tight block tracking-wide">
              {locale === "en" ? (
                <>Every child<br />can succeed.</>
              ) : (
                <>Chaque enfant<br />peut réussir.</>
              )}
            </span>

            {/* Soulignement manuscrit arc de cercle */}
            <svg
              className="w-20 sm:w-28 lg:w-32 h-4 sm:h-5 mx-auto text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.7)] overflow-visible -mt-1"
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

            {/* Étoile scintillante dorée */}
            <div className="absolute -top-2 -right-3 text-amber-300 drop-shadow-md">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
            </div>
          </div>
        </div>

        {/* Contenu textuel et call-out par-dessus l'arrière-plan */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-10 sm:pt-14 lg:pt-16 pb-14 sm:pb-16">
          <div className="max-w-xl lg:max-w-2xl">
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.12] drop-shadow-sm">
              <span className="block">
                {t("hero.quoteTitle1", "L'éducation est")}
              </span>
              <span className="block mt-1 sm:mt-1.5">
                <span className="font-handwriting text-5xl sm:text-6xl lg:text-[72px] font-bold text-[#f9c450] drop-shadow-md tracking-wide">
                  {t("hero.quoteHighlight", "la seule arme")}
                </span>
              </span>
              <span className="block mt-1 sm:mt-1.5 text-white">
                {t("hero.quoteTitle2", "pour s'en sortir.")}
              </span>
            </h1>

            {/* Auteur */}
            <p className="text-xs sm:text-sm font-semibold text-slate-300 italic mt-2.5">
              {t("hero.quoteAuthor", "— Nelson Mandela")}
            </p>

            {/* Sous-texte en blanc adouci haute lisibilité */}
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-lg mt-5 sm:mt-6 drop-shadow-xs">
              {t(
                "hero.subparagraph",
                "MonsieurFanyi aide les parents à trouver le bon professeur pour leurs enfants. Des enseignants qualifiés, adaptés aux besoins de chaque élève, pour un avenir meilleur."
              )}
            </p>

            {/* Boutons d'Action Pill */}
            <div className="flex flex-wrap items-center gap-3.5 sm:gap-4 mt-7 sm:mt-8">
              {/* CTA 1 : Trouver un professeur (Bouton Jaune Doré) */}
              <Link
                href="/parent/dashboard"
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full bg-[#f9c450] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2.5 group cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-900 group-hover:scale-110 transition-transform" />
                <span>{t("hero.btnFindTeacher", "Trouver un professeur")}</span>
                <ArrowRight className="w-4 h-4 text-slate-900 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* CTA 2 : Je suis professeur (Bouton Verre Dépoli & Bordure Blanche) */}
              <Link
                href="/register?role=teacher"
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/30 backdrop-blur-md shadow-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 text-white" />
                <span>{t("hero.btnImTeacher", "Je suis professeur")}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Courbe douce au bas du Hero reliant la section suivante */}
        <div className="relative w-full overflow-hidden leading-none z-10 -mb-0.5 pointer-events-none">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-8 sm:h-12 lg:h-16 text-white block"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 25 C360 55 1080 5 1440 30 L1440 60 L0 60 Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SECTION DES 4 PILIERS DE VALEUR (GRANDES ICÔNES & LIGNE VAGUELETTE) */}
      {/* ======================================================== */}
      <section className="w-full bg-white py-8 sm:py-10 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">

            {/* Pilier 1 : Des professeurs qualifiés (Bleu) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 group">
              <div className="relative text-blue-600 mb-3 transform group-hover:scale-110 transition-transform duration-300">
                <User className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.75]" aria-hidden="true" />
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 absolute -top-1 -right-1" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#152e4d]">
                {t("hero.feature1Title", "Des professeurs qualifiés")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                {t("hero.feature1Desc", "Des enseignants vérifiés et expérimentés.")}
              </p>
              {/* Ligne incurvée en vaguelette identique à celle du bas */}
              <svg
                className="w-16 sm:w-20 h-3 text-blue-600 mt-3 sm:mt-3.5"
                viewBox="0 0 80 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8C22 2 58 3 77 9"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Pilier 2 : Une recherche facile (Vert / Sarcelle) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 group">
              <div className="text-teal-600 mb-3 transform group-hover:scale-110 transition-transform duration-300">
                <Search className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.75]" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#152e4d]">
                {t("hero.feature2Title", "Une recherche facile")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                {t("hero.feature2Desc", "Trouvez rapidement le prof qui correspond aux besoins de votre enfant.")}
              </p>
              {/* Ligne incurvée en vaguelette */}
              <svg
                className="w-16 sm:w-20 h-3 text-teal-500 mt-3 sm:mt-3.5"
                viewBox="0 0 80 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8C22 2 58 3 77 9"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Pilier 3 : Un suivi rassurant (Violet) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 group">
              <div className="text-purple-600 mb-3 transform group-hover:scale-110 transition-transform duration-300">
                <ShieldCheck className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.75]" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#152e4d]">
                {t("hero.feature3Title", "Un suivi rassurant")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                {t("hero.feature3Desc", "Suivez les progrès et les cours de votre enfant en toute simplicité.")}
              </p>
              {/* Ligne incurvée en vaguelette */}
              <svg
                className="w-16 sm:w-20 h-3 text-purple-600 mt-3 sm:mt-3.5"
                viewBox="0 0 80 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8C22 2 58 3 77 9"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Pilier 4 : Pour tous les niveaux (Jaune / Ambre) */}
            <div className="flex flex-col items-center text-center px-4 pt-4 sm:pt-0 group">
              <div className="text-amber-500 mb-3 transform group-hover:scale-110 transition-transform duration-300">
                <Users className="w-10 h-10 sm:w-11 sm:h-11 stroke-[1.75]" aria-hidden="true" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#152e4d]">
                {t("hero.feature4Title", "Pour tous les niveaux")}
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 max-w-[220px] leading-relaxed">
                {t("hero.feature4Desc", "Du primaire au lycée, toutes les matières.")}
              </p>
              {/* Ligne incurvée en vaguelette */}
              <svg
                className="w-16 sm:w-20 h-3 text-amber-500 mt-3 sm:mt-3.5"
                viewBox="0 0 80 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8C22 2 58 3 77 9"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SECTION CITATION D'ENGAGEMENT & 3 PHOTOS SERRÉES     */}
      {/* ======================================================== */}
      <section className="w-full bg-[#fbf9f5] py-12 sm:py-16 scroll-mt-20 lg:scroll-mt-24" id="a-propos">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

            {/* Colonne Gauche : Guillemet & Texte soigné */}
            <div className="lg:col-span-5 flex flex-col justify-center text-left">
              {/* Grand guillemet ouvrant doré */}
              <div className="text-[#f59e0b] text-6xl font-serif font-bold leading-none select-none -mb-2">
                “
              </div>

              {/* Titre Manuscrit Cursif */}
              <h2 className="font-handwriting text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#1b3a60] leading-[1.25] tracking-wide">
                {t(
                  "hero.quote2Title",
                  "Derrière chaque enfant qui réussit, il y a des personnes qui croient en lui."
                )}
              </h2>

              {/* Texte explicatif */}
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-4 max-w-md">
                {t(
                  "hero.quote2Desc",
                  "Avec MonsieurFanyi, vous ne trouvez pas seulement un professeur, vous trouvez un partenaire pour accompagner la réussite de votre enfant."
                )}
              </p>
            </div>

            {/* Colonne Droite : 3 Photos avec Espacement Serré (Low Gap) & Dimensions Agrandies */}
            <div className="lg:col-span-7 flex items-center justify-center lg:justify-end">
              <div className="flex items-center gap-3 sm:gap-4 max-w-2xl">

                {/* Photo 1 (Gauche) : Portrait vertical haut agrandi */}
                <div className="w-56 sm:w-64 lg:w-72 aspect-[3/4] bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 rotate-[-1.5deg] hover:rotate-0 hover:scale-105 transition-all duration-300 shrink-0">
                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                    <Image
                      src="/images/collage_teacher_boy_new.jpg"
                      alt="Professeur Monsieur Fanyi aidant attentivement un élève"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 35vw"
                    />
                  </div>
                </div>

                {/* Photos 2 & 3 (Droite) : Empilées verticalement avec low gap & dimensions agrandies */}
                <div className="flex flex-col gap-3 sm:gap-3.5 shrink-0">
                  {/* Photo 2 (Haut droite) */}
                  <div className="w-52 sm:w-60 lg:w-68 aspect-[4/3] bg-white p-2.5 sm:p-3 rounded-2xl shadow-lg border border-slate-200/80 rotate-[1.5deg] hover:rotate-0 hover:scale-105 transition-all duration-300">
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src="/images/collage_mother_child_new.jpg"
                        alt="Séance de travail à la maison avec l'élève"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 45vw, 30vw"
                      />
                    </div>
                  </div>

                  {/* Photo 3 (Bas droite) */}
                  <div className="w-52 sm:w-60 lg:w-68 aspect-[4/3] bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-slate-200/80 rotate-[-1deg] hover:rotate-0 hover:scale-105 transition-all duration-300">
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-100">
                      <Image
                        src="/images/collage_female_teacher_new.jpg"
                        alt="Enseignante certifiée devant le tableau noir"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 45vw, 30vw"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. BANNIÈRE BLEUE PURE AVEC VAGUE SUPÉRIEURE EN FLUX HARMONIQUE */}
      {/* ======================================================== */}
      <section className="relative w-full bg-gradient-to-r from-[#0c233f] via-[#0f2a4a] to-[#153a63] text-white">

        {/* Vague supérieure fluide en harmonie avec la courbe du hero */}
        <div className="w-full overflow-hidden leading-none -mt-0.5">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-8 sm:h-12 lg:h-16 text-[#fbf9f5] block"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M0 0 L1440 0 L1440 25 C1080 0 360 60 0 30 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">

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

            {/* 3 Piliers d'Impact à droite avec GRANDES ICÔNES dorées */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 text-center sm:text-left">

              {/* Pilier 1 : Meilleures réussites scolaires */}
              <div className="flex flex-col sm:items-center text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f9c450] mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
                </div>
                <p className="text-sm sm:text-base font-bold text-white max-w-[190px]">
                  {t("hero.bannerPillar1", "Meilleures réussites scolaires")}
                </p>
              </div>

              {/* Pilier 2 : Plus de confiance en soi */}
              <div className="flex flex-col sm:items-center text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f9c450] mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Heart className="w-8 h-8 sm:w-10 sm:h-10 fill-[#f9c450]/20" aria-hidden="true" />
                </div>
                <p className="text-sm sm:text-base font-bold text-white max-w-[190px]">
                  {t("hero.bannerPillar2", "Plus de confiance en soi")}
                </p>
              </div>

              {/* Pilier 3 : Un avenir plus serein */}
              <div className="flex flex-col sm:items-center text-center group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#f9c450] mx-auto mb-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <Sun className="w-8 h-8 sm:w-10 sm:h-10" aria-hidden="true" />
                </div>
                <p className="text-sm sm:text-base font-bold text-white max-w-[190px]">
                  {t("hero.bannerPillar3", "Un avenir plus serein")}
                </p>
              </div>

            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
