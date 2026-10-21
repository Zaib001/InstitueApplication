"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
} from "lucide-react";

function RegisterContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") === "teacher" ? "TEACHER" : "PARENT";

  const [role, setRole] = useState<"PARENT" | "TEACHER">(initialRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "teacher") {
      setRole("TEACHER");
    } else if (roleParam === "parent") {
      setRole("PARENT");
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(
      t(
        "auth.phaseNoticeRegister",
        "L'enregistrement effectif en base de données avec RBAC sera activé lors des phases P09-P11. Vous êtes sur le socle certifié Phase 01."
      )
    );
  };

  return (
    <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-white text-slate-900">
      
      {/* Colonne Gauche : Formulaire d'Inscription */}
      <div className="lg:col-span-7 p-8 sm:p-12 space-y-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#16385c] flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5 text-[#e59a38]" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-lg font-heading text-slate-900">
                Monsieur <span className="text-brand-blue">Fanyi</span>
              </span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Guinée • Inscription Gratuite
              </span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-900 tracking-tight mb-2">
            {t("auth.registerTitle", "Créer un compte Monsieur Fanyi")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Rejoignez la communauté éducative de référence à Conakry et dans toute la Guinée.
          </p>
        </div>

        {/* Sélecteur de Rôle Parent / Professeur */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-full border border-slate-200/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => setRole("PARENT")}
            className={`py-2 rounded-full transition-all duration-200 ${
              role === "PARENT"
                ? "bg-[#16385c] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
            aria-pressed={role === "PARENT"}
          >
            {t("roles.parent", "Parent d'élève")}
          </button>
          <button
            type="button"
            onClick={() => setRole("TEACHER")}
            className={`py-2 rounded-full transition-all duration-200 ${
              role === "TEACHER"
                ? "bg-[#16385c] text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
            aria-pressed={role === "TEACHER"}
          >
            {t("roles.teacher", "Professeur")}
          </button>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="register-fullname"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              {t("auth.fullNameLabel", "Nom et prénom")}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="register-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ex: Mamadou Diallo"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              {t("auth.emailLabel", "Adresse email")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-phone"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              {t("auth.phoneLabel", "Numéro de téléphone (ex: +224 620 00 00 00)")}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="register-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+224 620 00 00 00"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-xs font-bold text-slate-800 mb-1"
            >
              {t("auth.passwordLabel", "Mot de passe")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-sm shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>{t("nav.register", "Inscription")}</span>
            <ArrowRight className="w-4 h-4 text-white" aria-hidden="true" />
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{t("auth.alreadyHaveAccount", "Vous avez déjà un compte ?")}</span>
          <Link
            href="/login"
            className="font-bold text-[#e59a38] hover:text-[#d68b29] transition-colors inline-flex items-center gap-1"
          >
            <span>{t("nav.login", "Connexion")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Colonne Droite : Bannière Graphique Immersive */}
      <div className="hidden lg:flex lg:col-span-5 relative bg-gradient-to-br from-[#16385c] via-[#122e4c] to-[#0c1f34] text-white p-8 flex-col justify-between overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[11px] font-semibold border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{role === "PARENT" ? "Pour les Familles" : "Pour les Enseignants"}</span>
          </div>

          <h2 className="text-xl font-bold font-heading leading-snug">
            {role === "PARENT"
              ? "Trouvez le tuteur idéal pour votre enfant en quelques clics"
              : "Valorisez vos compétences et percevez 85% de rémunération nette"}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed">
            {role === "PARENT"
              ? "Publiez gratuitement votre demande. Recevez des candidatures de professeurs certifiés avec diplômes validés."
              : "Fixez librement vos disponibilités et zones d'intervention à Conakry. Recevez vos versements sur Orange Money ou MTN."}
          </p>
        </div>

        <div className="relative z-10 space-y-3 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
            <span>Inscription 100% gratuite</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
            <span>Suivi pédagogique séance par séance</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-[#e59a38]" />
            <span>Paiements mobiles sécurisés en Guinée</span>
          </div>
        </div>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 py-6 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#16385c] via-[#10243d] to-[#0a1626] text-white">
      {/* Barre Supérieure Dédiée Auth (Retour & Switcher de Langue) */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors bg-white/10 hover:bg-white/15 px-3.5 py-1.5 rounded-full border border-white/20"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("common.back", "Retour")}</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full flex justify-center my-auto">
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-300">Chargement...</div>}>
          <RegisterContent />
        </Suspense>
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        © 2026 Monsieur Fanyi • Plateforme Éducative Sécurisée en Guinée
      </div>
    </div>
  );
}
