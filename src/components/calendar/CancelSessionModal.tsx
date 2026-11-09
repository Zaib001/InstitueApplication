"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, X, XCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { CalendarSessionItem } from "./SessionDetailModal";

interface CancelSessionModalProps {
  session: CalendarSessionItem;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function CancelSessionModal({
  session,
  onClose,
  onSuccess,
}: CancelSessionModalProps) {
  const { locale } = useTranslation();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 5) {
      setError(
        locale === "en"
          ? "Please provide an explicit cancellation reason (min. 5 chars)."
          : "Veuillez renseigner un motif explicite d'au moins 5 caractères."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/calendar/sessions/${session.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'annulation");
      }

      onSuccess(data.session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-700">
            <XCircle className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              {locale === "en" ? "Cancel Session" : "Annulation de séance"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
          Séance #{session.sessionSequence} de <strong>{session.classroom.subjectName}</strong> avec{" "}
          <strong>{session.classroom.student.fullName}</strong>.
          <p className="mt-1 text-[11px] text-slate-400">
            L&apos;annulation est enregistrée dans l&apos;historique officiel de la classe et notifie l&apos;autre partie.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "Reason for Cancellation" : "Motif de l'annulation (obligatoire)"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                locale === "en"
                  ? "e.g. Unforeseen student travel, illness, or mutual agreement..."
                  : "ex: Déplacement imprévu de la famille, empêchement médical ou accord mutuel..."
              }
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-hidden text-xs"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              {locale === "en" ? "Keep Session" : "Garder la séance"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold bg-rose-600 hover:bg-rose-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === "en" ? "Cancelling..." : "Annulation..."}</span>
                </>
              ) : (
                <span>{locale === "en" ? "Confirm Cancellation" : "Confirmer l'annulation"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

