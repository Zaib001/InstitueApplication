"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(
      t(
        "auth.phaseNotice",
        "Le module d'authentification serveur complet sera activé lors de la Phase P10. Vous êtes sur le socle certifié Phase 01."
      )
    );
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 relative overflow-hidden bg-radial-mesh">
      {/* Orbes animées en arrière-plan */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-brand-teal/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 bg-white">
        
        {/* Colonne Gauche : Formulaire de Connexion */}
        <div className="lg:col-span-7 p-8 sm:p-12 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-navy to-brand-blue flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5 text-brand-gold" aria-hidden="true" />
              </div>
              <div>
                <span className="font-extrabold text-lg font-heading text-brand-navy">
                  Monsieur <span className="text-brand-blue">Fanyi</span>
                </span>
                <span className="block text-[10px] text-brand-muted uppercase tracking-wider font-semibold">
                  Guinée • Espace Sécurisé
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-heading text-brand-navy tracking-tight mb-2">
              {t("auth.loginTitle", "Accédez à votre espace sécurisé")}
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              Consultez vos cours, validez les séances réalisées ou gérez vos candidatures de soutien.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-brand-navy mb-1.5"
              >
                {t("auth.emailLabel", "Adresse email")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom.prenom@exemple.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-brand-navy"
                >
                  {t("auth.passwordLabel", "Mot de passe")}
                </label>
                <a href="#forgot" className="text-[11px] font-semibold text-brand-blue hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-navy via-slate-900 to-brand-navy hover:from-brand-blue hover:to-brand-blue-deep text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>{t("nav.login", "Connexion")}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-brand-muted">
            <span>{t("auth.noAccountYet", "Pas encore de compte ?")}</span>
            <Link
              href="/register"
              className="font-bold text-brand-blue hover:text-brand-navy transition-colors inline-flex items-center gap-1"
            >
              <span>{t("nav.register", "Inscription")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Colonne Droite : Bannière Graphique Immersive */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-brand-navy via-slate-900 to-brand-navy-dark text-white p-8 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-radial-dark-mesh opacity-80 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-brand-gold text-[11px] font-semibold border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plateforme de Confiance</span>
            </div>
            <h2 className="text-xl font-bold font-heading leading-snug">
              L'accompagnement scolaire personnalisé à Conakry
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Retrouvez l'historique complet de vos cours et vos rapports pédagogiques validés.
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
              <span>Professeurs vérifiés avec diplômes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
              <span>Séquestre protecteur Orange / MTN</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-brand-teal" />
              <span>Conforme aux programmes guinéens</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
