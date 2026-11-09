"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  HelpCircle,
  Save,
  Send,
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";
import { LessonAttendance, ReportStatus } from "@prisma/client";
import { useTranslation } from "@/lib/i18n";

export interface LessonReportModalProps {
  session: {
    id: string;
    classroomId: string;
    subjectName?: string;
    studentName?: string;
    scheduledStart: string | Date;
    scheduledEnd: string | Date;
    durationMinutes: number;
    actualDurationMinutes?: number | null;
    attendanceStatus: LessonAttendance;
    report?: {
      id: string;
      status: ReportStatus;
      topicsCovered: string;
      learningObjectives?: string | null;
      studentEffort?: string | null;
      teacherNotes?: string | null;
      strengths?: string | null;
      areasForImprovement?: string | null;
      homeworkGiven?: string | null;
      homeworkDueDate?: string | Date | null;
      nextLessonRecommendations?: string | null;
      assessmentTitle?: string | null;
      assessmentScore?: number | null;
      assessmentMaxScore?: number | null;
      assessmentComment?: string | null;
      progressRating?: number | null;
    } | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function LessonReportModal({
  session,
  onClose,
  onSuccess,
}: LessonReportModalProps) {
  const { t, locale } = useTranslation();

  const r = session.report;

  const [topicsCovered, setTopicsCovered] = useState(r?.topicsCovered || "");
  const [learningObjectives, setLearningObjectives] = useState(r?.learningObjectives || "");
  const [studentEffort, setStudentEffort] = useState(r?.studentEffort || "Bonne participation");
  const [teacherNotes, setTeacherNotes] = useState(r?.teacherNotes || "");
  const [strengths, setStrengths] = useState(r?.strengths || "");
  const [areasForImprovement, setAreasForImprovement] = useState(r?.areasForImprovement || "");
  const [homeworkGiven, setHomeworkGiven] = useState(r?.homeworkGiven || "");
  const [homeworkDueDate, setHomeworkDueDate] = useState<string>(
    r?.homeworkDueDate
      ? new Date(r.homeworkDueDate).toISOString().split("T")[0]
      : ""
  );
  const [nextLessonRecommendations, setNextLessonRecommendations] = useState(r?.nextLessonRecommendations || "");
  const [assessmentTitle, setAssessmentTitle] = useState(r?.assessmentTitle || "");
  const [assessmentScore, setAssessmentScore] = useState<string>(
    r?.assessmentScore !== undefined && r?.assessmentScore !== null ? String(r.assessmentScore) : ""
  );
  const [assessmentMaxScore, setAssessmentMaxScore] = useState<string>(
    r?.assessmentMaxScore !== undefined && r?.assessmentMaxScore !== null ? String(r.assessmentMaxScore) : "20"
  );
  const [assessmentComment, setAssessmentComment] = useState(r?.assessmentComment || "");
  const [progressRating, setProgressRating] = useState<number>(r?.progressRating || 4);

  const [attendanceStatus, setAttendanceStatus] = useState<LessonAttendance>(session.attendanceStatus || "PRESENT");
  const [actualDurationMinutes, setActualDurationMinutes] = useState<number>(
    session.actualDurationMinutes || session.durationMinutes || 60
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = new Date(session.scheduledStart).toLocaleDateString(
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

  const handleSubmit = async (action: "draft" | "submit") => {
    setError(null);
    setLoading(true);

    try {
      if (action === "submit") {
        if (!topicsCovered.trim() || topicsCovered.trim().length < 5) {
          setError(
            locale === "en"
              ? "Please describe the topics covered (min 5 characters)."
              : "Veuillez renseigner les sujets abordés lors de la séance (au moins 5 caractères)."
          );
          setLoading(false);
          return;
        }
        if (!learningObjectives.trim() || learningObjectives.trim().length < 5) {
          setError(
            locale === "en"
              ? "Please specify the learning objectives (min 5 characters)."
              : "Veuillez préciser les objectifs pédagogiques visés (au moins 5 caractères)."
          );
          setLoading(false);
          return;
        }
        if (!strengths.trim() || strengths.trim().length < 5) {
          setError(
            locale === "en"
              ? "Please indicate the student's observed strengths (min 5 characters)."
              : "Veuillez noter les points forts constatés de l'élève (au moins 5 caractères)."
          );
          setLoading(false);
          return;
        }
        if (!areasForImprovement.trim() || areasForImprovement.trim().length < 5) {
          setError(
            locale === "en"
              ? "Please note the difficulties or areas for improvement (min 5 characters)."
              : "Veuillez indiquer les axes de progrès ou difficultés rencontrées (au moins 5 caractères)."
          );
          setLoading(false);
          return;
        }
      }

      const payload = {
        action,
        topicsCovered,
        learningObjectives,
        studentEffort,
        teacherNotes,
        strengths,
        areasForImprovement,
        homeworkGiven: homeworkGiven.trim() || null,
        homeworkDueDate: homeworkDueDate || null,
        nextLessonRecommendations: nextLessonRecommendations.trim() || null,
        assessmentTitle: assessmentTitle.trim() || null,
        assessmentScore: assessmentScore ? parseFloat(assessmentScore) : null,
        assessmentMaxScore: assessmentMaxScore ? parseFloat(assessmentMaxScore) : null,
        assessmentComment: assessmentComment.trim() || null,
        progressRating,
        attendanceStatus,
        actualDurationMinutes: Number(actualDurationMinutes) || session.durationMinutes,
      };

      const res = await fetch(`/api/teacher/sessions/${session.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue.");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement.");
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
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5 text-xs text-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {locale === "en" ? "Lesson Report" : "Compte rendu de séance"}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                {session.subjectName || "Matière"}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight font-heading">
              {locale === "en" ? "Structured Academic Report" : "Compte rendu pédagogique structuré"}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-2">
              <span>{session.studentName ? `Élève : ${session.studentName}` : ""}</span>
              <span>•</span>
              <span className="capitalize">{formattedDate}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Attendance & Duration */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{locale === "en" ? "Attendance & Duration" : "Présence & Durée effective"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {locale === "en" ? "Attendance Status" : "Statut d'assiduité"}
              </label>
              <select
                value={attendanceStatus}
                onChange={(e) => setAttendanceStatus(e.target.value as LessonAttendance)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              >
                <option value="PRESENT">{locale === "en" ? "Present" : "Présent"}</option>
                <option value="LATE">{locale === "en" ? "Late arrival" : "En retard"}</option>
                <option value="EXCUSED">{locale === "en" ? "Excused absence" : "Absence excusée"}</option>
                <option value="ABSENT_STUDENT">{locale === "en" ? "Student absent" : "Élève absent non excusé"}</option>
                <option value="ABSENT_TEACHER">{locale === "en" ? "Teacher absent" : "Professeur absent"}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                {locale === "en" ? "Actual Duration (minutes)" : "Durée effective (minutes)"}
              </label>
              <input
                type="number"
                min={15}
                max={480}
                step={15}
                value={actualDurationMinutes}
                onChange={(e) => setActualDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Educational Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>{locale === "en" ? "Pedagogical Content" : "Contenu Pédagogique"}</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locale === "en" ? "Topics covered *" : "Sujets abordés *"}
            </label>
            <textarea
              rows={2}
              value={topicsCovered}
              onChange={(e) => setTopicsCovered(e.target.value)}
              placeholder={locale === "en" ? "e.g. Linear equations, word problems and practice exercises" : "Ex: Équations du premier degré, résolution de problèmes appliqués et exercices types..."}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locale === "en" ? "Learning objectives addressed *" : "Objectifs pédagogiques visés *"}
            </label>
            <textarea
              rows={2}
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              placeholder={locale === "en" ? "e.g. Master variable isolation and check solutions systematically" : "Ex: Maîtriser l'isolation de l'inconnue et vérifier la solution par substitution..."}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locale === "en" ? "Student effort / participation *" : "Participation de l'élève *"}
            </label>
            <select
              value={studentEffort}
              onChange={(e) => setStudentEffort(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
            >
              <option value="Très investi et enthousiaste">{locale === "en" ? "Highly engaged & enthusiastic" : "Très investi et enthousiaste"}</option>
              <option value="Bonne participation">{locale === "en" ? "Good active participation" : "Bonne participation"}</option>
              <option value="Participation modérée">{locale === "en" ? "Moderate participation" : "Participation modérée"}</option>
              <option value="Difficultés de concentration">{locale === "en" ? "Focus / attention difficulties" : "Difficultés de concentration"}</option>
              <option value="Passif ou réticent">{locale === "en" ? "Passive or reluctant" : "Passif ou réticent"}</option>
            </select>
          </div>
        </div>

        {/* Section 3: Diagnostic & Observations */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{locale === "en" ? "Observations & Strengths" : "Observations & Diagnostic"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                {locale === "en" ? "Observed strengths *" : "Points forts constatés *"}
              </label>
              <textarea
                rows={2}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder={locale === "en" ? "e.g. Quick grasp of formula, good mental arithmetic" : "Ex: Excellente intuition géométrique, calcul mental rapide..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                {locale === "en" ? "Areas for improvement *" : "Difficultés rencontrées / Axes de progrès *"}
              </label>
              <textarea
                rows={2}
                value={areasForImprovement}
                onChange={(e) => setAreasForImprovement(e.target.value)}
                placeholder={locale === "en" ? "e.g. Signs management with brackets, careful drafting" : "Ex: Gestion des signes négatifs, rigueur de rédaction des étapes..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Teacher general notes (Optional)" : "Observations du professeur (Optionnel)"}
              </label>
              <textarea
                rows={2}
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder={locale === "en" ? "General remarks for the family..." : "Remarques générales partagées avec la famille..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Next lesson recommendations" : "Recommandations pour la séance suivante"}
              </label>
              <textarea
                rows={2}
                value={nextLessonRecommendations}
                onChange={(e) => setNextLessonRecommendations(e.target.value)}
                placeholder={locale === "en" ? "e.g. Review chapter 3 theorems before Friday" : "Ex: Relire le formulaire du chapitre 3 avant le cours de vendredi..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Homework */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>{locale === "en" ? "Homework & Assignments" : "Devoirs & Exercices"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Homework description (Optional)" : "Devoirs à faire (Optionnel)"}
              </label>
              <textarea
                rows={2}
                value={homeworkGiven}
                onChange={(e) => setHomeworkGiven(e.target.value)}
                placeholder={locale === "en" ? "e.g. Exercises 12, 14, 15 page 42" : "Ex: Exercices 12, 14 et 15 page 42 du manuel..."}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Due date" : "Date d'échéance"}
              </label>
              <input
                type="date"
                value={homeworkDueDate}
                onChange={(e) => setHomeworkDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Assessment & Score (Optional) */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-purple-600" />
            <span>{locale === "en" ? "Evaluation / Score (Optional)" : "Évaluation / Note (Optionnel)"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Assessment title" : "Titre de l'évaluation"}
              </label>
              <input
                type="text"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
                placeholder={locale === "en" ? "e.g. Quiz on equations" : "Ex: Interrogation sur les équations"}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {locale === "en" ? "Score" : "Note obtenue"}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={assessmentScore}
                  onChange={(e) => setAssessmentScore(e.target.value)}
                  placeholder="16"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
                />
              </div>
              <span className="text-slate-400 mt-5 font-bold">/</span>
              <div className="w-20">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {locale === "en" ? "Max" : "Sur"}
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={assessmentMaxScore}
                  onChange={(e) => setAssessmentMaxScore(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Global performance" : "Évaluation globale"}
              </label>
              <div className="flex items-center gap-1 mt-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setProgressRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        progressRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {locale === "en"
                ? "Once submitted, this report is transmitted to the parent for session validation."
                : "Une fois soumis, ce rapport est transmis aux parents pour validation formelle de la séance."}
            </span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit("draft")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>{locale === "en" ? "Save Draft" : "Enregistrer brouillon"}</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit("submit")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>
                {loading
                  ? locale === "en"
                    ? "Submitting..."
                    : "Soumission..."
                  : locale === "en"
                  ? "Submit for Parent Review"
                  : "Soumettre pour validation"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

