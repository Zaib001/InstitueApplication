"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { GraduationCap, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-border bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Marque et Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center text-white">
                <GraduationCap className="w-5 h-5 text-brand-gold" aria-hidden="true" />
              </div>
              <span className="font-extrabold text-lg text-white">
                Monsieur <span className="text-brand-blue-light">Fanyi</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t("footer.mission", "La plateforme de référence pour le soutien scolaire et les cours particuliers en Guinée. Rapprochement certifié entre parents exigeants et enseignants qualifiés.")}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-brand-teal">
              <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t("footer.curriculumNorms", "Conforme aux normes du système éducatif guinéen")}</span>
            </div>
          </div>

          {/* Parents */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.parentsSection", "Parents d'élèves")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="#comment-ca-marche" className="hover:text-white transition-colors">
                  {t("footer.howToBook", "Comment réserver un cours")}
                </Link>
              </li>
              <li>
                <Link href="/register?role=parent" className="hover:text-white transition-colors">
                  {t("footer.createRequest", "Créer une demande de soutien")}
                </Link>
              </li>
              <li>
                <Link href="#tarifs" className="hover:text-white transition-colors">
                  {t("footer.packagesGrid", "Grille des forfaits mensuels")}
                </Link>
              </li>
              <li>
                <Link href="#securite" className="hover:text-white transition-colors">
                  {t("footer.securePayments", "Paiements sécurisés (Orange / MTN)")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Enseignants */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.teachersSection", "Enseignants")}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register?role=teacher" className="hover:text-white transition-colors">
                  {t("footer.applyAsTeacher", "Postuler comme professeur")}
                </Link>
              </li>
              <li>
                <Link href="#candidature" className="hover:text-white transition-colors">
                  {t("footer.selectionCriteria", "Critères de sélection & Diplômes")}
                </Link>
              </li>
              <li>
                <Link href="#commission" className="hover:text-white transition-colors">
                  {t("footer.remunerationRule", "Rémunération & Commission 15 %")}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  {t("footer.teacherSpace", "Espace enseignant")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal & Contact */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              {t("footer.legalSection", "Cadre & Contact")}
            </h3>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>{t("footer.location", "Conakry, République de Guinée")}</li>
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

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>{t("footer.copyright", "© 2026 Monsieur Fanyi — Tous droits réservés. Développé pour l'éducation en Guinée.")}</p>
          <div className="flex items-center gap-1">
            <span>{t("footer.craftedWith", "Fait avec rigueur pour l'excellence académique")}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}
