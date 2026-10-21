"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";

export type SupportedLocale = "fr" | "en";

type Messages = typeof frMessages;

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (path: string, fallback?: string) => string;
  formatCurrencyGNF: (amount: number) => string;
}

const dictionaries: Record<SupportedLocale, Messages> = {
  fr: frMessages,
  en: enMessages,
};

const I18nContext = createContext<I18nContextType | null>(null);

const STORAGE_KEY = "monsieur_fanyi_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>("fr");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && (saved === "fr" || saved === "en")) {
        setLocaleState(saved);
      }
    } catch {
      // LocalStorage non disponible ou bloqué (SSR/Sandbox)
    }
  }, []);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore
    }
  };

  const t = (path: string, fallback?: string): string => {
    const keys = path.split(".");
    let current: any = dictionaries[locale];

    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback sur le dictionnaire français
        let fallbackVal: any = dictionaries.fr;
        for (const fbKey of keys) {
          if (fallbackVal && typeof fallbackVal === "object" && fbKey in fallbackVal) {
            fallbackVal = fallbackVal[fbKey];
          } else {
            return fallback || path;
          }
        }
        return typeof fallbackVal === "string" ? fallbackVal : fallback || path;
      }
    }

    return typeof current === "string" ? current : fallback || path;
  };

  /**
   * Formatage officiel conforme à la République de Guinée (fr-GN)
   * Pas de centimes, espace comme séparateur de milliers
   */
  const formatCurrencyGNF = (amount: number): string => {
    const formatted = Math.round(amount)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return `${formatted} GNF`;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatCurrencyGNF }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fournir un fallback robuste au cas où le composant est monté hors provider
    return {
      locale: "fr" as SupportedLocale,
      setLocale: () => {},
      t: (path: string, fallback?: string) => fallback || path,
      formatCurrencyGNF: (amount: number) => `${Math.round(amount)} GNF`,
    };
  }
  return context;
}
