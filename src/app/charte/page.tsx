import React from "react";
import Link from "next/link";
import { GraduationCap, ShieldCheck, AlertTriangle, ArrowLeft, Mail, Phone, BookOpen, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Charte d'Engagement Pédagogique — Monsieur Fanyi",
  description:
    "Charte déontologique et engagements réciproques des enseignants, parents et apprenants sur la plateforme Monsieur Fanyi.",
};

export default function ChartePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation retour */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-brand-navy transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        {/* En-tête */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Déontologie & Excellence • Version V2.1-2026-NC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-brand-navy">
            Charte d&apos;Engagement Pédagogique
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Cette charte énonce les principes d&apos;intégrité, d&apos;exigence académique et de respect mutuel régissant la communauté Monsieur Fanyi en République de Guinée.
          </p>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs space-y-8 text-sm leading-relaxed text-slate-700">
          {/* Article 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">1</span>
              Excellence Académique et Préparation des Cours
            </h2>
            <p>
              Tout professeur intervenant sur Monsieur Fanyi s&apos;engage à maîtriser les programmes officiels de l&apos;Éducation Nationale guinéenne ou du cycle international concerné (Primaire, Collège/Brevet, Lycée/BAC). Chaque leçon doit faire l&apos;objet d&apos;un plan pédagogique adapté au rythme, aux forces et aux axes de progression spécifiques de l&apos;élève.
            </p>
          </section>

          {/* Article 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">2</span>
              Ponctualité, Assiduité et Environnement de Travail
            </h2>
            <p>
              Le respect des horaires convenus est un impératif absolu. Toute indisponibilité exceptionnelle doit être signalée au moins 24 heures à l&apos;avance via l&apos;outil d&apos;emploi du temps de la plateforme. En cours à domicile, les parents s&apos;engagent à fournir un espace de travail calme et propice à la concentration.
            </p>
          </section>

          {/* Article 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">3</span>
              Obligation de Renseignement du Carnet de Progression
            </h2>
            <p>
              Le suivi transparent constitue le cœur du modèle Monsieur Fanyi. L&apos;enseignant a pour obligation contractuelle et déontologique de renseigner :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
              <li>Le <strong>compte-rendu de séance</strong> après chaque cours (notions abordées, assiduité, devoirs).</li>
              <li>Les <strong>bilans pédagogiques périodiques</strong> identifiant objectivement les points forts consolidés et les axes de progression prioritaires.</li>
              <li>Les résultats des devoirs et évaluations périodiques.</li>
            </ul>
          </section>

          {/* Article 4 - SECTION CRITIQUE NON-CONTOURNEMENT */}
          <section className="space-y-4 pt-2">
            <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <h2 className="font-heading">Article 4 — Non-contournement de la plateforme et intégrité relationnelle</h2>
              </div>
              <blockquote className="p-4 rounded-xl bg-white border border-amber-200 text-slate-800 font-medium italic leading-relaxed text-sm">
                « Les parents et les professeurs s&apos;engagent à ne pas organiser directement, en dehors de Monsieur Fanyi, des cours résultant d&apos;une mise en relation effectuée par la plateforme dans le but d&apos;éviter les frais ou commissions applicables. Cette obligation s&apos;applique pendant leur collaboration et pendant les 12 mois suivant la dernière mise en relation ou prestation réalisée via Monsieur Fanyi. Les relations professionnelles préexistantes pouvant être justifiées sont exclues de cette obligation. »
              </blockquote>
              <div className="space-y-2 text-xs text-amber-950">
                <p>
                  <strong>Principe de loyauté :</strong> La confiance entre Monsieur Fanyi, ses enseignants partenaires et les familles repose sur la transparence. Organiser des cours en dehors de la plateforme rompt le contrat moral de confiance et entraîne l&apos;exclusion définitive du réseau d&apos;enseignants certifiés Monsieur Fanyi.
                </p>
                <p>
                  <strong>Perte des garanties :</strong> En cas d&apos;arrangement informel hors plateforme, le professeur perd toute garantie de versement des honoraires en cas d&apos;impayé, et la famille perd l&apos;accès au séquestre financier, au carnet de progression officiel et au service de remplacement sous 48h.
                </p>
              </div>
            </div>
          </section>

          {/* Article 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">5</span>
              Protection des Enfants et Éthique Professionnelle
            </h2>
            <p>
              Monsieur Fanyi applique une politique de tolérance zéro absolue envers tout comportement abusif, discriminatoire ou violent. Tous les enseignants font l&apos;objet d&apos;une vérification de casier judiciaire et de pièces d&apos;identité avant validation. Tout comportement suspect entraîne le signalement immédiat aux autorités judiciaires compétentes.
            </p>
          </section>

          {/* Contact officiel */}
          <section className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-navy">Questions relatives à la pédagogie ou au suivi ?</p>
              <p className="text-xs text-slate-500">Contactez la direction pédagogique Monsieur Fanyi.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href="tel:+224612365314"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-brand-navy text-xs font-semibold transition-colors"
                title="Appeler le +224 612 365 314"
              >
                <Phone className="w-3.5 h-3.5 text-brand-teal" />
                <span>+224 612 365 314</span>
              </a>
              <a
                href="mailto:contact@monsieurfanyi.com"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
                title="Écrire à contact@monsieurfanyi.com"
              >
                <Mail className="w-3.5 h-3.5 text-brand-gold" />
                <span>contact@monsieurfanyi.com</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

