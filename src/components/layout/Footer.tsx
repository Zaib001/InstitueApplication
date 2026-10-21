"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import {
  GraduationCap,
  ShieldCheck,
  Heart,
  ArrowUp,
  Smartphone,
  MapPin,
  Lock,
} from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-slate-950 text-slate-300 border-t border-slate-800 overflow-hidden">
      {/* Halo de lueur ambiante en arrière-plan */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-brand-blue/10 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. Bandeau supérieur : Réassurance Paiement & Partenaires Mobiles en Guinée */}
      <div className="border-b border-slate-800/80 bg-slate-900/60 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">Paiements Sécurisés & Traçables en Guinée</span>
              <span className="text-slate-400">Fonds conservés sous séquestre jusqu'à validation de la séance</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              Orange Money Guinée
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              MTN Mobile Money
            </span>
          </div>
        </div>
      </div>

      {/* 2. Contenu Principal du Footer (4 Colonnes) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Colonne 1 : Marque et Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-navy to-brand-blue flex items-center justify-center text-white shadow-xs">
                <GraduationCap className="w-5 h-5 text-brand-gold" aria-hidden="true" />
              </div>
              <span className="font-extrabold text-xl font-heading text-white tracking-tight">
                Monsieur <span className="text-brand-blue-light">Fanyi</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t(
                "footer.mission",
                "La plateforme de référence pour le soutien scolaire et les cours particuliers en Guinée. Rapprochement certifié entre parents exigeants et enseignants qualifiés."
              )}
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-teal font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("footer.curriculumNorms", "Conforme aux normes du système éducatif guinéen")}</span>
            </div>
          </div>

          {/* Colonne 2 : Parents */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 text-brand-gold">
              {t("footer.parentsSection", "Parents d'élèves")}
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="#comment-ca-marche" className="hover:text-white transition-colors">
                  {t("footer.howToBook", "Comment réserver un cours")}
                </a>
              </li>
              <li>
                <Link href="/register?role=parent" className="hover:text-white transition-colors">
                  {t("footer.createRequest", "Créer une demande de soutien")}
                </Link>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-white transition-colors">
                  {t("footer.packagesGrid", "Grille des forfaits mensuels")}
                </a>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-white transition-colors">
                  {t("footer.securePayments", "Paiements sécurisés (Orange / MTN)")}
                </a>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Enseignants */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 text-brand-gold">
              {t("footer.teachersSection", "Enseignants")}
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/register?role=teacher" className="hover:text-white transition-colors">
                  {t("footer.applyAsTeacher", "Postuler comme professeur")}
                </Link>
              </li>
              <li>
                <a href="#comment-ca-marche" className="hover:text-white transition-colors">
                  {t("footer.selectionCriteria", "Critères de sélection & Diplômes")}
                </a>
              </li>
              <li>
                <a href="#tarifs" className="hover:text-white transition-colors">
                  {t("footer.remunerationRule", "Rémunération & Commission 15 %")}
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t("footer.teacherSpace", "Espace enseignant")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 4 : Localisation & Informations Légales */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 text-brand-gold">
              {t("footer.legalSection", "Cadre & Contact")}
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span>{t("footer.location", "Conakry, République de Guinée")}</span>
              </li>
              <li>{t("footer.currencyLabel", "Devise : Franc Guinéen (GNF)")}</li>
              <li>
                <Link href="/mentions-legales" className="hover:text-white transition-colors">
                  {t("footer.legalNotice", "Mentions Légales (Projet)")}
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="hover:text-white transition-colors">
                  {t("footer.privacy", "Protection des données & Enfants")}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. Ligne Bas de Page avec Bouton Scroll-to-Top */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t("footer.copyright", "© 2026 Monsieur Fanyi — Tous droits réservés. Développé pour l'éducation en Guinée.")}</p>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-slate-400">
              <span>{t("footer.craftedWith", "Fait avec rigueur pour l'excellence académique")}</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" aria-hidden="true" />
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              aria-label="Retour en haut de page"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
