"use client";

import React, { useState } from "react";
import { Calendar, Clock, AlertTriangle, Loader2, X, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { CalendarSessionItem } from "./SessionDetailModal";

interface RescheduleSessionModalProps {
  session: CalendarSessionItem;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function RescheduleSessionModal({
  session,
  onClose,
  onSuccess,
}: RescheduleSessionModalProps) {
  const { t, locale } = useTranslation();

  // Extract current date YYYY-MM-DD and HH:MM
  const initialDate = session.scheduledStart.slice(0, 10);
  const initialTime = new Date(session.scheduledStart).toLocaleTimeString("fr-GN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Conakry",
  });

  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [duration, setDuration] = useState(session.durationMinutes);
  const [reason, setReason] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate conflict in real-time
  const checkConflict = async (checkDate: string, checkTime: string, checkDur: number) => {
    if (!checkDate || !checkTime) return;
    try {
      const [hours, mins] = checkTime.split(":").map(Number);
      const start = new Date(checkDate);
      start.setUTCHours(hours, mins, 0, 0);
      const end = new Date(start.getTime() + checkDur * 60000);

      const res = await fetch(
        `/api/calendar/availability-check?teacherProfileId=${
          session.classroom.teacherProfile.id
        }&start=${start.toISOString()}&end=${end.toISOString()}&excludeSessionId=${session.id}`
      );
      const data = await res.json();
      if (data.hasConflict) {
        setConflictWarning(data.message || "Conflit détecté avec une autre séance.");
      } else {
        setConflictWarning(null);
      }
    } catch {
      // ignore
    }
  };

  const handleDateChange = (val: string) => {
    setDate(val);
    checkConflict(val, time, duration);
  };

  const handleTimeChange = (val: string) => {
    setTime(val);
    checkConflict(date, val, duration);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) {
      setError(locale === "en" ? "Please select a date and time." : "Veuillez sélectionner une date et une heure.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setError(locale === "en" ? "Please provide a reason of at least 5 characters." : "Veuillez indiquer un motif d'au moins 5 caractères.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const [hours, mins] = time.split(":").map(Number);
      const newStart = new Date(date);
      newStart.setUTCHours(hours, mins, 0, 0);
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      const res = await fetch(`/api/calendar/sessions/${session.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStart: newStart.toISOString(),
          newEnd: newEnd.toISOString(),
          durationMinutes: duration,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la reprogrammation");
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
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              {locale === "en" ? "Reschedule Session" : "Reprogrammer la séance"}
            </h3>
            <p className="text-[11px] text-slate-400">
              Séance #{session.sessionSequence} • {session.classroom.subjectName}
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

        {conflictWarning && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{conflictWarning}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "New Date" : "Nouvelle date"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {locale === "en" ? "Start Time (Conakry)" : "Heure de début (Conakry)"}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                {locale === "en" ? "Duration (Minutes)" : "Durée (Minutes)"}
              </label>
              <input
                type="number"
                min={30}
                max={240}
                step={15}
                value={duration}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDuration(val);
                  checkConflict(date, time, val);
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "Reason for Rescheduling" : "Motif du report (obligatoire)"}
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                locale === "en"
                  ? "e.g. Schedule adjustment requested by parent due to student school exam..."
                  : "ex: Ajustement d'horaire convenu avec la famille pour cause d'examen scolaire..."
              }
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
            {locale === "en"
              ? "Financial invariant: The allocated session fee remains guaranteed and unchanged."
              : "Règle financière : L'allocation monétaire de la séance reste strictement garantie et inchangée."}
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
              disabled={isSubmitting || Boolean(conflictWarning)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold bg-[#16385c] hover:bg-[#1f4a7a] transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === "en" ? "Saving..." : "Reprogrammation..."}</span>
                </>
              ) : (
                <span>{locale === "en" ? "Confirm New Date" : "Valider le report"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

