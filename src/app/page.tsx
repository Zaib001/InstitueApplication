"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Award,
  ArrowRight,
  Calculator,
  HelpCircle,
} from "lucide-react";

export default function HomePage() {
  const { t, formatCurrencyGNF } = useTranslation();

  return (
    <div className="w-full flex flex-col space-y-16 lg:space-y-24 py-8 md:py-12">
      {/* 1. HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy-dark text-white p-8 sm:p-12 lg:p-16 shadow-xl">
          {/* Décoration d'arrière-plan */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-brand-blue/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-brand-teal/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-brand-gold tracking-wide">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>{t("hero.badge", "Plateforme Certifiée — République de Guinée")}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
              {t("hero.title", "Donnez à vos enfants les clés de la réussite scolaire")}
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
              {t(
                "hero.subtitle",
                "Trouvez un professeur particulier rigoureusement vérifié à Conakry et dans toute la Guinée. Paiements sécurisés par Orange Money et MTN, suivi pédagogique transparent après chaque séance."
              )}
            </p>

            {/* Boutons d'Action (CTAs) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/register?role=parent"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-blue hover:bg-brand-blue-light text-white font-semibold text-sm sm:text-base shadow-lg shadow-brand-blue/25 hover:shadow-brand-blue/40 transition-all"
              >
                <span>{t("hero.ctaParent", "Trouver un professeur pour mon enfant")}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                href="/register?role=teacher"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm sm:text-base transition-all"
              >
                <span>{t("hero.ctaTeacher", "Devenir professeur Monsieur Fanyi")}</span>
              </Link>
            </div>

            {/* Statistiques clés & Réassurance */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Award className="w-5 h-5 text-brand-gold shrink-0" aria-hidden="true" />
                <span>{t("hero.statTutors", "Professeurs vérifiés avec diplômes")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Calculator className="w-5 h-5 text-brand-teal shrink-0" aria-hidden="true" />
                <span>{t("hero.statCommission", "15 % de commission transparente")}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <GraduationCap className="w-5 h-5 text-blue-400 shrink-0" aria-hidden="true" />
                <span>{t("hero.statCurriculum", "Conforme au programme national guinéen")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-brand-navy">
            {t("howItWorks.title", "Une mise en relation simple, transparente et sécurisée")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("howItWorks.subtitle", "Chaque étape est pensée pour protéger l'investissement des parents et valoriser l'excellence des enseignants.")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Étape 1 */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold text-lg mb-4" aria-hidden="true">
              1
            </div>
            <h3 className="font-bold text-lg text-brand-navy mb-2">
              {t("howItWorks.step1Title", "Publiez votre besoin")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("howItWorks.step1Desc", "Indiquez la classe de votre enfant, la matière (Maths, Français, Physique...), le budget et votre quartier à Conakry ou en ligne.")}
            </p>
          </div>

          {/* Étape 2 */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-teal flex items-center justify-center font-bold text-lg mb-4" aria-hidden="true">
              2
            </div>
            <h3 className="font-bold text-lg text-brand-navy mb-2">
              {t("howItWorks.step2Title", "Choisissez votre professeur")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("howItWorks.step2Desc", "Recevez les candidatures de professeurs dont les diplômes et l'identité ont été vérifiés manuellement par l'administration.")}
            </p>
          </div>

          {/* Étape 3 */}
          <div className="p-6 rounded-2xl bg-card border border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-4" aria-hidden="true">
              3
            </div>
            <h3 className="font-bold text-lg text-brand-navy mb-2">
              {t("howItWorks.step3Title", "Validez après chaque cours")}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("howItWorks.step3Desc", "Le professeur soumet son compte-rendu. Le reversement n'a lieu QUE si vous confirmez que la séance a bien eu lieu.")}
            </p>
          </div>
        </div>
      </section>

      {/* 3. SIMULATEUR DE FORFAIT CONFORME AU SRD V2.0 */}
      <section id="tarifs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-slate-50/70 p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-brand-blue text-xs font-semibold">
                <Calculator className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t("simulator.badge", "Exemple Officiel de Tarification — SRD V2.0")}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
                {t("simulator.title", "Zéro mauvaise surprise : Répartition exacte 15 % / 85 %")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("simulator.subtitle", "Les forfaits mensuels sont fractionnés en valeur unitaire exacte par séance. Une séance n'est payée au professeur que lorsqu'elle est réalisée et confirmée.")}
              </p>

              <div className="space-y-3 pt-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                  <span>{t("simulator.bulletPackage", "Prix forfait mensuel type : 400 000 GNF pour 8 séances de 60 min")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                  <span>{t("simulator.bulletUnit", "Valeur d'une séance unitaire : 50 000 GNF")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                  <span>{t("simulator.bulletPlatform", "Part plateforme (15 %) : 7 500 GNF / séance")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" aria-hidden="true" />
                  <span>{t("simulator.bulletTeacher", "Part nette professeur (85 %) : 42 500 GNF / séance")}</span>
                </div>
              </div>
            </div>

            {/* Carte Récapitulative */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-4">
              <h3 className="font-bold text-base text-brand-navy flex items-center justify-between">
                <span>{t("simulator.cardTitle", "Simulation : 3 séances validées sur 8")}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  {t("simulator.cardBadge", "Conforme SRD")}
                </span>
              </h3>

              <div className="space-y-2 text-xs border-y border-border py-4">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">{t("simulator.rowGross", "Montant brut acquis (3 séances) :")}</span>
                  <span className="font-semibold text-brand-navy">{formatCurrencyGNF(150000)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">{t("simulator.rowPlatform", "Commission Monsieur Fanyi (15 %) :")}</span>
                  <span className="font-semibold text-brand-blue">{formatCurrencyGNF(22500)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">{t("simulator.rowTeacher", "Montant net dû au professeur (85 %) :")}</span>
                  <span className="font-bold text-emerald-600">{formatCurrencyGNF(127500)}</span>
                </div>
                <div className="flex justify-between py-1 bg-amber-50/80 px-2 rounded">
                  <span className="text-amber-900 font-medium">{t("simulator.rowUnearned", "5 séances restantes non acquises :")}</span>
                  <span className="font-bold text-amber-900">{formatCurrencyGNF(250000)}</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                {t("simulator.footnote", "* Les 250 000 GNF restent bloqués et ne sont jamais reversés au professeur tant que les séances ne sont pas réalisées et validées par le parent.")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOIRE AUX QUESTIONS (FAQ) */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
            {t("faq.title", "Questions Fréquentes")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("faq.subtitle", "Tout ce que vous devez savoir sur le fonctionnement de Monsieur Fanyi.")}
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm sm:text-base text-brand-navy mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
              {t("faq.q1", "Comment les professeurs sont-ils vérifiés ?")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6">
              {t("faq.a1", "Chaque enseignant doit fournir sa pièce d'identité officielle (CNI ou Passeport) et ses diplômes universitaires. Notre équipe administrative valide manuellement chaque dossier avant d'autoriser le professeur à postuler.")}
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm sm:text-base text-brand-navy mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
              {t("faq.q2", "Quels sont les moyens de paiement acceptés en Guinée ?")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6">
              {t("faq.a2", "La plateforme est conçue pour Orange Money Guinée et MTN Mobile Money. Dans le cadre de ce lancement, les transactions sont auditées et suivies avec traçabilité et rapprochement comptable manuel.")}
            </p>
          </div>

          <div className="p-5 rounded-xl border border-border bg-card">
            <h3 className="font-semibold text-sm sm:text-base text-brand-navy mb-1.5 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
              {t("faq.q3", "Que se passe-t-il si un cours n'a pas lieu ?")}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6">
              {t("faq.a3", "Si le professeur ne s'est pas présenté ou si le cours n'a pas été donné, le parent peut contester la séance en un clic. L'argent reste protégé et n'est pas versé au professeur. L'administrateur arbitre et peut reprogrammer ou rembourser la séance.")}
            </p>
          </div>
        </div>
      </section>

      {/* 5. APPEL À L'ACTION FINAL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-brand-navy text-white p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold max-w-2xl mx-auto">
            {t("finalCta.title", "Prêt à faire progresser votre enfant dès cette semaine ?")}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            {t("finalCta.subtitle", "Inscrivez-vous gratuitement et recevez les premières propositions de professeurs certifiés à Conakry.")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Link
              href="/register?role=parent"
              className="px-6 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue-light text-white font-semibold text-sm transition-colors"
            >
              {t("finalCta.btnParent", "Créer mon compte parent")}
            </Link>
            <Link
              href="/register?role=teacher"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm transition-colors"
            >
              {t("finalCta.btnTeacher", "Postuler comme enseignant")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
