"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordScore = getPasswordStrength(password);
  const strengthLabels = ["Très court", "Faible", "Moyen", "Bon", "Excellent"];
  const strengthColors = [
    "bg-slate-600",
    "bg-rose-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!token) {
      setErrorMessage("Jeton de réinitialisation manquant dans l'adresse. Veuillez utiliser le lien reçu.");
      return;
    }

    if (!password || !confirmPassword) {
      setErrorMessage("Veuillez renseigner les deux champs de mot de passe.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (passwordScore < 3) {
      setErrorMessage("Le mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Une erreur est survenue lors de la réinitialisation.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(data.message || "Votre mot de passe a été mis à jour avec succès.");
      setIsLoading(false);
    } catch {
      setErrorMessage("Erreur de communication avec le serveur.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#16385c] via-[#10243d] to-[#0a1626] text-white">
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
            Nouveau mot de passe
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Créez un mot de passe sécurisé pour protéger votre compte Monsieur Fanyi.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
            <Link
              href="/login"
              className="w-full py-3.5 px-6 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Se connecter avec le nouveau mot de passe</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reset-password"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="reset-confirm-password"
                className="block text-xs font-semibold text-slate-200 mb-1.5"
              >
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="reset-confirm-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {password.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Force du mot de passe :</span>
                  <span className="font-semibold text-white">
                    {strengthLabels[Math.min(passwordScore, 4)]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordScore >= 1 ? strengthColors[passwordScore] : "bg-transparent"}`} />
                  <div className={`h-full ${passwordScore >= 2 ? strengthColors[passwordScore] : "bg-transparent"}`} />
                  <div className={`h-full ${passwordScore >= 3 ? strengthColors[passwordScore] : "bg-transparent"}`} />
                  <div className={`h-full ${passwordScore >= 4 ? strengthColors[passwordScore] : "bg-transparent"}`} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mise à jour en cours...</span>
                </>
              ) : (
                <>
                  <span>Valider le nouveau mot de passe</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.main>

      <footer className="text-center text-xs text-slate-400 py-3 relative z-10">
        © 2026 Monsieur Fanyi • Plateforme Éducative Sécurisée en Guinée
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#10243d]" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
