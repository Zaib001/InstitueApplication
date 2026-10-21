"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  User,
  Phone,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

function RegisterContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "teacher" ? "TEACHER" : "PARENT";

  const [role, setRole] = useState<"PARENT" | "TEACHER">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "teacher") {
      setRole("TEACHER");
    } else if (roleParam === "parent") {
      setRole("PARENT");
    }
  }, [searchParams]);

  // Compute password strength score (0 to 4)
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

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage(t("common.error", "Veuillez renseigner tous les champs obligatoires."));
      return;
    }

    if (role === "TEACHER" && !phoneNumber) {
      setErrorMessage("Le numéro de téléphone est obligatoire pour les professeurs (Orange / MTN).");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    if (passwordScore < 3) {
      setErrorMessage("Votre mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          fullName,
          email,
          phoneNumber: phoneNumber || undefined,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Une erreur est survenue lors de l'inscription.");
        setIsLoading(false);
        return;
      }

      // Hard redirect to ensure session cookie is immediately active
      window.location.href = data.redirectUrl || (role === "PARENT" ? "/parent/dashboard" : "/teacher/dashboard");
    } catch {
      setErrorMessage("Une erreur de communication est survenue. Veuillez vérifier votre connexion.");
      setIsLoading(false);
    }
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

      {/* 2. Barre Supérieure Dédiée Auth */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between pb-4 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-200 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/20 shadow-xs group cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("common.back", "Retour à l'accueil")}</span>
        </Link>
        <LanguageSwitcher />
      </header>

      {/* 3. Carte Centrale Auth */}
      <motion.div
        className="w-full max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-[#122b49]/80 backdrop-blur-xl relative z-10 my-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Colonne Gauche : Formulaire d'Inscription */}
        <div className="lg:col-span-7 p-7 sm:p-9 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
                <GraduationCap className="w-5 h-5 text-[#e59a38]" aria-hidden="true" />
              </div>
              <div>
                <span className="font-extrabold text-lg font-heading text-white">
                  Monsieur <span className="text-[#e59a38]">Fanyi</span>
                </span>
                <span className="block text-[10px] text-slate-300 uppercase tracking-wider font-semibold">
                  Guinée • Inscription Gratuite
                </span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight mb-1.5">
              {t("auth.registerTitle", "Créer un compte Monsieur Fanyi")}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Rejoignez la communauté éducative de référence à Conakry et dans toute la Guinée.
            </p>
          </div>

          {/* Sélecteur de Rôle */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-white/10 rounded-full border border-white/15 text-xs font-bold relative">
            <button
              type="button"
              onClick={() => setRole("PARENT")}
              className={`relative z-10 py-2 rounded-full transition-colors cursor-pointer ${
                role === "PARENT" ? "text-white" : "text-slate-300 hover:text-white"
              }`}
              aria-pressed={role === "PARENT"}
            >
              {role === "PARENT" && (
                <motion.div
                  layoutId="roleActiveBubble"
                  className="absolute inset-0 rounded-full bg-[#16385c] border border-white/20 shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {t("roles.parent", "Parent d'élève")}
            </button>

            <button
              type="button"
              onClick={() => setRole("TEACHER")}
              className={`relative z-10 py-2 rounded-full transition-colors cursor-pointer ${
                role === "TEACHER" ? "text-white" : "text-slate-300 hover:text-white"
              }`}
              aria-pressed={role === "TEACHER"}
            >
              {role === "TEACHER" && (
                <motion.div
                  layoutId="roleActiveBubble"
                  className="absolute inset-0 rounded-full bg-[#16385c] border border-white/20 shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {t("roles.teacher", "Professeur")}
            </button>
          </div>

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="register-fullname"
                className="block text-xs font-semibold text-slate-200 mb-1"
              >
                {t("auth.fullNameLabel", "Nom et prénom")}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="register-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Mamadou Diallo"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-slate-200 mb-1"
              >
                {t("auth.emailLabel", "Adresse email")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="register-phone"
                className="block text-xs font-semibold text-slate-200 mb-1"
              >
                {t("auth.phoneLabel", "Numéro de téléphone (Guinée)")}
                {role === "PARENT" && <span className="text-slate-400 font-normal"> (facultatif)</span>}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                <input
                  id="register-phone"
                  type="tel"
                  required={role === "TEACHER"}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="620 00 00 00"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-slate-200 mb-1"
                >
                  {t("auth.passwordLabel", "Mot de passe")}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="block text-xs font-semibold text-slate-200 mb-1"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" aria-hidden="true" />
                  <input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e59a38] focus:border-transparent transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Indicateur de force du mot de passe */}
            {password.length > 0 && (
              <div className="space-y-1 pt-0.5">
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
              className="w-full py-3 px-6 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Création de votre compte...</span>
                </>
              ) : (
                <>
                  <span>
                    {role === "PARENT"
                      ? "Créer mon compte Parent"
                      : "Créer mon compte Professeur"}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span>{t("auth.alreadyAccount", "Vous avez déjà un compte ?")}</span>
            <Link
              href="/login"
              className="font-bold text-[#e59a38] hover:text-[#f5af52] transition-colors inline-flex items-center gap-1"
            >
              <span>{t("nav.login", "Connexion")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Colonne Droite : Bannière Graphique */}
        <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#16385c] via-[#0f243c] to-[#0a1626] text-white p-8 flex-col justify-between overflow-hidden border-l border-white/10">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-semibold border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{role === "PARENT" ? "Espace Familles" : "Espace Enseignants"}</span>
            </div>
            <h2 className="text-xl font-bold font-heading leading-snug">
              {role === "PARENT"
                ? "Offrez à votre enfant l'encadrement qu'il mérite"
                : "Monétisez vos compétences au meilleur tarif en Guinée"}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {role === "PARENT"
                ? "Recherchez parmi les meilleurs enseignants vérifiés de Conakry, suivez chaque séance et payez en toute sécurité."
                : "Rejoignez le réseau d'élite de Monsieur Fanyi : 85% de rémunération garantie et paiements ponctuels par Mobile Money."}
            </p>
          </div>

          <div className="relative z-10 space-y-3 pt-6 border-t border-white/10 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
              <span>
                {role === "PARENT"
                  ? "Paiement bloqué jusqu'à votre validation"
                  : "85% net par heure de cours dispensée"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
              <span>
                {role === "PARENT"
                  ? "Rapport pédagogique après chaque leçon"
                  : "Planning flexible selon vos disponibilités"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
              <span>Support dédié disponible 7j/7 à Conakry</span>
            </div>
          </div>
        </div>
      </motion.div>

      <footer className="text-center text-xs text-slate-400 py-3 relative z-10">
        © 2026 Monsieur Fanyi • Plateforme Éducative Sécurisée en Guinée
      </footer>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#10243d]" />}>
      <RegisterContent />
    </Suspense>
  );
}
