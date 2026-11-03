"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X, User } from "lucide-react";

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
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
      {/* Barre Principale de Navigation — Style Warm White & Gold */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-3"
            : "bg-white border-b border-slate-100 py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Brand : Toque bleue sur livre d'or ouvert + MonsieurFanyi + Slogan */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#f59e0b] shadow-xs group-hover:bg-amber-500/20 transition-colors">
              <svg className="w-7 h-7" viewBox="0 0 36 36" fill="none" aria-hidden="true">
                {/* Livre ouvert couleur dorée */}
                <path d="M6 24C10 21 15 21 18 24C21 21 26 21 30 24V11C26 8 21 8 18 11C15 8 10 8 6 11V24Z" fill="#F59E0B" />
                <path d="M18 11V24" stroke="#D97706" strokeWidth="1.5" />
                {/* Toque d'étudiant bleu marine */}
                <path d="M18 5L7 10L18 15L29 10L18 5Z" fill="#152E4D" />
                <path d="M11 12.5V17C11 19 14 20.5 18 20.5C22 20.5 25 19 25 17V12.5" stroke="#152E4D" strokeWidth="1.5" fill="none" />
                <path d="M27 11V18" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[#152e4d] leading-none">
                Monsieur<span className="text-[#f59e0b]">Fanyi</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium italic mt-0.5 tracking-tight">
                {t("nav.logoSubtitle", "Le bon prof, au bon moment")}
              </span>
            </div>
          </Link>

          {/* Navigation Desktop Centrée */}
          <nav
            className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-medium text-slate-700"
            aria-label="Navigation principale"
          >
            <Link
              href="/"
              className="relative text-[#152e4d] font-semibold pb-1 after:content-[''] after:absolute after:-bottom-0.5 after:left-0 after:w-full after:h-[2px] after:bg-[#f59e0b] after:rounded-full"
            >
              {t("nav.home", "Accueil")}
            </Link>

            <a
              href="#a-propos"
              onClick={(e) => handleNavClick(e, "a-propos")}
              className="hover:text-[#152e4d] transition-colors cursor-pointer"
            >
              {t("nav.about", "À propos")}
            </a>

            <a
              href="#comment-ca-marche"
              onClick={(e) => handleNavClick(e, "comment-ca-marche")}
              className="hover:text-[#152e4d] transition-colors cursor-pointer"
            >
              {t("nav.howItWorks", "Comment ça marche")}
            </a>

            <a
              href="#professeurs"
              onClick={(e) => handleNavClick(e, "professeurs")}
              className="hover:text-[#152e4d] transition-colors cursor-pointer"
            >
              {t("nav.tutors", "Nos professeurs")}
            </a>

            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="hover:text-[#152e4d] transition-colors cursor-pointer"
            >
              {t("nav.contact", "Contact")}
            </a>
          </nav>

          {/* Actions à Droite : Sélecteur de Langue & Bouton Jaune Pill "Se connecter" */}
          <div className="hidden sm:flex items-center gap-3.5">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-[#f9c450] hover:bg-[#eab308] text-slate-900 font-semibold text-xs sm:text-sm shadow-xs transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <User className="w-4 h-4 text-slate-800" aria-hidden="true" />
              <span>{t("nav.signIn", "Se connecter")}</span>
            </Link>
          </div>

          {/* Bouton Mobile Hamburger */}
          <div className="flex lg:hidden items-center gap-2.5">
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

      {/* Menu Mobile Déroulant */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="lg:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-5 pt-4 pb-6 space-y-4 shadow-xl"
        >
          <nav className="flex flex-col space-y-2.5 text-sm font-semibold text-slate-700" aria-label="Navigation mobile">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2 rounded-xl text-[#152e4d] bg-amber-500/10 font-bold"
            >
              {t("nav.home", "Accueil")}
            </Link>
            <a
              href="#a-propos"
              onClick={(e) => handleNavClick(e, "a-propos")}
              className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              {t("nav.about", "À propos")}
            </a>
            <a
              href="#comment-ca-marche"
              onClick={(e) => handleNavClick(e, "comment-ca-marche")}
              className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              {t("nav.howItWorks", "Comment ça marche")}
            </a>
            <a
              href="#professeurs"
              onClick={(e) => handleNavClick(e, "professeurs")}
              className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              {t("nav.tutors", "Nos professeurs")}
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, "contact")}
              className="px-3.5 py-2 rounded-xl hover:bg-slate-100 text-slate-700"
            >
              {t("nav.contact", "Contact")}
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-[#f9c450] rounded-full shadow-xs flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4 text-slate-800" />
              <span>{t("nav.signIn", "Se connecter")}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
