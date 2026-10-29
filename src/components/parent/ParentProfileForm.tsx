"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  User,
  Phone,
  MapPin,
  Home,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface ParentProfileFormData {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  city: string;
  address?: string | null;
}

interface ParentProfileFormProps {
  initialData: ParentProfileFormData;
  onSaveSuccess: (updated: { fullName: string; phoneNumber: string | null; city: string; address: string | null }) => void;
  onCancel: () => void;
}

export function ParentProfileForm({
  initialData,
  onSaveSuccess,
  onCancel,
}: ParentProfileFormProps) {
  const { t, locale } = useTranslation();

  const [fullName, setFullName] = useState(initialData.fullName || "");
  const [phoneNumber, setPhoneNumber] = useState(initialData.phoneNumber || "");
  const [city, setCity] = useState(initialData.city || "Conakry");
  const [address, setAddress] = useState(initialData.address || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(
        locale === "en"
          ? "Please enter your full name (at least 2 characters)."
          : "Veuillez renseigner votre nom complet (au moins 2 caractères)."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/parent/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || null,
          city: city.trim(),
          address: address.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error ||
            (locale === "en"
              ? "Error updating information."
              : "Erreur lors de la mise à jour.")
        );
      }

      setSuccessMessage(
        t(
          "parent.profileForm.success",
          "Vos coordonnées ont été mises à jour avec succès !"
        )
      );

      onSaveSuccess({
        fullName: json.user.fullName,
        phoneNumber: json.user.phoneNumber,
        city: json.profile.city,
        address: json.profile.address,
      });

      setTimeout(() => {
        onCancel();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-800 font-heading">
              {t("parent.profileForm.title", "Coordonnées du compte parent")}
            </h2>
            <p className="text-xs text-slate-400">
              {t(
                "parent.profileForm.subtitle",
                "Informations utilisées pour la mise en relation avec les professeurs à domicile"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("parent.profileForm.nameLabel", "Nom complet du parent *")}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email (identifiant de connexion)
            </label>
            <input
              type="email"
              disabled
              value={initialData.email}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400">
              {locale === "en"
                ? "Email is locked for account security."
                : "L'adresse email est verrouillée pour des raisons de sécurité."}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t(
                "parent.profileForm.phoneLabel",
                "Numéro de téléphone (Orange / MTN) *"
              )}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="620 00 00 00"
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("parent.profileForm.cityLabel", "Ville de résidence en Guinée *")}
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                >
                  <option value="Conakry">Conakry</option>
                  <option value="Kindia">Kindia</option>
                  <option value="Labé">Labé</option>
                  <option value="Mamou">Mamou</option>
                  <option value="Kankan">Kankan</option>
                  <option value="Boké">Boké</option>
                  <option value="Nzérékoré">Nzérékoré</option>
                  <option value="Autre ville">
                    {locale === "en" ? "Other City" : "Autre préfecture"}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("parent.profileForm.addressLabel", "Adresse précise du domicile")}
              </label>
              <div className="relative">
                <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t(
                    "parent.profileForm.addressPlaceholder",
                    "ex: Kipé Centre Émetteur, Ratoma"
                  )}
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t("parent.form.cancelBtn", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    {t("parent.profileForm.saving", "Mise à jour en cours...")}
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-[#e59a38]" />
                  <span>
                    {t(
                      "parent.profileForm.saveBtn",
                      "Mettre à jour mes informations"
                    )}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
