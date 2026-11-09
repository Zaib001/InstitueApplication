"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedUser } from "@/lib/auth/session";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  LogOut,
  Bell,
  SlidersHorizontal,
  Calendar,
  Award,
  Check,
  Copy,
  Sparkles,
  HelpCircle,
  Info,
  Building2,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  GraduationCap,
  Users,
} from "lucide-react";

interface AccountSettingsClientProps {
  user: AuthenticatedUser;
  initialAddress?: string | null;
  initialCity?: string | null;
  memberSince?: string;
  stats?: {
    childrenCount?: number;
    classroomsCount?: number;
    verificationStatus?: string | null;
  };
}

const GUINEAN_CITIES = [
  "Conakry",
  "Kindia",
  "Labé",
  "Kankan",
  "Mamou",
  "Boké",
  "Nzérékoré",
  "Faranah",
  "Coyah",
  "Dubréka",
  "Siguiri",
  "Kissidougou",
  "Guéckédou",
  "Macenta",
  "Pita",
  "Dalaba",
  "Autre ville",
];

export function AccountSettingsClient({
  user,
  initialAddress,
  initialCity,
  memberSince,
  stats,
}: AccountSettingsClientProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();

  // Active Tab: "profile" | "security" | "notifications" | "session"
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "notifications" | "session"
  >("profile");

  // Sync hash on mount/change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (
        hash === "profile" ||
        hash === "security" ||
        hash === "notifications" ||
        hash === "session"
      ) {
        setActiveTab(hash);
      }
    }
  }, []);

  const handleTabChange = (
    tab: "profile" | "security" | "notifications" | "session"
  ) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  };

  // =========================================================================
  // 1. PROFILE STATE & ACTIONS
  // =========================================================================
  const [fullName, setFullName] = useState(user.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [city, setCity] = useState(initialCity || "Conakry");
  const [address, setAddress] = useState(initialAddress || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsUpdatingProfile(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          city: city.trim(),
          address: user.role === "PARENT" ? address.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(
          data.error ||
            (locale === "en"
              ? "Failed to update profile coordinates."
              : "Erreur lors de la mise à jour des coordonnées.")
        );
        setIsUpdatingProfile(false);
        return;
      }

      setProfileSuccess(
        locale === "en"
          ? "Your profile details have been successfully updated."
          : "Vos coordonnées personnelles ont été enregistrées avec succès."
      );
      setIsUpdatingProfile(false);
      router.refresh();
    } catch {
      setProfileError(
        locale === "en"
          ? "Network connection error. Please try again."
          : "Erreur réseau. Veuillez réessayer."
      );
      setIsUpdatingProfile(false);
    }
  };

  // =========================================================================
  // 2. SECURITY & PASSWORD STATE & ACTIONS
  // =========================================================================
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dynamic Password validation rules
  const pwdValidation = useMemo(() => {
    return {
      hasMinLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      matches: confirmPassword.length > 0 && newPassword === confirmPassword,
    };
  }, [newPassword, confirmPassword]);

  const isPasswordFormValid =
    currentPassword.length > 0 &&
    pwdValidation.hasMinLength &&
    pwdValidation.hasUpper &&
    pwdValidation.hasLower &&
    pwdValidation.hasNumber &&
    pwdValidation.matches;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError(
        locale === "en"
          ? "Please provide your current password."
          : "Veuillez renseigner votre mot de passe actuel."
      );
      return;
    }

    if (!pwdValidation.hasMinLength) {
      setPasswordError(
        locale === "en"
          ? "New password must be at least 8 characters long."
          : "Le nouveau mot de passe doit comporter au moins 8 caractères."
      );
      return;
    }

    if (!pwdValidation.hasUpper) {
      setPasswordError(
        locale === "en"
          ? "New password must include at least one uppercase letter (A-Z)."
          : "Le mot de passe doit contenir au moins une lettre majuscule (A-Z)."
      );
      return;
    }

    if (!pwdValidation.hasLower) {
      setPasswordError(
        locale === "en"
          ? "New password must include at least one lowercase letter (a-z)."
          : "Le mot de passe doit contenir au moins une lettre minuscule (a-z)."
      );
      return;
    }

    if (!pwdValidation.hasNumber) {
      setPasswordError(
        locale === "en"
          ? "New password must include at least one digit (0-9)."
          : "Le mot de passe doit contenir au moins un chiffre (0-9)."
      );
      return;
    }

    if (!pwdValidation.matches) {
      setPasswordError(
        locale === "en"
          ? "New password and confirmation do not match."
          : "La confirmation ne correspond pas au nouveau mot de passe."
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPasswordError(
          data.error ||
            (locale === "en"
              ? "Failed to change password. Please verify your current password."
              : "Erreur lors de la modification du mot de passe.")
        );
        setIsChangingPassword(false);
        return;
      }

      setPasswordSuccess(
        locale === "en"
          ? "Your password has been securely updated. A confirmation notice was logged."
          : "Votre mot de passe a été mis à jour avec succès. Un avis de sécurité a été consigné."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch {
      setPasswordError(
        locale === "en"
          ? "Network error. Please try again."
          : "Erreur réseau. Veuillez réessayer."
      );
      setIsChangingPassword(false);
    }
  };

  // =========================================================================
  // 3. NOTIFICATION PREFERENCES STATE & ACTIONS
  // =========================================================================
  const [prefs, setPrefs] = useState({
    emailLessonReminders: true,
    emailReportSubmitted: true,
    emailHomeworkAssigned: true,
    emailAssessmentRecorded: true,
    emailProgressDigest: true,
    emailMarketplaceOpportunities: false,
    emailMarketing: false,
  });
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState<string | null>(null);
  const [prefsError, setPrefsError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (res.ok) {
          const data = await res.json();
          if (data.preferences) {
            setPrefs({
              emailLessonReminders:
                data.preferences.emailLessonReminders ?? true,
              emailReportSubmitted:
                data.preferences.emailReportSubmitted ?? true,
              emailHomeworkAssigned:
                data.preferences.emailHomeworkAssigned ?? true,
              emailAssessmentRecorded:
                data.preferences.emailAssessmentRecorded ?? true,
              emailProgressDigest:
                data.preferences.emailProgressDigest ?? true,
              emailMarketplaceOpportunities:
                data.preferences.emailMarketplaceOpportunities ?? false,
              emailMarketing: data.preferences.emailMarketing ?? false,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load notification preferences:", err);
      } finally {
        setIsLoadingPrefs(false);
      }
    }

    loadPreferences();
  }, []);

  const handleTogglePref = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    setPrefsSuccess(null);
    setPrefsError(null);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!res.ok) {
        const data = await res.json();
        setPrefsError(
          data.error ||
            (locale === "en"
              ? "Failed to update notification preferences."
              : "Erreur lors de l'enregistrement des préférences.")
        );
        setIsSavingPrefs(false);
        return;
      }

      setPrefsSuccess(
        locale === "en"
          ? "Notification preferences updated successfully."
          : "Vos préférences de notification ont été mises à jour avec succès."
      );
      setIsSavingPrefs(false);
    } catch {
      setPrefsError(
        locale === "en"
          ? "A network error occurred. Please try again."
          : "Erreur réseau. Veuillez réessayer."
      );
      setIsSavingPrefs(false);
    }
  };

  // =========================================================================
  // 4. SESSION & ACCOUNT IDENTITY STATE & ACTIONS
  // =========================================================================
  const [copiedId, setCopiedId] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // Formatted registration date
  const formattedMemberSince = useMemo(() => {
    if (!memberSince) return locale === "en" ? "October 2026" : "Octobre 2026";
    try {
      const d = new Date(memberSince);
      return d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return memberSince;
    }
  }, [memberSince, locale]);

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Bar with Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {user.role === "PARENT"
                ? locale === "en"
                  ? "Family Space"
                  : "Espace Famille"
                : user.role === "TEACHER"
                ? locale === "en"
                  ? "Teacher Space"
                  : "Espace Enseignant"
                : locale === "en"
                ? "Administration"
                : "Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Account Settings" : "Paramètres du Compte"}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en"
              ? "Account & Security Settings"
              : "Paramètres & Sécurité du Compte"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "en"
              ? "Manage your identity, Guinean Orange & MTN contact info, password authentication, and notification channels."
              : "Gérez votre identité, vos coordonnées Orange Money & MTN, la sécurité de votre accès et vos canaux d'alerte."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <NotificationBell variant="light" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. Executive Profile Hero Banner Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-5">
          {/* User Monogram Avatar with Guinea Gold Ring */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16385c] to-[#0d2238] text-white flex items-center justify-center text-xl font-black font-heading shadow-md shadow-blue-900/15 ring-4 ring-[#e59a38]/20">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="w-4 h-4 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-1 -right-1 shadow-xs" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-heading">
                {user.fullName}
              </h2>

              {/* Role Badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  user.role === "PARENT"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : user.role === "TEACHER"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                {user.role === "PARENT"
                  ? locale === "en"
                    ? "Family / Parent"
                    : "Famille / Parent"
                  : user.role === "TEACHER"
                  ? stats?.verificationStatus === "APPROVED"
                    ? locale === "en"
                      ? "Certified Teacher"
                      : "Professeur Certifié"
                    : locale === "en"
                    ? "Teacher Candidate"
                    : "Enseignant Candidat"
                  : locale === "en"
                  ? "Platform Administrator"
                  : "Administrateur Système"}
              </span>

              {/* Account Status Pill */}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{locale === "en" ? "Active Account" : "Compte Actif"}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </span>

              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{city}, Guinée</span>
              </span>

              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {locale === "en" ? "Member since" : "Inscrit en"}{" "}
                  {formattedMemberSince}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Context Stats on the right */}
        <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
          {user.role === "PARENT" && (
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                {locale === "en" ? "Children" : "Enfants"}
              </span>
              <span className="text-base font-black text-[#16385c]">
                {stats?.childrenCount ?? 0}
              </span>
            </div>
          )}

          {user.role === "TEACHER" && (
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
                {locale === "en" ? "Classrooms" : "Classes"}
              </span>
              <span className="text-base font-black text-[#16385c]">
                {stats?.classroomsCount ?? 0}
              </span>
            </div>
          )}

          <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
            <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">
              {locale === "en" ? "Zone" : "Zone"}
            </span>
            <span className="text-xs font-bold text-slate-700">GNF (GN)</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Segmented Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => handleTabChange("profile")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "profile"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <User className="w-3.5 h-3.5 text-blue-600" />
          <span>{locale === "en" ? "Profile & Contact" : "Profil & Coordonnées"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("security")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "security"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>{locale === "en" ? "Security & Access" : "Sécurité & Mot de Passe"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "notifications"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-purple-600" />
          <span>
            {locale === "en"
              ? "Notification Preferences"
              : "Préférences de Notification"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("session")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeTab === "session"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {locale === "en" ? "Session & Identity" : "Identité & Session"}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: PROFILE & CONTACT DETAILS */}
      {/* ===================================================================== */}
      {activeTab === "profile" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
                <User className="w-4 h-4 text-blue-600" />
                <span>
                  {locale === "en"
                    ? "Personal Details & Contact Coordinates"
                    : "Coordonnées & Informations Personnelles"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {locale === "en"
                  ? "Update your contact information. Your phone number is strictly used for lesson reminders and Orange / MTN mobile settlements."
                  : "Mettez à jour vos informations. Votre numéro est utilisé pour les rappels de cours et les règlements Orange Money / MTN Mobile Money."}
              </p>
            </div>

            {profileError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {locale === "en" ? "Update Failed" : "Erreur de mise à jour"}
                  </span>
                  <span>{profileError}</span>
                </div>
              </div>
            )}

            {profileSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {locale === "en"
                      ? "Information Updated"
                      : "Informations enregistrées"}
                  </span>
                  <span>{profileSuccess}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === "en" ? "Full Name" : "Nom complet"}
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={
                        locale === "en" ? "e.g. Mamadou Bah" : "ex: Mamadou Bah"
                      }
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Email Address (Locked) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      {locale === "en" ? "Email Address" : "Adresse e-mail"}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {locale === "en" ? "Authentication Login" : "Identifiant vérifié"}
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed font-medium shadow-xs"
                    />
                  </div>
                </div>

                {/* Guinean Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === "en"
                      ? "Phone Number (Orange / MTN)"
                      : "Numéro de téléphone (Orange / MTN)"}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none text-xs font-bold text-slate-600 border-r border-slate-200 pr-2">
                      <span>🇬🇳</span>
                      <span>+224</span>
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="620 12 34 56"
                      className="w-full pl-24 pr-4 py-2.5 text-xs rounded-xl border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {locale === "en"
                      ? "Format: 9 digits starting with 6 (ex: 620123456)."
                      : "Format : 9 chiffres débutant par 6 (ex: 620123456)."}
                  </span>
                </div>

                {/* City of Residence */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === "en" ? "City of Residence" : "Ville de résidence"}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 text-xs rounded-xl border border-slate-200/90 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs cursor-pointer appearance-none"
                    >
                      {GUINEAN_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* In-Home Address (Parent Role Only) */}
              {user.role === "PARENT" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === "en"
                      ? "Neighborhood / Home Lesson Address"
                      : "Quartier / Adresse pour cours à domicile"}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={
                        locale === "en"
                          ? "e.g. Kipé Centre, near Centre Émetteur, Ratoma"
                          : "ex: Kipé Centre, près du Carrefour Émetteur, Commune de Ratoma"
                      }
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {locale === "en"
                      ? "Allows verified tutors to locate your home accurately for physical tutoring sessions."
                      : "Permet aux enseignants agréés de localiser précisément votre domicile pour les cours particuliers en présentiel."}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {locale === "en"
                      ? "Protected under Guinea privacy compliance."
                      : "Données confidentielles et protégées."}
                  </span>
                </span>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{locale === "en" ? "Saving..." : "Enregistrement..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#e59a38]" />
                      <span>
                        {locale === "en"
                          ? "Save Contact Information"
                          : "Enregistrer mes coordonnées"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SECURITY & PASSWORD AUTHENTICATION */}
      {/* ===================================================================== */}
      {activeTab === "security" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>
                  {locale === "en"
                    ? "Password Authentication & Encryption"
                    : "Authentification & Modification du Mot de Passe"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {locale === "en"
                  ? "Ensure your account is protected with a resilient password. Password hashes are salted and encrypted with Bcrypt."
                  : "Pour modifier votre mot de passe, confirmez votre mot de passe actuel. Les mots de passe sont chiffrés avec Bcrypt (10 rounds)."}
              </p>
            </div>

            {passwordError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {locale === "en" ? "Security Alert" : "Alerte de sécurité"}
                  </span>
                  <span>{passwordError}</span>
                </div>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {locale === "en"
                      ? "Password Updated"
                      : "Mot de passe actualisé"}
                  </span>
                  <span>{passwordSuccess}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === "en" ? "Current Password" : "Mot de passe actuel"}
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <div className="relative max-w-md">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === "en" ? "New Password" : "Nouveau mot de passe"}
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {locale === "en"
                      ? "Confirm New Password"
                      : "Confirmer le nouveau mot de passe"}
                    <span className="text-rose-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200/90 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Password Checklist Requirements */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  {locale === "en"
                    ? "Password Complexity Requirements:"
                    : "Critères de sécurité requis :"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {pwdValidation.hasMinLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasMinLength
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-500"
                      }
                    >
                      {locale === "en"
                        ? "At least 8 characters"
                        : "Au moins 8 caractères"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pwdValidation.hasUpper ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasUpper
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-500"
                      }
                    >
                      {locale === "en"
                        ? "At least one uppercase letter (A-Z)"
                        : "Une majuscule minimum (A-Z)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pwdValidation.hasLower ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasLower
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-500"
                      }
                    >
                      {locale === "en"
                        ? "At least one lowercase letter (a-z)"
                        : "Une minuscule minimum (a-z)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pwdValidation.hasNumber ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.hasNumber
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-500"
                      }
                    >
                      {locale === "en"
                        ? "At least one digit (0-9)"
                        : "Un chiffre minimum (0-9)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:col-span-2">
                    {pwdValidation.matches ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span
                      className={
                        pwdValidation.matches
                          ? "text-emerald-700 font-semibold"
                          : "text-slate-500"
                      }
                    >
                      {locale === "en"
                        ? "Confirmation matches new password"
                        : "Les deux mots de passe correspondent"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    {locale === "en"
                      ? "Requires confirming your current password."
                      : "La confirmation du mot de passe actuel est requise."}
                  </span>
                </span>

                <button
                  type="submit"
                  disabled={isChangingPassword || !isPasswordFormValid}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{locale === "en" ? "Updating..." : "Mise à jour..."}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {locale === "en"
                          ? "Update Password"
                          : "Modifier mon mot de passe"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: NOTIFICATION PREFERENCES */}
      {/* ===================================================================== */}
      {activeTab === "notifications" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
                <Bell className="w-4 h-4 text-purple-600" />
                <span>
                  {locale === "en"
                    ? "Notification Channels & Transactional Alerts"
                    : "Canaux & Préférences de Notification"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {locale === "en"
                  ? "Configure how you receive educational updates, calendar reminders, and report notifications."
                  : "Personnalisez la réception de vos alertes pédagogiques, plannings de cours et bilans académiques."}
              </p>
            </div>

            {prefsError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {locale === "en" ? "Preference Error" : "Erreur d'enregistrement"}
                  </span>
                  <span>{prefsError}</span>
                </div>
              </div>
            )}

            {prefsSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    {locale === "en"
                      ? "Preferences Saved"
                      : "Préférences enregistrées"}
                  </span>
                  <span>{prefsSuccess}</span>
                </div>
              </div>
            )}

            {isLoadingPrefs ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#16385c]" />
                <span className="text-xs font-semibold">
                  {locale === "en"
                    ? "Loading notification preferences..."
                    : "Chargement des préférences..."}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSavePreferences} className="space-y-4">
                {/* 1. In-App Notifications (Locked) */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {locale === "en"
                          ? "In-App Notifications (Dashboard Bell)"
                          : "Notifications sur le tableau de bord (Cloche)"}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {locale === "en" ? "Always Active" : "Toujours Actif"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {locale === "en"
                        ? "Real-time updates delivered to your header bell and notification center."
                        : "Alertes directes transmises en temps réel sur la cloche et le centre de notification."}
                    </p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-[#16385c] flex items-center justify-end px-1 cursor-not-allowed opacity-80">
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                {/* 2. Email Session Reminders */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      {locale === "en"
                        ? "Lesson Session Reminders (24h & 2h before)"
                        : "Rappels de cours par e-mail (24h et 2h avant la séance)"}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {locale === "en"
                        ? "Automated calendar notices sent to your verified email."
                        : "Rappels automatiques de votre emploi du temps pour préparer chaque cours sereinement."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref("emailLessonReminders")}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${
                      prefs.emailLessonReminders ? "bg-[#16385c]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                        prefs.emailLessonReminders ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Lesson Report Submitted */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      {locale === "en"
                        ? "Lesson Reports Submitted by Tutor"
                        : "Comptes rendus pédagogiques déposés par le professeur"}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {locale === "en"
                        ? "Alerts parents immediately when a tutor submits a lesson record for formal validation."
                        : "Alerte immédiate lorsque le professeur transmet son compte rendu pour validation parentale."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref("emailReportSubmitted")}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${
                      prefs.emailReportSubmitted ? "bg-[#16385c]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                        prefs.emailReportSubmitted ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Homework Assigned */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      {locale === "en"
                        ? "Homework Assigned & Upcoming Deadlines"
                        : "Devoirs assignés & rappels d'échéances"}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {locale === "en"
                        ? "Notifications regarding exercises, textbook tasks, and due dates."
                        : "Avis transmis lors de la fixation d'exercices à faire et rappels 24h avant la date limite."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref("emailHomeworkAssigned")}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${
                      prefs.emailHomeworkAssigned ? "bg-[#16385c]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                        prefs.emailHomeworkAssigned ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Academic Assessments & Grades */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      {locale === "en"
                        ? "Evaluations, Scores & Digital Progress Book"
                        : "Évaluations chiffrées & Carnet de Progression"}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {locale === "en"
                        ? "Notices when a test grade, quarterly observation, or competency badge is recorded."
                        : "Alertes lors de l'enregistrement d'une note de contrôle, d'une observation ou d'un badge."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref("emailAssessmentRecorded")}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${
                      prefs.emailAssessmentRecorded ? "bg-[#16385c]" : "bg-slate-200"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                        prefs.emailAssessmentRecorded ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 6. Marketplace Opportunities (Teacher Only) */}
                {user.role === "TEACHER" && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-800 block">
                        {locale === "en"
                          ? "New Tutoring Opportunities (Marketplace)"
                          : "Nouvelles opportunités de cours (Bourse aux cours)"}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {locale === "en"
                          ? "Receive emails when a parent publishes a new request matching your subjects and commune."
                          : "Alertes dès qu'une famille dépose une demande correspondant à vos matières et zones."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTogglePref("emailMarketplaceOpportunities")}
                      className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer shrink-0 ${
                        prefs.emailMarketplaceOpportunities ? "bg-[#16385c]" : "bg-slate-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                          prefs.emailMarketplaceOpportunities
                            ? "translate-x-5"
                            : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* 7. Guaranteed Security Alerts Banner */}
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {locale === "en"
                        ? "Guaranteed Security & Arbitrage Delivery:"
                        : "Garantie de distribution de sécurité & d'arbitrage :"}
                    </span>
                    <p className="text-[11px] text-blue-800/90 leading-relaxed">
                      {locale === "en"
                        ? "Crucial security notifications (such as password changes, dispute filings, and administrative arbitration decisions) cannot be turned off to protect all parties."
                        : "Les alertes critiques de sécurité (réinitialisation de mot de passe, avis de litige et décisions d'arbitrage) sont obligatoirement transmises par email pour garantir l'intégrité contractuelle."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={isSavingPrefs}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] text-white font-bold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPrefs ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>
                          {locale === "en" ? "Saving..." : "Enregistrement..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#e59a38]" />
                        <span>
                          {locale === "en"
                            ? "Save Preferences"
                            : "Enregistrer mes préférences"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: SESSION & ACCOUNT IDENTITY */}
      {/* ===================================================================== */}
      {activeTab === "session" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Technical Metadata Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-heading">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {locale === "en"
                    ? "Technical Identity & System Authorization"
                    : "Identifiant Système & Droits d'Accès"}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {locale === "en"
                  ? "Read-only technical credentials and session encryption parameters."
                  : "Paramètres d'authentification, identifiants chiffrés et sessions actives."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* User ID */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {locale === "en" ? "Unique Account ID" : "Identifiant Unique (CUID)"}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-slate-800 text-xs truncate">
                    {user.id}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer shrink-0"
                    title={locale === "en" ? "Copy ID" : "Copier l'identifiant"}
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Security Protocol */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {locale === "en" ? "Authentication Protocol" : "Protocole de Sécurité"}
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  Bcrypt Hash + HTTP-Only JWT
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  {locale === "en" ? "Active Anti-Tamper Protection" : "Protection anti-altération"}
                </span>
              </div>

              {/* Timezone */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {locale === "en" ? "System Timezone" : "Fuseau Horaire de Cours"}
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  Africa/Conakry (GMT+0)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Heure légale de la République de Guinée
                </span>
              </div>

              {/* Base Currency */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {locale === "en" ? "Billing Currency" : "Devise de Facturation"}
                </span>
                <span className="text-xs font-bold text-[#16385c] block">
                  Franc Guinéen (GNF)
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Zéro décimale, règlements Orange & MTN
                </span>
              </div>

              {/* Account Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {locale === "en" ? "Account Lifecycle" : "Cycle de Vie du Compte"}
                </span>
                <span className="text-xs font-bold text-emerald-600 block">
                  {locale === "en" ? "Active & Verified" : "Actif & Conforme"}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {locale === "en" ? "Role :" : "Rôle :"} {user.role}
                </span>
              </div>

              {/* Member Date */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                  {locale === "en" ? "Member Since" : "Date d'Inscription"}
                </span>
                <span className="text-xs font-bold text-slate-800 block">
                  {formattedMemberSince}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Plateforme Monsieur Fanyi
                </span>
              </div>
            </div>
          </div>

          {/* Logout Section Card */}
          <div className="p-6 rounded-3xl bg-rose-50/60 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-900">
                {locale === "en"
                  ? "Sign Out of Current Device"
                  : "Fermer votre session sur cet appareil"}
              </div>
              <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                {locale === "en"
                  ? "Safely terminate your current authenticated session. You will be redirected to the secure login portal."
                  : "Mettez fin à votre session active en toute sécurité. Vous serez redirigé vers le portail de connexion sécurisé."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-rose-100/60 border border-rose-200 text-rose-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-xs disabled:opacity-50"
            >
              {isLoggingOut ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogOut className="w-3.5 h-3.5" />
              )}
              <span>
                {locale === "en" ? "Log Out Now" : "Se déconnecter maintenant"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

