"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface NotificationPreferences {
  inAppEnabled: boolean;
  emailGeneral: boolean;
  emailReminders: boolean;
  emailReports: boolean;
  emailDisputes: boolean;
}

export function NotificationPreferencesForm() {
  const { locale } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    inAppEnabled: true,
    emailGeneral: true,
    emailReminders: true,
    emailReports: true,
    emailDisputes: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPrefs({
              inAppEnabled: data.preferences.inAppEnabled ?? true,
              emailGeneral: data.preferences.emailGeneral ?? true,
              emailReminders: data.preferences.emailReminders ?? true,
              emailReports: data.preferences.emailReports ?? true,
              emailDisputes: data.preferences.emailDisputes ?? true,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPreferences();
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (key === "inAppEnabled") return; // Always keep in-app enabled
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMessage(data.error || "Erreur lors de la mise à jour des préférences.");
        setIsSaving(false);
        return;
      }

      setSuccessMessage(
        locale === "en"
          ? "Notification preferences updated successfully."
          : "Vos préférences de notification ont été mises à jour avec succès."
      );
    } catch {
      setErrorMessage(
        locale === "en"
          ? "A network error occurred. Please try again."
          : "Erreur réseau lors de l'enregistrement."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-center gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-[#1c436b]" />
        <span className="text-xs">
          {locale === "en" ? "Loading preferences..." : "Chargement des préférences..."}
        </span>
      </div>
    );
  }

  return (
    <div id="notifications" className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#1c436b]" />
          <h2 className="text-base font-bold text-slate-800 font-heading">
            {locale === "en" ? "Notification & Email Preferences" : "Préférences de Notifications & Emails"}
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {locale === "en"
            ? "Configure how and when Monsieur Fanyi alerts you about lesson activities and reminders."
            : "Choisissez les canaux et événements pour lesquels vous souhaitez recevoir des alertes pédagogiques."}
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* In-App Notifications (Locked on) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-[#1c436b] mt-0.5">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">
                {locale === "en" ? "Dashboard Notifications" : "Alertes Tableau de Bord"}
              </div>
              <p className="text-[11px] text-slate-500">
                {locale === "en"
                  ? "Receive live notifications in your top navigation bell."
                  : "Recevoir les alertes en temps réel dans votre cloche de navigation."}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {locale === "en" ? "Always Active" : "Toujours Actif"}
          </span>
        </div>

        {/* Email Preferences Section */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {locale === "en" ? "Transactional Emails (Resend)" : "Emails Transactionnels"}
          </h3>

          {/* 1. General & Tutoring requests */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Tutoring Requests & Applications" : "Demandes et Candidatures de Cours"}
                </div>
                <p className="text-[11px] text-slate-500">
                  {locale === "en"
                    ? "New teacher offers, parent selections, and classroom assignments."
                    : "Nouvelles candidatures d'enseignants, sélections de parents et attributions de classes."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("emailGeneral")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.emailGeneral ? "bg-[#1c436b]" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={prefs.emailGeneral}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  prefs.emailGeneral ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 2. Automated Reminders (24h before lesson) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Automated 24h Lesson Reminders" : "Rappels Automatiques de Séances (24h avant)"}
                </div>
                <p className="text-[11px] text-slate-500">
                  {locale === "en"
                    ? "Early morning and 24-hour advance email reminders for scheduled tutoring."
                    : "Rappels par email envoyés 24h avant chaque cours planifié."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("emailReminders")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.emailReminders ? "bg-[#1c436b]" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={prefs.emailReminders}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  prefs.emailReminders ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 3. Lesson Reports & Digital Progress Book */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Lesson Reports & Academic Progress" : "Rapports Pédagogiques & Carnet de Notes"}
                </div>
                <p className="text-[11px] text-slate-500">
                  {locale === "en"
                    ? "Notification when a teacher submits a report ready for your validation or grades an assessment."
                    : "Avis immédiat dès qu'un enseignant dépose un rapport de séance ou note un devoir."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("emailReports")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.emailReports ? "bg-[#1c436b]" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={prefs.emailReports}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  prefs.emailReports ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 4. Disputes & Resolution Alerts */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-between gap-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Disputes & Arbitration Updates" : "Litiges & Arbitrages Pédagogiques"}
                </div>
                <p className="text-[11px] text-slate-500">
                  {locale === "en"
                    ? "Updates regarding disputed sessions and administrative resolutions."
                    : "Suivi des contestations de séances et arbitrages officiels de l'administration."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("emailDisputes")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.emailDisputes ? "bg-[#1c436b]" : "bg-slate-200"
              }`}
              role="switch"
              aria-checked={prefs.emailDisputes}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  prefs.emailDisputes ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* 5. Security & Account actions (always active) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Account Security & Verification" : "Sécurité du Compte & Validation"}
                </div>
                <p className="text-[11px] text-slate-500">
                  {locale === "en"
                    ? "Password resets, activation links, and identity verification decisions."
                    : "Réinitialisation de mot de passe, validation d'identité et sécurité (obligatoire)."}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {locale === "en" ? "Protected" : "Protégé"}
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-[#1c436b] hover:bg-[#122b49] text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{locale === "en" ? "Saving..." : "Enregistrement..."}</span>
              </>
            ) : (
              <span>{locale === "en" ? "Save Preferences" : "Enregistrer les préférences"}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
