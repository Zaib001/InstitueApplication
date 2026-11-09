"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface DisputeSessionModalProps {
  sessionId: string;
  subjectName?: string;
  studentName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeSessionModal({
  sessionId,
  subjectName,
  studentName,
  onClose,
  onSuccess,
}: DisputeSessionModalProps) {
  const { t, locale } = useTranslation();

  const [category, setCategory] = useState("LESSON_NOT_HELD");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim() || reason.trim().length < 10) {
      setError(
        locale === "en"
          ? "Please provide an explanation with at least 10 characters."
          : "Veuillez fournir une explication détaillée d'au moins 10 caractères."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/parent/sessions/${sessionId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer la contestation.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de contestation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs text-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-rose-700 font-bold mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{locale === "en" ? "Contest Lesson Session" : "Contester la séance"}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base font-heading">
              {subjectName ? `Séance de ${subjectName}` : "Réclamation sur la séance"}
            </h3>
            {studentName && (
              <p className="text-slate-400 text-xs mt-0.5">Élève : {studentName}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              {locale === "en" ? "Reason Category *" : "Catégorie du motif *"}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            >
              <option value="LESSON_NOT_HELD">
                {locale === "en" ? "Lesson did not take place" : "Le cours n'a pas eu lieu"}
              </option>
              <option value="INCORRECT_DURATION">
                {locale === "en" ? "Incorrect lesson duration" : "Durée du cours incorrecte"}
              </option>
              <option value="ATTENDANCE_DISAGREEMENT">
                {locale === "en" ? "Attendance disagreement (Absence / Late)" : "Désaccord sur l'assiduité (Absence / Retard)"}
              </option>
              <option value="INCOMPLETE_TEACHING">
                {locale === "en" ? "Incomplete teaching / Program not respected" : "Programme ou enseignement non conforme"}
              </option>
              <option value="INCORRECT_REPORT">
                {locale === "en" ? "Inaccurate or incomplete lesson report" : "Compte rendu inexact ou incomplet"}
              </option>
              <option value="OTHER">
                {locale === "en" ? "Other concern" : "Autre réclamation"}
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              {locale === "en" ? "Detailed explanation *" : "Description détaillée du problème *"}
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                locale === "en"
                  ? "Describe clearly what happened (minimum 10 characters)..."
                  : "Expliquez précisément ce qui motive votre contestation (au moins 10 caractères)..."
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-amber-900 text-[11px] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              {locale === "en"
                ? "Opening a dispute suspends session validation. The teacher and administrator will be notified to review the situation."
                : "L'ouverture d'un litige suspend la validation de la séance. Le professeur et l'administration seront notifiés pour examiner la situation."}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Cancel" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading
                ? locale === "en" ? "Submitting..." : "Enregistrement..."
                : locale === "en" ? "Confirm Dispute" : "Confirmer la contestation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

