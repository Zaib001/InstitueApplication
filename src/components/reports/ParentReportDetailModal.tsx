"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  X,
} from "lucide-react";
import { LessonAttendance, ReportStatus, SessionStatus } from "@prisma/client";
import { useTranslation } from "@/lib/i18n";

export interface ParentReportDetailModalProps {
  session: {
    id: string;
    classroomId: string;
    subjectName?: string;
    studentName?: string;
    teacherName?: string;
    scheduledStart: string | Date;
    scheduledEnd: string | Date;
    durationMinutes: number;
    actualDurationMinutes?: number | null;
    attendanceStatus: LessonAttendance;
    status: SessionStatus;
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
      submittedAt?: string | Date | null;
    } | null;
    approval?: {
      id: string;
      approvedAt: string | Date;
      feedbackNote?: string | null;
    } | null;
    dispute?: {
      id: string;
      status: string;
      category?: string | null;
      reason: string;
      teacherResponse?: string | null;
      teacherRespondedAt?: string | Date | null;
      adminNote?: string | null;
      resolvedAt?: string | Date | null;
    } | null;
  };
  onClose: () => void;
  onApproveSuccess?: () => void;
  onOpenDispute?: () => void;
}

export function ParentReportDetailModal({
  session,
  onClose,
  onApproveSuccess,
  onOpenDispute,
}: ParentReportDetailModalProps) {
  const { t, locale } = useTranslation();

  const r = session.report;
  const isAwaitingValidation = session.status === "TEACHER_COMPLETED" && r?.status === "SUBMITTED";
  const isValidated = session.status === "PARENT_APPROVED" || r?.status === "VALIDATED";
  const isDisputed = session.status === "PARENT_DISPUTED" || r?.status === "DISPUTED" || !!session.dispute;

  const [feedbackNote, setFeedbackNote] = useState("");
  const [approving, setApproving] = useState(false);
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

  const handleApprove = async () => {
    setError(null);
    setApproving(true);
    try {
      const res = await fetch(`/api/parent/sessions/${session.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackNote: feedbackNote.trim() || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible de valider la séance.");
      }

      if (onApproveSuccess) onApproveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur de validation");
    } finally {
      setApproving(false);
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
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                {locale === "en" ? "Lesson Report" : "Compte rendu de séance"}
              </span>
              {isValidated ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{locale === "en" ? "Validated" : "Séance Validée"}</span>
                </span>
              ) : isDisputed ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>{locale === "en" ? "Disputed" : "Litige en cours"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>{locale === "en" ? "Awaiting Validation" : "En attente de validation"}</span>
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight font-heading">
              {session.subjectName || "Cours particulier"}
            </h2>
            <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{session.studentName ? `Élève : ${session.studentName}` : ""}</span>
              <span>•</span>
              <span>{session.teacherName ? `Professeur : ${session.teacherName}` : ""}</span>
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
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dispute Notice if active */}
        {isDisputed && session.dispute && (
          <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 text-rose-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {locale === "en" ? "Dispute in progress" : "Litige en cours d'instruction"} : {session.dispute.category || "Général"}
              </span>
            </div>
            <p className="text-xs text-rose-800 italic bg-white/70 p-2.5 rounded-lg border border-rose-200/50">
              « {session.dispute.reason} »
            </p>
            {session.dispute.teacherResponse && (
              <div className="pt-2 border-t border-rose-200/60">
                <span className="font-semibold text-xs text-slate-700 block mb-1">
                  {locale === "en" ? "Teacher response:" : "Réponse de l'enseignant :"}
                </span>
                <p className="text-xs text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 italic">
                  « {session.dispute.teacherResponse} »
                </p>
              </div>
            )}
            {session.dispute.adminNote && (
              <div className="pt-2 border-t border-rose-200/60">
                <span className="font-semibold text-xs text-blue-800 block mb-1">
                  {locale === "en" ? "Administrative decision:" : "Décision administrative :"}
                </span>
                <p className="text-xs text-blue-900 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200">
                  {session.dispute.adminNote}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Attendance & Duration Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {locale === "en" ? "Attendance" : "Présence"}
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {session.attendanceStatus === "PRESENT"
                ? locale === "en" ? "Present" : "Présent"
                : session.attendanceStatus === "LATE"
                ? locale === "en" ? "Late arrival" : "En retard"
                : session.attendanceStatus === "EXCUSED"
                ? locale === "en" ? "Excused" : "Excusé"
                : session.attendanceStatus === "ABSENT_STUDENT"
                ? locale === "en" ? "Student absent" : "Élève absent"
                : locale === "en" ? "Teacher absent" : "Professeur absent"}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {locale === "en" ? "Actual Duration" : "Durée effective"}
            </span>
            <span className="font-bold text-slate-800 block mt-0.5">
              {session.actualDurationMinutes || session.durationMinutes} min
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {locale === "en" ? "Student Effort" : "Participation"}
            </span>
            <span className="font-bold text-slate-800 block mt-0.5 truncate">
              {r?.studentEffort || "Non renseigné"}
            </span>
          </div>
        </div>

        {/* Report Content */}
        {r ? (
          <div className="space-y-3.5">
            {/* Topics & Objectives */}
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
              <div>
                <span className="text-[11px] font-bold text-slate-800 block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{locale === "en" ? "Topics covered" : "Sujets abordés"}</span>
                </span>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {r.topicsCovered}
                </p>
              </div>

              {r.learningObjectives && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-800 block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{locale === "en" ? "Learning objectives addressed" : "Objectifs pédagogiques visés"}</span>
                  </span>
                  <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {r.learningObjectives}
                  </p>
                </div>
              )}
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-800 block">
                  {locale === "en" ? "Observed Strengths" : "Points forts constatés"}
                </span>
                <p className="mt-1 text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap">
                  {r.strengths || "Aucun point particulier mentionné"}
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[11px] font-bold text-amber-800 block">
                  {locale === "en" ? "Areas for Improvement" : "Difficultés & Axes de progrès"}
                </span>
                <p className="mt-1 text-xs text-amber-950 leading-relaxed whitespace-pre-wrap">
                  {r.areasForImprovement || "Aucune difficulté particulière"}
                </p>
              </div>
            </div>

            {/* Homework Section */}
            {r.homeworkGiven && (
              <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{locale === "en" ? "Homework assigned" : "Devoirs à faire"}</span>
                  </span>
                  {r.homeworkDueDate && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-200">
                      {locale === "en" ? "Due:" : "Pour le :"} {new Date(r.homeworkDueDate).toLocaleDateString(locale === "en" ? "en-GB" : "fr-GN")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-950 leading-relaxed whitespace-pre-wrap mt-1">
                  {r.homeworkGiven}
                </p>
              </div>
            )}

            {/* Assessment / Score */}
            {(r.assessmentScore !== null && r.assessmentScore !== undefined) || r.progressRating ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span>{r.assessmentTitle || (locale === "en" ? "Session assessment" : "Contrôle continu")}</span>
                  </span>
                  {r.assessmentComment && (
                    <p className="text-xs text-slate-500 mt-0.5">{r.assessmentComment}</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {r.assessmentScore !== null && r.assessmentScore !== undefined && (
                    <span className="text-sm font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg">
                      {r.assessmentScore} / {r.assessmentMaxScore || 20}
                    </span>
                  )}
                  {r.progressRating && (
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            r.progressRating! >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* General Teacher Notes */}
            {r.teacherNotes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  {locale === "en" ? "Teacher general comments:" : "Observations du professeur :"}
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                  « {r.teacherNotes} »
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-xs text-slate-700">
              {locale === "en" ? "Report not yet submitted" : "Compte rendu non encore soumis"}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {locale === "en"
                ? "The teacher has not yet completed the educational summary for this lesson."
                : "L'enseignant n'a pas encore finalisé le compte rendu pédagogique pour cette séance."}
            </p>
          </div>
        )}

        {/* Previous validation note if already validated */}
        {isValidated && session.approval && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {locale === "en" ? "Validated on:" : "Validée le :"} {new Date(session.approval.approvedAt).toLocaleDateString(locale === "en" ? "en-GB" : "fr-GN")}
              </span>
            </div>
            {session.approval.feedbackNote && (
              <span className="italic text-emerald-800">« {session.approval.feedbackNote} »</span>
            )}
          </div>
        )}

        {/* Action Panel for Parent when awaiting review */}
        {isAwaitingValidation && (
          <div className="pt-3 border-t border-slate-200 space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                {locale === "en" ? "Optional parent feedback note:" : "Commentaire ou retour pour le professeur (Optionnel) :"}
              </label>
              <input
                type="text"
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder={locale === "en" ? "e.g. Thank you, Mamadou was very happy with this lesson!" : "Ex: Merci beaucoup, Mamadou a très bien compris ce chapitre !"}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#16385c]/20"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {onOpenDispute && (
                <button
                  type="button"
                  onClick={onOpenDispute}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{locale === "en" ? "Dispute this lesson" : "Contester la séance"}</span>
                </button>
              )}

              <div className="flex items-center gap-2 justify-end ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {locale === "en" ? "Close" : "Fermer"}
                </button>

                <button
                  type="button"
                  disabled={approving}
                  onClick={handleApprove}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {approving
                      ? locale === "en" ? "Validating..." : "Validation..."
                      : locale === "en" ? "Approve Lesson" : "Valider la séance"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Close if not awaiting */}
        {!isAwaitingValidation && (
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Close" : "Fermer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

