"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Gavel,
  HelpCircle,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface AdminResolveDisputeModalProps {
  dispute: {
    id: string;
    category?: string | null;
    reason: string;
    teacherResponse?: string | null;
    createdAt: string | Date;
    session: {
      id: string;
      scheduledStart: string | Date;
      durationMinutes: number;
      actualDurationMinutes?: number | null;
      attendanceStatus: string;
      classroom: {
        subjectName: string;
        student: {
          fullName: string;
          parent: {
            user: { fullName: string; phoneNumber?: string | null; email: string };
          };
        };
        teacherProfile: {
          user: { fullName: string; phoneNumber?: string | null; email: string };
        };
      };
      report?: {
        topicsCovered: string;
        learningObjectives?: string | null;
        strengths?: string | null;
        areasForImprovement?: string | null;
      } | null;
    };
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminResolveDisputeModal({
  dispute,
  onClose,
  onSuccess,
}: AdminResolveDisputeModalProps) {
  const { t, locale } = useTranslation();

  const [resolutionType, setResolutionType] = useState<
    "RESOLVED_VALIDATED" | "RESOLVED_REFUNDED" | "RESOLVED_RESCHEDULED"
  >("RESOLVED_VALIDATED");
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(dispute.session.scheduledStart).toLocaleDateString(
    locale === "en" ? "en-GB" : "fr-GN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminNote.trim() || adminNote.trim().length < 5) {
      setError(
        locale === "en"
          ? "Please enter an administrative note explaining the decision (min 5 characters)."
          : "Veuillez saisir une note administrative motivée (au moins 5 caractères)."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/session-disputes/${dispute.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionType, adminNote: adminNote.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'enregistrer la décision arbitrale.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la résolution");
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
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs text-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-blue-700 font-bold mb-1">
              <Gavel className="w-4 h-4 text-blue-600" />
              <span>{locale === "en" ? "Administrative Arbitration" : "Arbitrage Administratif du Litige"}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base font-heading">
              {dispute.session.classroom.subjectName} • Élève : {dispute.session.classroom.student.fullName}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Séance du <span className="capitalize">{formattedDate}</span>
            </p>
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

        {/* Parties involved */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {locale === "en" ? "Parent (Complainant)" : "Famille (Plaignant)"}
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {dispute.session.classroom.student.parent.user.fullName}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {dispute.session.classroom.student.parent.user.phoneNumber || dispute.session.classroom.student.parent.user.email}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {locale === "en" ? "Teacher" : "Enseignant assigné"}
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {dispute.session.classroom.teacherProfile.user.fullName}
            </span>
            <span className="text-[11px] text-slate-500 block">
              {dispute.session.classroom.teacherProfile.user.phoneNumber || dispute.session.classroom.teacherProfile.user.email}
            </span>
          </div>
        </div>

        {/* Evidence Panel */}
        <div className="space-y-3">
          {/* Parent Complaint */}
          <div className="p-3.5 bg-rose-50/80 rounded-xl border border-rose-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                {locale === "en" ? "Parent complaint" : "Motif de réclamation"} ({dispute.category || "Général"})
              </span>
              <span className="text-[10px] text-rose-600">
                {new Date(dispute.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-GN")}
              </span>
            </div>
            <p className="text-xs text-rose-950 italic bg-white/70 p-2.5 rounded-lg border border-rose-200/50 leading-relaxed">
              « {dispute.reason} »
            </p>
          </div>

          {/* Teacher Response */}
          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              {locale === "en" ? "Teacher explanation" : "Explication de l'enseignant"}
            </span>
            {dispute.teacherResponse ? (
              <p className="text-xs text-amber-950 italic bg-white/80 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                « {dispute.teacherResponse} »
              </p>
            ) : (
              <p className="text-xs text-amber-700 italic">
                {locale === "en"
                  ? "No response submitted yet by the teacher."
                  : "Aucune réponse déposée par l'enseignant à ce jour."}
              </p>
            )}
          </div>

          {/* Lesson Report Summary */}
          {dispute.session.report && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                {locale === "en" ? "Report summary" : "Synthèse du compte rendu déposé"}
              </span>
              <p className="text-xs text-slate-700">
                <span className="font-semibold">Sujets :</span> {dispute.session.report.topicsCovered}
              </p>
              {dispute.session.report.learningObjectives && (
                <p className="text-xs text-slate-700">
                  <span className="font-semibold">Objectifs :</span> {dispute.session.report.learningObjectives}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Resolution Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-2">
              {locale === "en" ? "Arbitration Decision *" : "Décision d'arbitrage *"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                  resolutionType === "RESOLVED_VALIDATED"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="resolutionType"
                    checked={resolutionType === "RESOLVED_VALIDATED"}
                    onChange={() => setResolutionType("RESOLVED_VALIDATED")}
                    className="text-emerald-600"
                  />
                  <span>{locale === "en" ? "Validate Session" : "Valider la séance"}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500">
                  {locale === "en" ? "Dismiss dispute, lesson confirmed as delivered." : "Rejet de la réclamation, séance acquise."}
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                  resolutionType === "RESOLVED_RESCHEDULED"
                    ? "bg-blue-50 border-blue-400 text-blue-950 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="resolutionType"
                    checked={resolutionType === "RESOLVED_RESCHEDULED"}
                    onChange={() => setResolutionType("RESOLVED_RESCHEDULED")}
                    className="text-blue-600"
                  />
                  <span>{locale === "en" ? "Reschedule" : "Reprogrammer"}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500">
                  {locale === "en" ? "Session to be replanned without penalty." : "Séance à replanifier à une date ultérieure."}
                </span>
              </label>

              <label
                className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col justify-between transition-all ${
                  resolutionType === "RESOLVED_REFUNDED"
                    ? "bg-rose-50 border-rose-400 text-rose-950 font-bold shadow-xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="resolutionType"
                    checked={resolutionType === "RESOLVED_REFUNDED"}
                    onChange={() => setResolutionType("RESOLVED_REFUNDED")}
                    className="text-rose-600"
                  />
                  <span>{locale === "en" ? "Cancel / Refund" : "Annulation"}</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500">
                  {locale === "en" ? "Lesson not held, mark for credit/refund." : "Séance non exécutée, libération des fonds."}
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              {locale === "en" ? "Administrative reasoning & notes *" : "Motivation et instructions administratives *"}
            </label>
            <textarea
              rows={3}
              required
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                locale === "en"
                  ? "Explain the decision clearly. Both the family and the tutor will receive this notice..."
                  : "Expliquez clairement les motifs de votre décision arbitrale. La famille et l'enseignant en recevront notification..."
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Cancel" : "Fermer"}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {loading
                ? locale === "en" ? "Resolving..." : "Enregistrement..."
                : locale === "en" ? "Confirm Arbitration" : "Entériner la décision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

