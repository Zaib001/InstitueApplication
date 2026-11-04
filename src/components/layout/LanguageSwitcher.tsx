"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTranslation, SupportedLocale } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  const handleToggle = (targetLocale?: SupportedLocale) => {
    if (targetLocale) {
      if (targetLocale !== locale) {
        setLocale(targetLocale);
      }
    } else {
      setLocale(locale === "fr" ? "en" : "fr");
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
      <span className="sr-only">{t("common.language", "Langue")}</span>

      {/* Pill Toggle Switch with Animated Sliding Indicator */}
      <div
        role="group"
        aria-label={t("common.language", "Langue")}
        className="relative flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/90 cursor-pointer shadow-2xs"
      >
        {/* French Option */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle("fr");
          }}
          className={`relative z-10 px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-colors duration-200 cursor-pointer ${
            locale === "fr" ? "text-slate-900 font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
          aria-label={t("nav.switchFr", "Passer en Français")}
          aria-pressed={locale === "fr"}
        >
          {locale === "fr" && (
            <motion.div
              layoutId="localeBubble"
              className="absolute inset-0 rounded-full bg-[#f9c450] shadow-2xs -z-10"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          FR
        </button>

        {/* English Option */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle("en");
          }}
          className={`relative z-10 px-2.5 py-0.5 text-[11px] font-bold rounded-full transition-colors duration-200 cursor-pointer ${
            locale === "en" ? "text-slate-900 font-extrabold" : "text-slate-500 hover:text-slate-800"
          }`}
          aria-label={t("nav.switchEn", "Passer en Anglais")}
          aria-pressed={locale === "en"}
        >
          {locale === "en" && (
            <motion.div
              layoutId="localeBubble"
              className="absolute inset-0 rounded-full bg-[#f9c450] shadow-2xs -z-10"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          EN
        </button>
      </div>
    </div>
  );
}
