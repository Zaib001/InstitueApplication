"use client";

import React, { useState } from "react";
import { X, Award, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ClassroomOption {
  id: string;
  subjectName: string;
}

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classrooms: ClassroomOption[];
  onSuccess: () => void;
}

export function CreateAssessmentModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  classrooms,
  onSuccess,
}: CreateAssessmentModalProps) {
  const { t } = useTranslation();
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || "");
  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("TOPIC_TEST");
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [obtainedScore, setObtainedScore] = useState<string>("15");
  const [maxScore, setMaxScore] = useState<string>("20");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [teacherComments, setTeacherComments] = useState("");
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
    if (!title.trim() || title.trim().length < 3) {
      setError("Le titre de l'évaluation doit comporter au moins 3 caractères.");
      return;
    }

    const scoreNum = parseFloat(obtainedScore);
    const maxNum = parseFloat(maxScore);

    if (isNaN(scoreNum) || isNaN(maxNum)) {
      setError("Veuillez renseigner des notes valides.");
      return;
    }

    if (maxNum <= 0) {
      setError("Le barème maximum doit être strictement supérieur à zéro.");
      return;
    }

    if (scoreNum < 0) {
      setError("La note obtenue ne peut pas être négative.");
      return;
    }

    if (scoreNum > maxNum) {
      setError(`La note obtenue (${scoreNum}) ne peut pas dépasser le barème maximum (${maxNum}).`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId,
          title: title.trim(),
          assessmentType,
          assessmentDate: assessmentDate ? new Date(assessmentDate).toISOString() : new Date().toISOString(),
          obtainedScore: scoreNum,
          maxScore: maxNum,
          learningObjectives: learningObjectives.trim() || null,
          teacherComments: teacherComments.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement de l'évaluation.");
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
      aria-labelledby="create-assessment-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 id="create-assessment-title" className="text-lg font-bold text-slate-900">
                {t("progressBook.assessments.newAssessmentBtn", "Enregistrer une évaluation")}
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Type de contrôle *
              </label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="DIAGNOSTIC">{t("progressBook.assessments.diagnostic", "Évaluation diagnostique")}</option>
                <option value="WEEKLY_QUIZ">{t("progressBook.assessments.weeklyQuiz", "Interrogation hebdomadaire")}</option>
                <option value="TOPIC_TEST">{t("progressBook.assessments.topicTest", "Contrôle de chapitre")}</option>
                <option value="MONTHLY_EXAM">{t("progressBook.assessments.monthlyExam", "Contrôle mensuel")}</option>
                <option value="PRACTICE_EXAM">{t("progressBook.assessments.practiceExam", "Examen blanc")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date de l'évaluation *
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
                <Calendar className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Titre ou Intitulé du contrôle *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Devoir surveillé #2 - Équations et fractions"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("progressBook.assessments.scoreLabel", "Note obtenue")} *
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                required
                value={obtainedScore}
                onChange={(e) => setObtainedScore(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Barème max (/ 20) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Notions et compétences évaluées
            </label>
            <input
              type="text"
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder="Ex: Résolution de systèmes linéaires, factorisation"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Commentaires et appréciations pédagogiques
            </label>
            <textarea
              rows={3}
              value={teacherComments}
              onChange={(e) => setTeacherComments(e.target.value)}
              placeholder="Ex: Très bonne rigueur de rédaction, veiller à vérifier les calculs d'intermédiaires..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none"
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
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("progressBook.assessments.newAssessmentBtn", "Enregistrer la note")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

