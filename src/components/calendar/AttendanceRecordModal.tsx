"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Loader2, X, AlertTriangle } from "lucide-react";
import { LessonAttendance } from "@prisma/client";
import { useTranslation } from "@/lib/i18n";
import { CalendarSessionItem } from "./SessionDetailModal";

interface AttendanceRecordModalProps {
  session: CalendarSessionItem;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function AttendanceRecordModal({
  session,
  onClose,
  onSuccess,
}: AttendanceRecordModalProps) {
  const { locale } = useTranslation();

  const [status, setStatus] = useState<LessonAttendance>(session.attendanceStatus || "PRESENT");
  const [actualDuration, setActualDuration] = useState<number>(
    session.actualDurationMinutes || session.durationMinutes || 60
  );
  const [notes, setNotes] = useState(session.attendanceNotes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/calendar/sessions/${session.id}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceStatus: status,
          actualDurationMinutes: actualDuration,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement");
      }

      onSuccess(data.session);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const attendanceOptions: { value: LessonAttendance; label: string; desc: string }[] = [
    {
      value: "PRESENT",
      label: locale === "en" ? "Present" : "Présent",
      desc: locale === "en" ? "Student attended as planned" : "L'élève a assisté au cours",
    },
    {
      value: "LATE",
      label: locale === "en" ? "Late" : "En retard",
      desc: locale === "en" ? "Student arrived with delay" : "L'élève s'est présenté en retard",
    },
    {
      value: "EXCUSED",
      label: locale === "en" ? "Excused Absence" : "Absence Excusée",
      desc: locale === "en" ? "Informed before session" : "Famille a prévenu à l'avance",
    },
    {
      value: "ABSENT_STUDENT",
      label: locale === "en" ? "Absent (Student)" : "Absent (Élève)",
      desc: locale === "en" ? "Unannounced student absence" : "L'élève ne s'est pas présenté",
    },
    {
      value: "ABSENT_TEACHER",
      label: locale === "en" ? "Absent (Tutor)" : "Absent (Professeur)",
      desc: locale === "en" ? "Tutor was unavailable" : "Le tuteur n'a pas pu dispenser le cours",
    },
  ];

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
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              {locale === "en" ? "Record Attendance" : "Feuille d'émargement & Présence"}
            </h3>
            <p className="text-[11px] text-slate-400">
              Séance #{session.sessionSequence} • {session.classroom?.subjectName || "Cours"}
            </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-2">
              {locale === "en" ? "Select Status" : "Statut de présence de l'élève"}
            </label>
            <div className="space-y-2">
              {attendanceOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    status === opt.value
                      ? "bg-blue-50/60 border-[#16385c] ring-1 ring-[#16385c]"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value={opt.value}
                    checked={status === opt.value}
                    onChange={() => setStatus(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{opt.label}</span>
                    <span className="text-[11px] text-slate-400 block">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "Actual Duration (Minutes)" : "Durée effective réelle (Minutes)"}
            </label>
            <input
              type="number"
              min={15}
              max={300}
              step={5}
              value={actualDuration}
              onChange={(e) => setActualDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              La durée effective enregistre le temps réel dispensé. Elle ne modifie pas le montant convenu du forfait.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "Notes / Observations" : "Observations de séance (facultatif)"}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Participation active, exercices terminés dans les temps..."
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              {locale === "en" ? "Cancel" : "Annuler"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold bg-[#16385c] hover:bg-[#1f4a7a] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === "en" ? "Recording..." : "Enregistrement..."}</span>
                </>
              ) : (
                <span>{locale === "en" ? "Save Attendance" : "Valider l'émargement"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

