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
  const [activeSection, setActiveSection] = useState<string>("accueil");

  // Les 5 éléments essentiels conformes à la maquette de référence
  const navItems = [
    { id: "accueil", label: t("nav.home", "Accueil") },
    { id: "a-propos", label: t("nav.about", "À propos") },
    { id: "comment-ca-marche", label: t("nav.howItWorks", "Comment ça marche") },
    { id: "professeurs", label: t("nav.tutors", "Nos professeurs") },
    { id: "contact", label: t("nav.contact", "Contact") },
  ];

  // Gestion du scroll sticky et détection fluide de la section active
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      if (pathname !== "/") return;

      const navHeight = 90;
      const scrollPos = window.scrollY + navHeight;

      if (window.scrollY < 200) {
        setActiveSection("accueil");
        return;
      }

      const reverseIds = [
        "contact",
        "professeurs",
        "comment-ca-marche",
        "a-propos",
      ];

      for (const id of reverseIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top - 60) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  // Défilement fluide vers la section avec compensation de la hauteur du header sticky
  const scrollToTarget = (targetId: string) => {
    if (targetId === "accueil") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.history.pushState) {
        window.history.pushState(null, "", "/");
      }
      setActiveSection("accueil");
      setMobileMenuOpen(false);
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      const navHeight = 72;
      const elementPosition = el.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = Math.max(0, elementPosition - navHeight);

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      if (window.history.pushState) {
        window.history.pushState(null, "", `#${targetId}`);
      }
      setActiveSection(targetId);
      setMobileMenuOpen(false);
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      scrollToTarget(targetId);
    } else {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Barre Principale de Navigation — Style Warm White & Gold */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs py-2.5"
            : "bg-white border-b border-slate-100 py-3"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Logo Brand : Toque bleue sur livre d'or ouvert + MonsieurFanyi + Slogan */}
          <Link
            href="/"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                scrollToTarget("accueil");
              }
            }}
            className="flex items-center gap-2.5 group shrink-0"
          >
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
            <div className="flex flex-col notranslate" translate="no">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#152e4d] leading-none">
                Monsieur<span className="text-[#f59e0b]">Fanyi</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium italic mt-0.5 tracking-tight hidden sm:block">
                {t("nav.logoSubtitle", "Le bon prof, au bon moment")}
              </span>
            </div>
          </Link>

          {/* Navigation Desktop Épurée (Exactement les 5 items du design) */}
          <nav
            className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-9 text-xs sm:text-sm font-medium text-slate-700"
            aria-label="Navigation principale"
          >
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`/#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`relative py-1 transition-colors cursor-pointer select-none whitespace-nowrap ${
                    isActive
                      ? "text-[#152e4d] font-bold after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-[2px] after:bg-[#f59e0b] after:rounded-full"
                      : "text-slate-600 hover:text-[#152e4d] font-medium"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Actions à Droite : Sélecteur de Langue & Bouton Jaune Pill "Se connecter" */}
          <div className="hidden sm:flex items-center gap-3.5 lg:gap-4 shrink-0">
            <LanguageSwitcher />

            <Link
              href="/login"
              className="px-5 py-2.5 rounded-full bg-[#f9c450] hover:bg-[#eab308] text-slate-900 font-bold text-xs sm:text-sm shadow-xs transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <User className="w-4 h-4 text-slate-800" aria-hidden="true" />
              <span>{t("nav.signIn", "Se connecter")}</span>
            </Link>
          </div>

          {/* Bouton Mobile Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? t("nav.closeMenu", "Fermer") : t("nav.openMenu", "Menu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile Déroulant avec les 5 Liens */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation-menu"
          className="md:hidden border-b border-slate-200 bg-white/98 backdrop-blur-xl px-5 pt-4 pb-6 space-y-3 shadow-xl"
        >
          <nav className="flex flex-col space-y-1.5 text-sm font-semibold text-slate-700" aria-label="Navigation mobile">
            {navItems.map((item) => {
              const isActive = pathname === "/" && activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`/#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  className={`px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? "text-[#152e4d] bg-amber-500/15 font-bold border-l-4 border-[#f59e0b]"
                      : "text-slate-700 hover:bg-slate-100 font-medium"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs sm:text-sm font-bold text-slate-900 bg-[#f9c450] hover:bg-[#eab308] rounded-full shadow-xs flex items-center justify-center gap-2 cursor-pointer"
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
