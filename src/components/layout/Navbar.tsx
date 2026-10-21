"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GraduationCap, Menu, X, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* 1. Bandeau de Réassurance & Live Status avec point vert pulsant */}
      <div className="bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy text-white text-xs py-1.5 px-4 text-center border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-brand-gold">
            {t("common.appName", "Monsieur Fanyi")} :
          </span>
          <span className="text-slate-200 hidden sm:inline">
            {t("nav.topBanner", "Plateforme certifiée de soutien scolaire en Guinée — Paiements sécurisés Orange Money & MTN")}
          </span>
          <span className="text-slate-200 sm:hidden">
            Soutien certifié en Guinée • Orange & MTN
          </span>
        </div>
      </div>

      {/* 2. Barre Principale de Navigation avec verre dépoli */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "glass-nav shadow-premium border-b border-slate-200/90 py-2.5"
            : "bg-white/95 backdrop-blur-md border-b border-slate-100 py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Brand avec Animation Hover */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-blue flex items-center justify-center text-white shadow-md group-hover:scale-105 group-hover:shadow-glow transition-all">
              <GraduationCap className="w-5 h-5 text-brand-gold" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight font-heading text-brand-navy flex items-center gap-1">
                Monsieur <span className="text-brand-blue">Fanyi</span>
              </span>
              <span className="block text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
                {t("nav.logoSubtitle", "Excellence Scolaire • Guinée")}
              </span>
            </div>
          </Link>

          {/* Navigation Desktop avec défilement animé */}
          <nav
            className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-700 bg-slate-100/70 p-1.5 rounded-full border border-slate-200/60"
            aria-label="Navigation principale"
          >
            <a
              href="#comment-ca-marche"
              onClick={(e) => handleNavClick(e, "comment-ca-marche")}
              className="px-4 py-1.5 rounded-full hover:bg-white hover:text-brand-blue hover:shadow-xs transition-all cursor-pointer"
            >
              {t("nav.howItWorks", "Comment ça marche")}
            </a>
            <a
              href="#professeurs"
              onClick={(e) => handleNavClick(e, "professeurs")}
              className="px-4 py-1.5 rounded-full hover:bg-white hover:text-brand-blue hover:shadow-xs transition-all cursor-pointer"
            >
              {t("nav.tutors", "Nos Professeurs")}
            </a>
            <a
              href="#tarifs"
              onClick={(e) => handleNavClick(e, "tarifs")}
              className="px-4 py-1.5 rounded-full hover:bg-white hover:text-brand-blue hover:shadow-xs transition-all cursor-pointer"
            >
              {t("nav.pricing", "Tarifs")}
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "faq")}
              className="px-4 py-1.5 rounded-full hover:bg-white hover:text-brand-blue hover:shadow-xs transition-all cursor-pointer"
            >
              {t("nav.faq", "FAQ")}
            </a>
          </nav>

          {/* Actions & Boutons à Droite */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-brand-blue px-3.5 py-2 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {t("nav.login", "Connexion")}
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>{t("nav.register", "Inscription")}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950" aria-hidden="true" />
            </Link>
          </div>

          {/* Bouton Hamburger Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label={mobileMenuOpen ? t("nav.closeMenu", "Fermer") : t("nav.openMenu", "Menu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* 3. Menu Mobile Déroulant avec Animation */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-5 pt-4 pb-7 space-y-4 shadow-xl"
        >
          <nav className="flex flex-col space-y-1 text-sm font-semibold" aria-label="Navigation mobile">
            <a
              href="#comment-ca-marche"
              onClick={(e) => handleNavClick(e, "comment-ca-marche")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800"
            >
              {t("nav.howItWorks", "Comment ça marche")}
            </a>
            <a
              href="#professeurs"
              onClick={(e) => handleNavClick(e, "professeurs")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800"
            >
              {t("nav.tutors", "Nos Professeurs")}
            </a>
            <a
              href="#tarifs"
              onClick={(e) => handleNavClick(e, "tarifs")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800"
            >
              {t("nav.pricing", "Tarifs")}
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "faq")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-slate-100 text-slate-800"
            >
              {t("nav.faq", "FAQ")}
            </a>
          </nav>

          <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold text-slate-800 border border-slate-300 rounded-xl"
            >
              {t("nav.login", "Connexion")}
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold text-slate-950 bg-amber-500 rounded-xl shadow-xs"
            >
              {t("nav.register", "Inscription")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
