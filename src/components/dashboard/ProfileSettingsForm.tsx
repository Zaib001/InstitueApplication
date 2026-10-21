"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthenticatedUser } from "@/lib/auth/session";
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
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";

interface ProfileSettingsFormProps {
  user: AuthenticatedUser;
  initialAddress?: string | null;
  initialCity?: string | null;
}

export function ProfileSettingsForm({
  user,
  initialAddress,
  initialCity,
}: ProfileSettingsFormProps) {
  const router = useRouter();

  // Profile fields state
  const [fullName, setFullName] = useState(user.fullName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [city, setCity] = useState(initialCity || "Conakry");
  const [address, setAddress] = useState(initialAddress || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
          fullName,
          phoneNumber,
          city,
          address: user.role === "PARENT" ? address : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setProfileError(data.error || "Erreur lors de la mise à jour.");
        setIsUpdatingProfile(false);
        return;
      }

      setProfileSuccess("Vos informations personnelles ont été enregistrées avec succès.");
      setIsUpdatingProfile(false);
      router.refresh();
    } catch {
      setProfileError("Erreur réseau. Veuillez réessayer.");
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Veuillez remplir tous les champs de mot de passe.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Le nouveau mot de passe doit comporter au moins 8 caractères.");
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
        setPasswordError(data.error || "Erreur lors de la modification du mot de passe.");
        setIsChangingPassword(false);
        return;
      }

      setPasswordSuccess(data.message || "Votre mot de passe a été modifié avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsChangingPassword(false);
    } catch {
      setPasswordError("Erreur réseau. Veuillez réessayer.");
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Informations du Compte & Statut */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-brand-gold" />
          <span>Statut du Compte & Droits d'Accès</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Rôle Attribué</span>
            <span className="font-bold text-white text-sm">{user.role}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">État du Compte</span>
            <span className="font-bold text-emerald-400 text-sm">Actif & Vérifié</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60">
            <span className="text-slate-400 block text-[11px]">Identifiant Unique</span>
            <span className="font-mono text-slate-300 text-[11px] truncate block">
              {user.id}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Formulaire des Informations Personnelles */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-teal-400" />
            <span>Coordonnées Personnelles</span>
          </h2>
          <p className="text-xs text-slate-400 pt-0.5">
            Mettez à jour votre nom ou votre numéro de téléphone (utilisé pour les versements Mobile Money).
          </p>
        </div>

        {profileError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{profileError}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Nom complet
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Adresse email (Non modifiable)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/10 bg-white/5 text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Numéro de téléphone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="620 00 00 00"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Ville de résidence
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Conakry"
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
                />
              </div>
            </div>
          </div>

          {user.role === "PARENT" && (
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Quartier / Adresse de domicile (pour les cours à domicile)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ex: Kipé, près du centre médical"
                className="w-full px-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
              />
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-6 py-2.5 rounded-full bg-[#e59a38] hover:bg-[#d68b29] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Enregistrer mes coordonnées</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Modification de Mot de Passe */}
      <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>Sécurité & Mot de Passe</span>
          </h2>
          <p className="text-xs text-slate-400 pt-0.5">
            Pour modifier votre mot de passe, confirmez votre mot de passe actuel.
          </p>
        </div>

        {passwordError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Nouveau mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                className="w-full px-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Confirmer le nouveau mot de passe
              </label>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 text-sm rounded-xl border border-white/15 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-[#e59a38] transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Modification...</span>
                </>
              ) : (
                <span>Modifier mon mot de passe</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Zone Déconnexion */}
      <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-sm font-bold text-white">Fermer votre session</div>
          <p className="text-xs text-slate-300">
            Déconnectez-vous de votre compte sur cet appareil.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="px-6 py-2.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
