import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, AlertTriangle, ArrowLeft, Mail, Phone, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU) — Monsieur Fanyi",
  description:
    "Conditions Générales d'Utilisation et cadre juridique de la plateforme de soutien scolaire Monsieur Fanyi en République de Guinée.",
};

export default function CGUPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-navy text-xs font-bold">
            <FileText className="w-3.5 h-3.5 text-brand-navy" />
            <span>Document Juridique Officiel • Version V2.1-2026-NC</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-brand-navy">
            Conditions Générales d&apos;Utilisation (CGU)
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Dernière mise à jour : 2026 • Applicable à tout utilisateur (Parents, Élèves, Professeurs, Administrateurs) de la plateforme Monsieur Fanyi.
          </p>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xs space-y-8 text-sm leading-relaxed text-slate-700">
          {/* Article 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-brand-navy flex items-center justify-center text-xs font-black">1</span>
              Objet de la Plateforme
            </h2>
            <p>
              La plateforme <strong>Monsieur Fanyi</strong> est un service d&apos;intermédiation pédagogique et technologique spécialisé dans le soutien scolaire, les cours particuliers à domicile et en ligne en République de Guinée. Elle permet aux parents d&apos;élèves de rechercher, sélectionner et engager des enseignants vérifiés et d&apos;assurer le suivi pédagogique des apprentissages via le Carnet de Progression numérique.
            </p>
          </section>

          {/* Article 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-brand-navy flex items-center justify-center text-xs font-black">2</span>
              Acceptation et Opposabilité des Conditions
            </h2>
            <p>
              Toute création de compte sur Monsieur Fanyi requiert l&apos;acceptation expresse, sans réserve, des présentes Conditions Générales d&apos;Utilisation ainsi que de la Charte d&apos;engagement pédagogique. L&apos;acceptation est formalisée par le cochage obligatoire d&apos;une case dédiée lors de l&apos;inscription et est conservée de manière infalsifiable dans le registre de conformité de la plateforme.
            </p>
          </section>

          {/* Article 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-brand-navy flex items-center justify-center text-xs font-black">3</span>
              Rôles et Responsabilités
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Parents d&apos;élèves :</strong> Définissent les besoins pédagogiques de leurs enfants, sélectionnent les professeurs proposés ou postulants, valident les séances réalisées et s&apos;acquittent des paiements prévus.
              </p>
              <p>
                <strong>Professeurs :</strong> S&apos;engagent à fournir des justificatifs authentiques d&apos;identité et de diplômes, à dispenser un enseignement de haute qualité, à respecter scrupuleusement les horaires et à consigner le compte-rendu de chaque leçon dans le Carnet de Progression.
              </p>
              <p>
                <strong>Monsieur Fanyi :</strong> Assure la vérification rigoureuse des dossiers, la mise en relation sécurisée, la mise à disposition des outils pédagogiques et la médiation en cas de litige.
              </p>
            </div>
          </section>

          {/* Article 4 - SECTION CRITIQUE NON-CONTOURNEMENT */}
          <section className="space-y-4 pt-2">
            <div className="p-6 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 text-amber-900 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <h2 className="font-heading">Article 4 — Non-contournement de la plateforme</h2>
              </div>
              <blockquote className="p-4 rounded-xl bg-white border border-amber-200 text-slate-800 font-medium italic leading-relaxed text-sm">
                « Les parents et les professeurs s&apos;engagent à ne pas organiser directement, en dehors de Monsieur Fanyi, des cours résultant d&apos;une mise en relation effectuée par la plateforme dans le but d&apos;éviter les frais ou commissions applicables. Cette obligation s&apos;applique pendant leur collaboration et pendant les 12 mois suivant la dernière mise en relation ou prestation réalisée via Monsieur Fanyi. Les relations professionnelles préexistantes pouvant être justifiées sont exclues de cette obligation. »
              </blockquote>
              <div className="space-y-2 text-xs text-amber-950">
                <p>
                  <strong>Portée et Justification :</strong> La plateforme investit des ressources considérables dans le recrutement, la vérification des diplômes et antécédents des professeurs, l&apos;assistance téléphonique et le développement d&apos;outils de suivi pédagogique. Le contournement prive la plateforme de ses moyens opérationnels et prive les utilisateurs de la protection du séquestre de paiement, de l&apos;assurance remplacement et du suivi du Carnet de Progression.
                </p>
                <p>
                  <strong>Sanctions applicables :</strong> En cas de manquement constaté à cette obligation, Monsieur Fanyi se réserve le droit de suspendre ou clôturer immédiatement les comptes concernés, de réclamer le remboursement des commissions dues au titre des prestations réalisées ainsi que des dommages-intérêts forfaitaires conformément au droit commercial guinéen.
                </p>
              </div>
            </div>
          </section>

          {/* Article 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-brand-navy flex items-center justify-center text-xs font-black">5</span>
              Modalités Financières & Rémunération
            </h2>
            <p>
              Les tarifs des cours sont transparents et exprimés en Francs Guinéens (GNF). Les paiements sont sécurisés par les opérateurs de Mobile Money agréés en République de Guinée (Orange Money Guinée et MTN Mobile Money). Les fonds sont conservés sous séquestre sécurisé jusqu&apos;à la confirmation effective de la séance par le parent d&apos;élève.
            </p>
            <p>
              La plateforme prélève une commission de service de 15% sur les prestations pour couvrir les frais de fonctionnement, de vérification des enseignants et d&apos;infrastructure technologique. L&apos;enseignant perçoit 85% net du montant de la séance validée.
            </p>
          </section>

          {/* Article 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-100 text-brand-navy flex items-center justify-center text-xs font-black">6</span>
              Résolution des Litiges et Droit Applicable
            </h2>
            <p>
              En cas de désaccord relatif au déroulement d&apos;une séance ou au respect du programme pédagogique, les parties s&apos;engagent à soumettre leur réclamation au service de médiation de Monsieur Fanyi dans un délai de 48 heures suivant la leçon.
            </p>
            <p>
              Les présentes conditions sont soumises à la législation en vigueur en République de Guinée. Tout litige persistant sera soumis aux tribunaux compétents de Conakry.
            </p>
          </section>

          {/* Contact officiel */}
          <section className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-navy">Une question juridique ou administrative ?</p>
              <p className="text-xs text-slate-500">Notre équipe de conformité est à votre disposition.</p>
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

