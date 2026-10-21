"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { GraduationCap, ShieldCheck, ArrowRight, Lock, Mail, User, Phone } from "lucide-react";

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
    <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-3xl border border-border shadow-md">
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-navy items-center justify-center text-white mb-2 shadow-xs">
          <GraduationCap className="w-7 h-7 text-brand-gold" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-black text-brand-navy tracking-tight">
          {t("auth.registerTitle", "Créer un compte Monsieur Fanyi")}
        </h1>
        <p className="text-xs text-muted-foreground">
          {t("common.appTagline", "L'excellence du soutien scolaire en Guinée")}
        </p>
      </div>

      {/* Sélecteur de rôle Parent / Professeur */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl border border-border text-xs font-semibold">
        <button
          type="button"
          onClick={() => setRole("PARENT")}
          className={`py-2 rounded-lg transition-colors ${
            role === "PARENT"
              ? "bg-brand-navy text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={role === "PARENT"}
        >
          {t("roles.parent", "Parent d'élève")}
        </button>
        <button
          type="button"
          onClick={() => setRole("TEACHER")}
          className={`py-2 rounded-lg transition-colors ${
            role === "TEACHER"
              ? "bg-brand-navy text-white shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={role === "TEACHER"}
        >
          {t("roles.teacher", "Professeur")}
        </button>
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
            htmlFor="register-fullname"
            className="block text-xs font-semibold text-brand-navy mb-1"
          >
            {t("auth.fullNameLabel", "Nom et prénom")}
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" aria-hidden="true" />
            <input
              id="register-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ex: Mamadou Diallo"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-email"
            className="block text-xs font-semibold text-brand-navy mb-1"
          >
            {t("auth.emailLabel", "Adresse email")}
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" aria-hidden="true" />
            <input
              id="register-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-phone"
            className="block text-xs font-semibold text-brand-navy mb-1"
          >
            {t("auth.phoneLabel", "Numéro de téléphone (ex: +224 620 00 00 00)")}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-muted-foreground absolute left-3 top-3" aria-hidden="true" />
            <input
              id="register-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+224 620 00 00 00"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-brand-blue transition-all"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="register-password"
            className="block text-xs font-semibold text-brand-navy mb-1"
          >
            {t("auth.passwordLabel", "Mot de passe")}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" aria-hidden="true" />
            <input
              id="register-password"
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
          <span>{t("nav.register", "Inscription")}</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>

      <div className="text-center pt-2 border-t border-border text-xs text-muted-foreground">
        <span>{t("auth.alreadyHaveAccount", "Vous avez déjà un compte ?")}{" "}</span>
        <Link href="/login" className="font-semibold text-brand-blue hover:underline">
          {t("nav.login", "Connexion")}
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="p-8 text-center text-xs text-muted-foreground">Chargement...</div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
