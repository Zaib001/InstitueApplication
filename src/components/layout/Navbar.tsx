"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GraduationCap, Menu, X, ShieldCheck } from "lucide-react";

export function Navbar() {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      {/* Bannière de réassurance Guinée & Mode démo */}
      <div className="bg-brand-navy text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0" />
        <span>
          <strong>Monsieur Fanyi :</strong> Plateforme certifiée de soutien scolaire en Guinée — Paiements sécurisés Orange Money & MTN
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo de la marque */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center text-white shadow-sm group-hover:bg-brand-blue transition-colors">
            <GraduationCap className="w-6 h-6 text-brand-gold" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-brand-navy">
              Monsieur <span className="text-brand-blue">Fanyi</span>
            </span>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
              Excellence Scolaire • Guinée
            </span>
          </div>
        </Link>

        {/* Navigation Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-foreground/80">
          <Link href="#comment-ca-marche" className="hover:text-brand-blue transition-colors">
            {t("nav.howItWorks", "Comment ça marche")}
          </Link>
          <Link href="#professeurs" className="hover:text-brand-blue transition-colors">
            {t("nav.tutors", "Nos Professeurs")}
          </Link>
          <Link href="#tarifs" className="hover:text-brand-blue transition-colors">
            {t("nav.pricing", "Tarifs")}
          </Link>
          <Link href="#faq" className="hover:text-brand-blue transition-colors">
            {t("nav.faq", "FAQ")}
          </Link>
        </nav>

        {/* Actions Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/login"
            className="text-sm font-semibold text-brand-navy hover:text-brand-blue px-3 py-2 rounded-lg transition-colors"
          >
            {t("nav.login", "Connexion")}
          </Link>

          <Link
            href="/register"
            className="text-sm font-semibold text-white bg-brand-navy hover:bg-brand-navy/90 px-4 py-2 rounded-lg shadow-sm transition-all"
          >
            {t("nav.register", "Inscription")}
          </Link>
        </div>

        {/* Bouton Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-foreground hover:bg-muted"
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu déroulant Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 pt-3 pb-6 space-y-3">
          <nav className="flex flex-col space-y-2 text-base font-medium">
            <Link
              href="#comment-ca-marche"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-muted"
            >
              {t("nav.howItWorks", "Comment ça marche")}
            </Link>
            <Link
              href="#professeurs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-muted"
            >
              {t("nav.tutors", "Nos Professeurs")}
            </Link>
            <Link
              href="#tarifs"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-muted"
            >
              {t("nav.pricing", "Tarifs")}
            </Link>
            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md hover:bg-muted"
            >
              {t("nav.faq", "FAQ")}
            </Link>
          </nav>

          <div className="pt-4 border-t border-border flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold text-brand-navy border border-border rounded-lg"
            >
              {t("nav.login", "Connexion")}
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-navy rounded-lg"
            >
              {t("nav.register", "Inscription")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
