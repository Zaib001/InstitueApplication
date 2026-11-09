"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface ClassroomOption {
  id: string;
  subjectName: string;
  studentName: string;
  teacherName: string;
  sessionsCount: number;
  minutesPerSession: number;
  activeSessionsCount: number;
  remainingToSchedule: number;
  isAssisted: boolean;
  status: string;
}

interface SchedulePackageModalProps {
  classrooms: ClassroomOption[];
  defaultClassroomId?: string;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

interface SlotItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
}

export function SchedulePackageModal({
  classrooms,
  defaultClassroomId,
  onClose,
  onSuccess,
}: SchedulePackageModalProps) {
  const { locale } = useTranslation();

  const [selectedClassroomId, setSelectedClassroomId] = useState<string>(
    defaultClassroomId || (classrooms[0] ? classrooms[0].id : "")
  );

  // Default tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [startDate, setStartDate] = useState(tomorrow.toISOString().slice(0, 10));

  // Recurring slots
  const [slots, setSlots] = useState<SlotItem[]>([
    { id: "slot-1", dayOfWeek: 1, startTime: "16:00" }, // Lundi 16:00
    { id: "slot-2", dayOfWeek: 3, startTime: "16:00" }, // Mercredi 16:00
  ]);

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedClass = classrooms.find((c) => c.id === selectedClassroomId);

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        id: `slot-${Date.now()}`,
        dayOfWeek: 5, // Vendredi
        startTime: "16:00",
      },
    ]);
  };

  const removeSlot = (id: string) => {
    if (slots.length <= 1) return;
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSlot = (id: string, field: "dayOfWeek" | "startTime", value: any) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const dayLabels = [
    { value: 0, label: locale === "en" ? "Sunday" : "Dimanche" },
    { value: 1, label: locale === "en" ? "Monday" : "Lundi" },
    { value: 2, label: locale === "en" ? "Tuesday" : "Mardi" },
    { value: 3, label: locale === "en" ? "Wednesday" : "Mercredi" },
    { value: 4, label: locale === "en" ? "Thursday" : "Jeudi" },
    { value: 5, label: locale === "en" ? "Friday" : "Vendredi" },
    { value: 6, label: locale === "en" ? "Saturday" : "Samedi" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassroomId) {
      setError(locale === "en" ? "Please select a classroom." : "Veuillez sélectionner une classe.");
      return;
    }
    if (slots.length === 0) {
      setError(locale === "en" ? "Please add at least one recurring slot." : "Veuillez ajouter au moins un créneau hebdomadaire.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/calendar/sessions/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: selectedClassroomId,
          startDate,
          recurringSlots: slots.map((s) => ({
            dayOfWeek: Number(s.dayOfWeek),
            startTime: s.startTime,
          })),
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de planification");
      }

      onSuccess(data);
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
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
              {locale === "en" ? "Schedule Tutoring Package" : "Planifier les séances du forfait"}
            </h3>
            <p className="text-[11px] text-slate-400">
              Génération automatique des dates selon les créneaux récurrents convenus
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
          {/* Select Classroom */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "Classroom" : "Sélectionner la classe"}
            </label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs font-semibold"
              required
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.subjectName} — {c.studentName} ({c.teacherName}) [
                  {c.remainingToSchedule} restante(s)]
                </option>
              ))}
            </select>
          </div>

          {selectedClass && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Total forfait :</span>
                <span className="font-bold text-slate-800">{selectedClass.sessionsCount} séances</span>
              </div>
              <div>
                <span className="text-slate-400 block">Durée prévue :</span>
                <span className="font-bold text-slate-800">{selectedClass.minutesPerSession} min / séance</span>
              </div>
              <div>
                <span className="text-slate-400 block">Restantes à planifier :</span>
                <span className="font-extrabold text-[#16385c]">{selectedClass.remainingToSchedule} séance(s)</span>
              </div>
            </div>
          )}

          {/* First Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "First Lesson Date" : "Date de début de la planification"}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
              required
            />
          </div>

          {/* Weekly Recurring Slots */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-600 uppercase">
                {locale === "en" ? "Weekly Recurring Slots" : "Créneaux hebdomadaires récurrents"}
              </label>
              <button
                type="button"
                onClick={addSlot}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16385c] hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Add slot" : "Ajouter un créneau"}</span>
              </button>
            </div>

            <div className="space-y-2">
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                >
                  <span className="text-[11px] font-bold text-slate-400 w-6">#{index + 1}</span>

                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => updateSlot(slot.id, "dayOfWeek", Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    {dayLabels.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs font-semibold"
                    required
                  />

                  {slots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              {locale === "en" ? "General Session Objective" : "Objectif pédagogique global (facultatif)"}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex: Remise à niveau en Mathématiques et préparation aux examens"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden text-xs"
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
                  <span>{locale === "en" ? "Generating..." : "Génération..."}</span>
                </>
              ) : (
                <span>{locale === "en" ? "Generate Schedule" : "Générer le planning"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

