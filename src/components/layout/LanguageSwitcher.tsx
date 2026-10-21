"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <Globe className="w-3.5 h-3.5 text-slate-300" aria-hidden="true" />
      <span className="sr-only">{t("common.language", "Langue")}</span>
      <div className="flex bg-white/10 p-0.5 rounded-full border border-white/20">
        <button
          type="button"
          onClick={() => setLocale("fr")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
            locale === "fr"
              ? "bg-[#e59a38] text-white shadow-xs"
              : "text-slate-300 hover:text-white"
          }`}
          aria-label={t("nav.switchFr", "Passer en Français")}
          aria-pressed={locale === "fr"}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
            locale === "en"
              ? "bg-[#e59a38] text-white shadow-xs"
              : "text-slate-300 hover:text-white"
          }`}
          aria-label={t("nav.switchEn", "Passer en Anglais")}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
      </div>
    </div>
  );
}
