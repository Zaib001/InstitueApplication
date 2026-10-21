"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X, ChevronDown, GraduationCap } from "lucide-react";

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
      {/* Barre Principale de Navigation — Style Lexicon Dark Ocean Blue */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-[#0d1e33]/95 backdrop-blur-md border-b border-white/10 shadow-xl py-3"
            : "bg-[#16385c] border-b border-white/5 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Brand Lexicon Style (Minimalist White + Gold Accent) */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white group-hover:bg-[#e59a38] transition-colors">
              <GraduationCap className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center">
              Monsieur<span className="text-[#e59a38] ml-1">Fanyi</span>
            </span>
          </Link>

          {/* Navigation Desktop Centrée — Style Lexicon */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-200"
            aria-label="Navigation principale"
          >
            <a
              href="#professeurs"
              onClick={(e) => handleNavClick(e, "professeurs")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t("nav.tutors", "Nos Professeurs")}
            </a>

            <a
              href="#comment-ca-marche"
              onClick={(e) => handleNavClick(e, "comment-ca-marche")}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{t("nav.howItWorks", "Comment ça marche")}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
            </a>

            <a
              href="#tarifs"
              onClick={(e) => handleNavClick(e, "tarifs")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t("nav.pricing", "Tarifs")}
            </a>

            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "faq")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              {t("nav.faq", "FAQ")}
            </a>
          </nav>

          {/* Actions & Boutons à Droite — Log in & Join for Free (Amber Pill Button) */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="text-sm font-medium text-slate-200 hover:text-white transition-colors px-2 py-1"
            >
              {t("nav.login", "Connexion")}
            </Link>

            <Link
              href="/register"
              className="px-6 py-2.5 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-xs sm:text-sm shadow-md transition-all transform hover:scale-105 active:scale-95"
            >
              {t("nav.register", "Inscription")}
            </Link>
          </div>

          {/* Bouton Mobile */}
          <div className="flex md:hidden items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
              aria-label={mobileMenuOpen ? t("nav.closeMenu", "Fermer") : t("nav.openMenu", "Menu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile Déroulant */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="md:hidden border-b border-slate-800 bg-[#0d1e33]/98 backdrop-blur-xl px-5 pt-4 pb-7 space-y-4 shadow-2xl"
        >
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-200" aria-label="Navigation mobile">
            <a
              href="#professeurs"
              onClick={(e) => handleNavClick(e, "professeurs")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white"
            >
              {t("nav.tutors", "Nos Professeurs")}
            </a>
            <a
              href="#comment-ca-marche"
              onClick={(e) => handleNavClick(e, "comment-ca-marche")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white"
            >
              {t("nav.howItWorks", "Comment ça marche")}
            </a>
            <a
              href="#tarifs"
              onClick={(e) => handleNavClick(e, "tarifs")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white"
            >
              {t("nav.pricing", "Tarifs")}
            </a>
            <a
              href="#faq"
              onClick={(e) => handleNavClick(e, "faq")}
              className="px-3.5 py-2.5 rounded-xl hover:bg-white/10 text-white"
            >
              {t("nav.faq", "FAQ")}
            </a>
          </nav>

          <div className="pt-4 border-t border-slate-700/60 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold text-white border border-white/20 rounded-full"
            >
              {t("nav.login", "Connexion")}
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-bold text-white bg-[#e59a38] rounded-full shadow-md"
            >
              {t("nav.register", "Inscription")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
