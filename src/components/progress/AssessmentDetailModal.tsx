"use client";

import React from "react";
import { X, Award, Calendar, CheckCircle, BookOpen } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface AssessmentItem {
  id: string;
  title: string;
  subjectName: string;
  type: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  learningObjectives?: string | null;
  teacherComments?: string | null;
}

interface AssessmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: AssessmentItem | null;
}

export function AssessmentDetailModal({
  isOpen,
  onClose,
  assessment,
}: AssessmentDetailModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !assessment) return null;

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (percentage >= 50) return "text-blue-700 bg-blue-50 border-blue-200";
    return "text-rose-700 bg-rose-50 border-rose-200";
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "DIAGNOSTIC":
        return t("progressBook.assessments.diagnostic", "Évaluation diagnostique");
      case "WEEKLY_QUIZ":
        return t("progressBook.assessments.weeklyQuiz", "Interrogation hebdomadaire");
      case "MONTHLY_EXAM":
        return t("progressBook.assessments.monthlyExam", "Contrôle mensuel");
      case "TOPIC_TEST":
        return t("progressBook.assessments.topicTest", "Contrôle de chapitre");
      case "PRACTICE_EXAM":
        return t("progressBook.assessments.practiceExam", "Examen blanc");
      default:
        return type;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-detail-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                {assessment.subjectName}
              </span>
              <h2 id="assessment-detail-title" className="text-base font-bold text-slate-900 mt-1">
                {assessment.title}
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

        <div className="mt-4 space-y-4">
          {/* Score display hero */}
          <div className={`flex items-center justify-between rounded-xl border p-4 ${getScoreColor(assessment.percentage)}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider">Note obtenue</p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold">{assessment.score}</span>
                <span className="text-sm font-semibold opacity-75">/ {assessment.maxScore}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block rounded-lg px-2.5 py-1 text-sm font-bold bg-white/80 shadow-xs">
                {assessment.percentage}%
              </span>
              <p className="text-xs mt-1 font-medium opacity-80">
                {assessment.percentage >= 50 ? "Objectif atteint" : "À consolider"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{new Date(assessment.date).toLocaleDateString("fr-FR")}</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-700 font-medium">
              {getTypeName(assessment.type)}
            </span>
          </div>

          {assessment.learningObjectives && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Notions & Compétences évaluées
              </h4>
              <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800">
                {assessment.learningObjectives}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Appréciation de l'enseignant
            </h4>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-800 whitespace-pre-wrap italic">
              {assessment.teacherComments || "Aucun commentaire particulier."}
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

