"use client";

import React, { useState } from "react";
import { X, AlertCircle, Loader2, XCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { RequestCardData } from "./RequestCard";

interface RequestActionDialogProps {
  request: RequestCardData;
  onConfirm: (reason?: string) => Promise<void>;
  onClose: () => void;
}

export function RequestActionDialog({
  request,
  onConfirm,
  onClose,
}: RequestActionDialogProps) {
  const { locale } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim() || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <XCircle className="w-5 h-5" />
            <h3 className="font-extrabold text-sm text-slate-800">
              {locale === "en" ? "Cancel Tutoring Request" : "Annuler la demande de tutorat"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {locale === "en"
            ? `Are you sure you want to cancel the request for ${request.student.fullName} (${request.subjectName})? Qualified tutors will no longer see it.`
            : `Êtes-vous sûr de vouloir annuler la demande pour ${request.student.fullName} (${request.subjectName}) ? Les enseignants qualifiés ne pourront plus y postuler.`}
        </p>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            {locale === "en"
              ? "Reason for cancellation (optional)"
              : "Motif d'annulation (facultatif)"}
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              locale === "en"
                ? "e.g., Tutor found through another source, schedule change..."
                : "ex: Tuteur trouvé par ailleurs, changement de planning familial..."
            }
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {locale === "en" ? "Keep Request" : "Conserver la demande"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            <span>{locale === "en" ? "Confirm Cancel" : "Confirmer l'annulation"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

