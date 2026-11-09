"use client";

import React, { useState } from "react";
import { X, Sparkles, Star, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ClassroomOption {
  id: string;
  subjectName: string;
}

interface CreateObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classrooms: ClassroomOption[];
  onSuccess: () => void;
}

export function CreateObservationModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  classrooms,
  onSuccess,
}: CreateObservationModalProps) {
  const { t } = useTranslation();
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || "");
  const [topicsMastered, setTopicsMastered] = useState("");
  const [strengths, setStrengths] = useState("");
  const [areasForImprovement, setAreasForImprovement] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [progressRating, setProgressRating] = useState<number>(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!classroomId) {
      setError("Veuillez sélectionner une matière / classe.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/observations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          topicsMastered: topicsMastered.trim() || null,
          strengths: strengths.trim() || null,
          areasForImprovement: areasForImprovement.trim() || null,
          recommendations: recommendations.trim() || null,
          progressRating,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement du bilan.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-observation-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-observation-title" className="text-lg font-bold text-slate-900">
                {t("progressBook.observations.newObservationBtn", "Bilan de progression")}
              </h2>
              <p className="text-xs text-slate-500">Pour {studentName}</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {classrooms.length > 1 ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Matière
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.subjectName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matière :</span>
              <span className="ml-2 text-sm font-medium text-slate-800">
                {classrooms[0]?.subjectName || "Général"}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.observations.rating", "Appréciation globale")}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setProgressRating(star)}
                  className={`p-1.5 transition rounded-lg ${
                    star <= progressRating ? "text-amber-400 hover:text-amber-500" : "text-slate-200 hover:text-slate-300"
                  }`}
                  aria-label={`${star} étoiles`}
                >
                  <Star className="h-7 w-7 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-slate-600">
                {progressRating} / 5 étoiles
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.observations.topicsMastered", "Notions bien assimilées")}
            </label>
            <textarea
              rows={2}
              value={topicsMastered}
              onChange={(e) => setTopicsMastered(e.target.value)}
              placeholder="Ex: Règles de priorité de calcul, identification des figures géométriques..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.observations.strengths", "Points forts observés")}
            </label>
            <textarea
              rows={2}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              placeholder="Ex: Grande curiosité, mémoire visuelle, régularité dans le travail..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.observations.areasForImprovement", "Axes de travail et difficultés")}
            </label>
            <textarea
              rows={2}
              value={areasForImprovement}
              onChange={(e) => setAreasForImprovement(e.target.value)}
              placeholder="Ex: Revoir les tables de multiplication, structurer la rédaction des réponses..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("progressBook.observations.recommendations", "Conseils pour la famille et l'élève")}
            </label>
            <textarea
              rows={2}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              placeholder="Ex: Encourager 15 minutes de révision quotidienne avant le coucher..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("progressBook.observations.newObservationBtn", "Enregistrer le bilan")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

