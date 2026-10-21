"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { GraduationCap, ShieldCheck, ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Message informatif sur l'état Phase 01 (Module P10 en Jalon 1)
    setStatusMessage(
      t(
        "auth.phaseNotice",
        "Le module d'authentification serveur complet sera activé lors de la Phase P10. Vous êtes sur le socle certifié Phase 01."
      )
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-3xl border border-border shadow-md">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-navy items-center justify-center text-white mb-2 shadow-xs">
            <GraduationCap className="w-7 h-7 text-brand-gold" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-black text-brand-navy tracking-tight">
            {t("auth.loginTitle", "Accédez à votre espace sécurisé")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("common.appTagline", "L'excellence du soutien scolaire en Guinée")}
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-brand-navy mb-1"
            >
              {t("auth.emailLabel", "Adresse email")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" aria-hidden="true" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.nom@exemple.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-brand-navy mb-1"
            >
              {t("auth.passwordLabel", "Mot de passe")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" aria-hidden="true" />
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-brand-navy hover:bg-brand-blue text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <span>{t("nav.login", "Connexion")}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-border text-xs text-muted-foreground">
          <span>{t("auth.noAccountYet", "Pas encore de compte ?")}{" "}</span>
          <Link href="/register" className="font-semibold text-brand-blue hover:underline">
            {t("nav.register", "Inscription")}
          </Link>
        </div>
      </div>
    </div>
  );
}
