"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
  Clock,
  Loader2,
  Info,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";

interface TeacherApplicationFormProps {
  requestId: string;
  requestSubject: string;
  defaultBudgetGnf: number;
  budgetType: string;
  teacherSuggestedRate?: number | null;
  onSuccess?: () => void;
}

export function TeacherApplicationForm({
  requestId,
  requestSubject,
  defaultBudgetGnf,
  budgetType,
  teacherSuggestedRate,
  onSuccess,
}: TeacherApplicationFormProps) {
  const { locale } = useTranslation();
  const router = useRouter();

  // Initial proposed rate: use parent declared budget or teacher default rate
  const initialRate = teacherSuggestedRate || defaultBudgetGnf || 800000;

  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedRateGnf, setProposedRateGnf] = useState<number>(initialRate);
  const [proposedRateType, setProposedRateType] = useState<"MONTHLY" | "HOURLY">(
    budgetType === "HOURLY" ? "HOURLY" : "MONTHLY"
  );
  const [sessionArrangement, setSessionArrangement] = useState(
    "2 séances de 2h par semaine (8 séances par mois)"
  );
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Financial preview calculation (Platform commission: 15%, Teacher net: 85%)
  const rateNumber = proposedRateGnf || 0;
  const platformCommission = Math.round(rateNumber * 0.15);
  const teacherNetEarnings = Math.max(0, rateNumber - platformCommission);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (pitchMessage.trim().length < 20) {
      setError(
        locale === "en"
          ? "Please provide a detailed motivation message (at least 20 characters)."
          : "Veuillez rédiger une note de motivation détaillée (au moins 20 caractères) pour le parent."
      );
      return;
    }

    if (!proposedRateGnf || proposedRateGnf <= 0) {
      setError(
        locale === "en"
          ? "Please specify a valid proposed rate in GNF."
          : "Veuillez renseigner un tarif proposé valide en Francs Guinéens (GNF)."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/teacher/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          pitchMessage: pitchMessage.trim(),
          proposedRateGnf,
          proposedRateType,
          sessionArrangement: sessionArrangement.trim(),
          availabilityNotes: availabilityNotes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (locale === "en"
              ? "Failed to submit application."
              : "Erreur lors de la transmission de votre candidature.")
        );
      }

      setSuccessMessage(
        locale === "en"
          ? "Your application has been successfully submitted to the parent!"
          : "Votre candidature a été transmise avec succès au parent d'élève !"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Motivation Note */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">
          {locale === "en" ? "Pedagogical Message & Pitch" : "Note de motivation pédagogique"} *
        </label>
        <p className="text-[11px] text-slate-500">
          {locale === "en"
            ? "Introduce your approach, experience with this curriculum, and how you will help the student succeed."
            : "Présentez votre démarche, votre expérience sur ce programme et la manière dont vous accompagnerez l'élève."}
        </p>
        <textarea
          rows={4}
          required
          value={pitchMessage}
          onChange={(e) => setPitchMessage(e.target.value)}
          placeholder={
            locale === "en"
              ? "Bonjour, titulaire d'un master en enseignement, j'accompagne régulièrement des élèves de ce niveau avec une méthode axée sur la pratique..."
              : "Bonjour, j'ai accompagné de nombreux élèves avec d'excellents résultats dans cette matière. Ma méthodologie repose sur le diagnostic des blocages et la pratique régulière..."
          }
          className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c] text-slate-800"
        />
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>{locale === "en" ? "Minimum 20 characters" : "Minimum 20 caractères"}</span>
          <span className={pitchMessage.length < 20 ? "text-amber-600 font-semibold" : "text-slate-500"}>
            {pitchMessage.length} / 20
          </span>
        </div>
      </div>

      {/* Proposed Rate & Frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rate Amount */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            {locale === "en" ? "Proposed Rate (GNF)" : "Tarif proposé (GNF)"} *
          </label>
          <div className="relative">
            <input
              type="number"
              step="5000"
              min="10000"
              required
              value={proposedRateGnf || ""}
              onChange={(e) => setProposedRateGnf(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c] text-slate-800 font-semibold"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              GNF
            </span>
          </div>
        </div>

        {/* Rate Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800">
            {locale === "en" ? "Rate Type" : "Type de tarif"}
          </label>
          <select
            value={proposedRateType}
            onChange={(e) => setProposedRateType(e.target.value as "MONTHLY" | "HOURLY")}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c]"
          >
            <option value="MONTHLY">{locale === "en" ? "Monthly Package" : "Forfait Mensuel"}</option>
            <option value="HOURLY">{locale === "en" ? "Hourly Rate" : "Tarif Horaire"}</option>
          </select>
        </div>
      </div>

      {/* Financial Split Breakdown */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
          <Info className="w-3.5 h-3.5 text-[#16385c]" />
          <span>{locale === "en" ? "Revenue Transparency (SRD V2.0)" : "Transparence des revenus (SRD V2.0)"}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200/60">
          <div>
            <span className="block text-[10px] text-slate-400 font-medium">
              {locale === "en" ? "Parent Total" : "Montant parent"}
            </span>
            <span className="text-xs font-bold text-slate-800">{formatGnf(rateNumber)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-medium">
              {locale === "en" ? "Platform (15%)" : "Fanyi (15%)"}
            </span>
            <span className="text-xs font-medium text-slate-500">-{formatGnf(platformCommission)}</span>
          </div>
          <div>
            <span className="block text-[10px] text-[#16385c] font-semibold">
              {locale === "en" ? "Your Net (85%)" : "Votre net (85%)"}
            </span>
            <span className="text-xs font-extrabold text-emerald-700">{formatGnf(teacherNetEarnings)}</span>
          </div>
        </div>
      </div>

      {/* Session Arrangement */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">
          {locale === "en" ? "Proposed Session Arrangement" : "Organisation des séances proposée"}
        </label>
        <input
          type="text"
          value={sessionArrangement}
          onChange={(e) => setSessionArrangement(e.target.value)}
          placeholder={locale === "en" ? "e.g. 2 sessions of 2h per week" : "ex: 2 séances de 2h par semaine"}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c] text-slate-800"
        />
      </div>

      {/* Availability Notes */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800">
          {locale === "en" ? "Availability Notes (Optional)" : "Créneaux horaires disponibles (Optionnel)"}
        </label>
        <input
          type="text"
          value={availabilityNotes}
          onChange={(e) => setAvailabilityNotes(e.target.value)}
          placeholder={locale === "en" ? "e.g. Wednesday afternoons and Saturday mornings" : "ex: Mercredi après-midi et Samedi matin"}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c] text-slate-800"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !!successMessage}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold bg-[#16385c] hover:bg-[#10243d] text-white transition-all shadow-xs disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{locale === "en" ? "Submitting Application..." : "Envoi en cours..."}</span>
            </>
          ) : successMessage ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{locale === "en" ? "Application Submitted" : "Candidature transmise"}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{locale === "en" ? "Submit Application to Parent" : "Transmettre ma candidature"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

