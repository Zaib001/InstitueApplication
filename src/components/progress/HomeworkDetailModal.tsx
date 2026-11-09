"use client";

import React, { useState } from "react";
import { X, BookOpen, Calendar, CheckCircle2, Clock, Send, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface HomeworkItem {
  id: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string | null;
  status: "ASSIGNED" | "IN_PROGRESS" | "SUBMITTED" | "REVIEWED" | "COMPLETED";
  studentSubmission?: string | null;
  teacherFeedback?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
}

interface HomeworkDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  homework: HomeworkItem | null;
  actorRole: "PARENT" | "TEACHER" | "ADMIN";
  onSuccess: () => void;
}

export function HomeworkDetailModal({
  isOpen,
  onClose,
  homework,
  actorRole,
  onSuccess,
}: HomeworkDetailModalProps) {
  const { t } = useTranslation();
  const [submission, setSubmission] = useState(homework?.studentSubmission || "");
  const [feedback, setFeedback] = useState(homework?.teacherFeedback || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (homework) {
      setSubmission(homework.studentSubmission || "");
      setFeedback(homework.teacherFeedback || "");
      setError(null);
    }
  }, [homework]);

  if (!isOpen || !homework) return null;

  const handleUpdateStatus = async (newStatus: HomeworkItem["status"]) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/homework/${homework.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          studentSubmission: submission.trim() || null,
          teacherFeedback: feedback.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour du devoir.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: HomeworkItem["status"]) => {
    switch (status) {
      case "ASSIGNED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Assigné</span>;
      case "IN_PROGRESS":
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">En cours</span>;
      case "SUBMITTED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">Rendu</span>;
      case "REVIEWED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">Corrigé</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Terminé & Validé</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="homework-detail-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                  {homework.subjectName}
                </span>
                {getStatusBadge(homework.status)}
              </div>
              <h2 id="homework-detail-title" className="text-base font-bold text-slate-900 mt-1">
                {homework.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Consignes du devoir
            </h4>
            <div className="mt-1 rounded-xl bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap">
              {homework.description}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-y border-slate-100 py-2.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>
                {homework.dueDate
                  ? `Échéance : ${new Date(homework.dueDate).toLocaleDateString("fr-FR")}`
                  : "Sans date limite"}
              </span>
            </div>
            <div>Professeur : {homework.teacherName}</div>
          </div>

          {/* Student submission section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.homework.submissionText", "Travail rendu ou remarques de l'élève")}
            </h4>
            {actorRole === "PARENT" && homework.status !== "COMPLETED" ? (
              <textarea
                rows={3}
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                placeholder="Renseignez les réponses, un lien ou des précisions sur le travail effectué..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            ) : (
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap italic">
                {homework.studentSubmission || "Aucun travail textuel soumis."}
              </div>
            )}
          </div>

          {/* Teacher feedback section */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.homework.teacherFeedback", "Commentaires & correction de l'enseignant")}
            </h4>
            {actorRole === "TEACHER" ? (
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Appréciation, conseils d'amélioration ou corrections apportées..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
            ) : (
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3 text-sm text-slate-800 whitespace-pre-wrap">
                {homework.teacherFeedback || "En attente de correction par le professeur."}
              </div>
            )}
          </div>

          {/* Action buttons depending on role */}
          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Fermer
            </button>

            {actorRole === "PARENT" && homework.status !== "COMPLETED" && (
              <>
                {homework.status === "ASSIGNED" && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition"
                  >
                    Marquer en cours
                  </button>
                )}
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdateStatus("SUBMITTED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Send className="h-4 w-4" />
                  {t("progressBook.homework.submitWork", "Rendre le travail")}
                </button>
              </>
            )}

            {actorRole === "TEACHER" && (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="h-4 w-4" />
                  {t("progressBook.homework.reviewWork", "Valider la correction")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

