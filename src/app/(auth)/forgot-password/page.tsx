"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage("Veuillez renseigner votre adresse email.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Une erreur est survenue lors de la demande.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        data.message ||
          "Si un compte existe avec cette adresse, un lien de réinitialisation sécurisé vous a été envoyé."
      );
      setEmail("");
      setIsLoading(false);
    } catch {
      setErrorMessage("Erreur de connexion au serveur. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#16385c] via-[#10243d] to-[#0a1626] text-white">
      {/* Lignes d'ambiance en arrière-plan */}
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

      <header className="w-full max-w-xl mx-auto flex items-center justify-between pb-6 relative z-10">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 shadow-xs group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("common.back", "Retour à la connexion")}</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <motion.main
        className="w-full max-w-xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-[#122b49]/80 backdrop-blur-xl relative z-10 p-7 sm:p-10 space-y-6 my-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md mb-4">
            <KeyRound className="w-6 h-6 text-[#e59a38]" aria-hidden="true" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight mb-2">
            Mot de passe oublié ?
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Saisissez l'adresse email liée à votre compte Monsieur Fanyi. Nous vous enverrons un lien sécurisé valable 1 heure pour réinitialiser votre accès.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-xs font-semibold text-slate-200 mb-1.5"
            >
              Votre adresse email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom.prenom@exemple.com"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Envoi de la demande...</span>
              </>
            ) : (
              <>
                <span>Envoyer le lien de réinitialisation</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-300">
          <span>Vous vous souvenez de vos identifiants ? </span>
          <Link
            href="/login"
            className="font-bold text-[#e59a38] hover:text-[#f5af52] transition-colors"
          >
            Retourner à la connexion
          </Link>
        </div>
      </motion.main>

      <footer className="text-center text-xs text-slate-400 py-3 relative z-10">
        © 2026 Monsieur Fanyi • Plateforme Éducative Sécurisée en Guinée
      </footer>
    </div>
  );
}
