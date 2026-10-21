"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${className}`}>
      <Globe className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">{t("common.language", "Langue")}</span>
      <div className="flex bg-muted/60 p-0.5 rounded-md border border-border">
        <button
          type="button"
          onClick={() => setLocale("fr")}
          className={`px-2 py-1 rounded transition-colors ${
            locale === "fr"
              ? "bg-brand-navy text-white shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-label={t("nav.switchFr", "Passer en Français")}
          aria-pressed={locale === "fr"}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`px-2 py-1 rounded transition-colors ${
            locale === "en"
              ? "bg-brand-navy text-white shadow-xs font-semibold"
              : "text-muted-foreground hover:text-foreground"
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
