"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface TeacherDisputeResponseModalProps {
  sessionId: string;
  subjectName?: string;
  dispute: {
    category?: string | null;
    reason: string;
    teacherResponse?: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function TeacherDisputeResponseModal({
  sessionId,
  subjectName,
  dispute,
  onClose,
  onSuccess,
}: TeacherDisputeResponseModalProps) {
  const { t, locale } = useTranslation();

  const [teacherResponse, setTeacherResponse] = useState(dispute.teacherResponse || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!teacherResponse.trim() || teacherResponse.trim().length < 5) {
      setError(
        locale === "en"
          ? "Please provide an explanation with at least 5 characters."
          : "Veuillez fournir une explication d'au moins 5 caractères."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/sessions/${sessionId}/dispute-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherResponse: teacherResponse.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer votre réponse.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de transmission");
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
            <div className="flex items-center gap-1.5 text-amber-700 font-bold mb-1">
              <MessageSquare className="w-4 h-4 text-amber-600" />
              <span>{locale === "en" ? "Respond to Dispute" : "Répondre au litige de séance"}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base font-heading">
              {subjectName ? `Séance de ${subjectName}` : "Explication de l'enseignant"}
            </h3>
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

        {/* Parent's Complaint */}
        <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 space-y-1.5">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
            {locale === "en" ? "Parent's complaint" : "Réclamation formulée par le parent"} ({dispute.category || "Général"})
          </span>
          <p className="text-xs text-rose-950 italic bg-white/80 p-2.5 rounded-lg border border-rose-200/60 leading-relaxed">
            « {dispute.reason} »
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              {locale === "en" ? "Your response / explanation *" : "Votre réponse & explications pour l'administration *"}
            </label>
            <textarea
              rows={4}
              required
              value={teacherResponse}
              onChange={(e) => setTeacherResponse(e.target.value)}
              placeholder={
                locale === "en"
                  ? "Clarify what happened, provide relevant attendance or teaching notes..."
                  : "Apportez vos précisions sur le déroulement du cours, les créneaux ou l'assiduité constatée..."
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {locale === "en"
                ? "Your response will be reviewed by the administration together with the lesson report to reach an official decision."
                : "Vos explications seront examinées par l'administration conjointement au compte rendu de séance pour trancher le litige."}
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading
                ? locale === "en" ? "Sending..." : "Envoi..."
                : locale === "en" ? "Send Explanation" : "Transmettre ma réponse"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

