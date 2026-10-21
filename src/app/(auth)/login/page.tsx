"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage(t("common.error", "Veuillez renseigner tous les champs obligatoires."));
      return;
    }

    setStatusMessage(
      t(
        "auth.phaseNotice",
        "Le module d'authentification serveur complet sera activé lors de la Phase P10. Vous êtes sur le socle certifié Phase 01."
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#16385c] via-[#10243d] to-[#0a1626] text-white">
      {/* 1. Lignes d'ambiance en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none -z-0 overflow-hidden opacity-15">
        <svg
          className="absolute -top-32 -left-32 w-[700px] h-[700px] text-cyan-300"
          viewBox="0 0 700 700"
          fill="none"
        >
          <circle cx="350" cy="350" r="200" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="350" cy="350" r="320" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </div>

      {/* 2. Barre Supérieure Dédiée Auth (Retour à l'accueil + Switcher de Langue) */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 shadow-xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("common.back", "Retour à l'accueil")}</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* 3. Carte Centrale Auth — Harmonisée en Verre Foncé Dépoli (Dark Glassmorphism) */}
      <motion.main
        className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-[#122b49]/80 backdrop-blur-xl relative z-10 my-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Colonne Gauche : Formulaire de Connexion */}
        <div className="lg:col-span-7 p-7 sm:p-10 space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5 text-[#e59a38]" aria-hidden="true" />
              </div>
              <div>
                <span className="font-extrabold text-lg font-heading text-white">
                  Monsieur <span className="text-[#e59a38]">Fanyi</span>
                </span>
                <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  Guinée • Espace Sécurisé
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight mb-2">
              {t("auth.loginTitle", "Accédez à votre espace sécurisé")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consultez vos cours, validez les séances réalisées ou gérez vos candidatures de soutien.
            </p>
          </div>

          {/* Messages de statut & d'erreur */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {statusMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#e59a38] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{statusMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-200"
                >
                  {t("auth.passwordLabel", "Mot de passe")}
                </label>
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
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>{t("nav.login", "Connexion")}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>{t("auth.noAccountYet", "Pas encore de compte ?")}</span>
            <Link
              href="/register"
              className="font-bold text-[#e59a38] hover:text-[#f5af52] transition-colors inline-flex items-center gap-1"
            >
              <span>{t("nav.register", "Inscription")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Colonne Droite : Bannière Graphique Immersive */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#16385c] via-[#0f243c] to-[#0a1626] text-white p-8 flex-col justify-between overflow-hidden border-l border-white/10">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-semibold border border-white/15">
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
              <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
              <span>Professeurs vérifiés avec diplômes</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
              <span>Séquestre protecteur Orange / MTN</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
              <span>Conforme aux programmes guinéens</span>
            </div>
          </div>
        </div>
      </motion.main>

      <footer className="text-center text-xs text-slate-400 py-3 relative z-10">
        © 2026 Monsieur Fanyi • Plateforme Éducative Sécurisée en Guinée
      </footer>
    </div>
  );
}
