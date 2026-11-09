"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  Clock,
  Calendar,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Save,
  Info,
  Check,
  RotateCcw,
  Sun,
  Sunset,
  Moon,
  CalendarDays,
} from "lucide-react";
import { validateAvailabilitySlots, AvailabilitySlot } from "@/lib/validation/availability";

interface TeacherAvailabilityClientProps {
  initialAvailabilities: AvailabilitySlot[];
}

const DAYS_OF_WEEK = [
  { day: 1, fr: "Lundi", en: "Monday", shortFr: "Lun", shortEn: "Mon" },
  { day: 2, fr: "Mardi", en: "Tuesday", shortFr: "Mar", shortEn: "Tue" },
  { day: 3, fr: "Mercredi", en: "Wednesday", shortFr: "Mer", shortEn: "Wed" },
  { day: 4, fr: "Jeudi", en: "Thursday", shortFr: "Jeu", shortEn: "Thu" },
  { day: 5, fr: "Vendredi", en: "Friday", shortFr: "Ven", shortEn: "Fri" },
  { day: 6, fr: "Samedi", en: "Saturday", shortFr: "Sam", shortEn: "Sat" },
  { day: 0, fr: "Dimanche", en: "Sunday", shortFr: "Dim", shortEn: "Sun" },
];

export function TeacherAvailabilityClient({
  initialAvailabilities,
}: TeacherAvailabilityClientProps) {
  const router = useRouter();
  const { locale } = useTranslation();

  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    initialAvailabilities.length > 0
      ? initialAvailabilities
      : [
          { dayOfWeek: 1, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 3, startTime: "14:00", endTime: "18:00" },
          { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" },
        ]
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick slot adder state
  const [newDay, setNewDay] = useState<number>(1);
  const [newStart, setNewStart] = useState<string>("14:00");
  const [newEnd, setNewEnd] = useState<string>("18:00");

  // Calculate metrics
  const totalHours = useMemo(() => {
    let minutes = 0;
    for (const slot of slots) {
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff > 0) minutes += diff;
      }
    }
    return Math.round((minutes / 60) * 10) / 10;
  }, [slots]);

  const activeDaysCount = useMemo(() => {
    const days = new Set(slots.map((s) => s.dayOfWeek));
    return days.size;
  }, [slots]);

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map: Record<number, AvailabilitySlot[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
    };
    for (const s of slots) {
      if (map[s.dayOfWeek]) {
        map[s.dayOfWeek].push(s);
      }
    }
    // Sort chronologically within each day
    Object.keys(map).forEach((k) => {
      map[Number(k)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return map;
  }, [slots]);

  // Handlers
  const handleAddSlot = (day: number, start: string, end: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (start >= end) {
      setErrorMessage(
        locale === "en"
          ? "End time must be after start time."
          : "L'heure de fin doit être postérieure à l'heure de début."
      );
      return;
    }

    const candidate = { dayOfWeek: day, startTime: start, endTime: end };
    const testList = [...slots, candidate];
    const validation = validateAvailabilitySlots(testList);

    if (!validation.isValid) {
      setErrorMessage(
        validation.error ||
          (locale === "en"
            ? "This slot overlaps with an existing time slot."
            : "Ce créneau chevauche une plage horaire existante.")
      );
      return;
    }

    setSlots(testList);
  };

  const handleRemoveSlot = (index: number) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (preset: "morning" | "afternoon" | "evening" | "weekend") => {
    setErrorMessage(null);
    setSuccessMessage(null);

    let newSlots: AvailabilitySlot[] = [];
    if (preset === "morning") {
      // Mon to Fri mornings 08:00 - 12:00
      newSlots = [1, 2, 3, 4, 5].map((d) => ({
        dayOfWeek: d,
        startTime: "08:00",
        endTime: "12:00",
      }));
    } else if (preset === "afternoon") {
      // Mon to Fri afternoons 14:00 - 18:00
      newSlots = [1, 2, 3, 4, 5].map((d) => ({
        dayOfWeek: d,
        startTime: "14:00",
        endTime: "18:00",
      }));
    } else if (preset === "evening") {
      // Mon to Fri evenings 17:00 - 20:00
      newSlots = [1, 2, 3, 4, 5].map((d) => ({
        dayOfWeek: d,
        startTime: "17:00",
        endTime: "20:00",
      }));
    } else if (preset === "weekend") {
      // Sat & Sun full days
      newSlots = [
        { dayOfWeek: 6, startTime: "09:00", endTime: "17:00" },
        { dayOfWeek: 0, startTime: "09:00", endTime: "17:00" },
      ];
    }

    // Combine avoiding overlaps
    const merged = [...slots];
    for (const ns of newSlots) {
      const hasOverlap = merged.some(
        (existing) =>
          existing.dayOfWeek === ns.dayOfWeek &&
          !(existing.endTime <= ns.startTime || existing.startTime >= ns.endTime)
      );
      if (!hasOverlap) {
        merged.push(ns);
      }
    }

    setSlots(merged);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (slots.length === 0) {
      setErrorMessage(
        locale === "en"
          ? "Please configure at least one availability slot per week."
          : "Veuillez renseigner au moins un créneau horaire hebdomadaire."
      );
      setIsSaving(false);
      return;
    }

    const validation = validateAvailabilitySlots(slots);
    if (!validation.isValid) {
      setErrorMessage(
        validation.error ||
          (locale === "en"
            ? "Invalid availability slots."
            : "Créneaux horaires invalides ou en conflit.")
      );
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/teacher/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availabilities: slots }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error ||
            (locale === "en"
              ? "Failed to save weekly availability."
              : "Erreur lors de l'enregistrement des disponibilités.")
        );
        setIsSaving(false);
        return;
      }

      setSuccessMessage(
        locale === "en"
          ? "Your weekly availability schedule has been successfully published."
          : "Vos disponibilités hebdomadaires ont été enregistrées avec succès."
      );
      setIsSaving(false);
      router.refresh();
    } catch {
      setErrorMessage(
        locale === "en"
          ? "Network error. Please try again."
          : "Erreur réseau lors de l'enregistrement."
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {locale === "en" ? "Teacher Space" : "Espace Enseignant"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Availability Schedule" : "Disponibilités"}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en"
              ? "Weekly Teaching Availability"
              : "Disponibilités Hebdomadaires"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "en"
              ? "Set your recurring weekly slots. Parents and administration use this calendar to match and schedule lessons."
              : "Définissez vos plages horaires habituelles. Les familles et l'administration consultent ces créneaux pour planifier vos séances."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <NotificationBell variant="light" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. Key Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Total Weekly Volume" : "Volume Hebdomadaire"}
            </span>
            <span className="text-xl font-black text-slate-900 font-heading">
              {totalHours} h / {locale === "en" ? "week" : "semaine"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Active Days" : "Jours Disponibles"}
            </span>
            <span className="text-xl font-black text-slate-900 font-heading">
              {activeDaysCount} / 7 {locale === "en" ? "days" : "jours"}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Calendar Status" : "Statut du Planning"}
            </span>
            <span className="text-xs font-bold text-emerald-700 block">
              {slots.length > 0
                ? locale === "en"
                  ? `${slots.length} Recurring Slots Published`
                  : `${slots.length} créneaux actifs enregistrés`
                : locale === "en"
                ? "No Slots Set"
                : "Aucun créneau configuré"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Feedback Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {locale === "en" ? "Scheduling Conflict" : "Erreur de créneau"}
            </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">
              {locale === "en" ? "Success" : "Modifications Enregistrées"}
            </span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* 4. Quick Add & Preset Tool Bar */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#16385c]" />
              <span>{locale === "en" ? "Add Time Slot" : "Ajouter une plage horaire"}</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {locale === "en"
                ? "Select a day and time interval to add to your weekly routine."
                : "Choisissez un jour et une plage horaire à ajouter à votre planning."}
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">
              {locale === "en" ? "Presets:" : "Modèles :"}
            </span>
            <button
              type="button"
              onClick={() => handleApplyPreset("afternoon")}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Afternoon (14-18h)" : "Après-midi (14h-18h)"}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("evening")}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Evening (17-20h)" : "Soirée (17h-20h)"}
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("weekend")}
              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {locale === "en" ? "Week-end (09-17h)" : "Week-end (09h-17h)"}
            </button>
          </div>
        </div>

        {/* Custom Adder Form Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locale === "en" ? "Day of Week" : "Jour de la semaine"}
            </label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] shadow-xs cursor-pointer"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.day} value={d.day}>
                  {locale === "en" ? d.en : d.fr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locale === "en" ? "Start Time" : "Heure de début"}
            </label>
            <input
              type="time"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] shadow-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {locale === "en" ? "End Time" : "Heure de fin"}
            </label>
            <input
              type="time"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c] shadow-xs"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleAddSlot(newDay, newStart, newEnd)}
              className="w-full py-2 px-3 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>{locale === "en" ? "Add Slot" : "Ajouter ce créneau"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. 7-Day Weekly Calendar Visual Matrix */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>
              {locale === "en" ? "Weekly Schedule Matrix" : "Grille Hebdomadaire des Créneaux"}
            </span>
          </h3>
          <span className="text-xs text-slate-400">
            {locale === "en"
              ? "Click any slot to delete or adjust"
              : "Créneaux récurrents hebdomadaires"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {DAYS_OF_WEEK.map((d) => {
            const daySlots = slotsByDay[d.day];
            return (
              <div
                key={d.day}
                className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between min-h-[180px]"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2.5">
                    <span className="font-bold text-xs text-slate-800">
                      {locale === "en" ? d.shortEn : d.shortFr}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500">
                      {daySlots.length}
                    </span>
                  </div>

                  {daySlots.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-[11px]">
                      {locale === "en" ? "Free" : "Libre"}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {daySlots.map((s, idx) => {
                        const globalIndex = slots.findIndex(
                          (original) =>
                            original.dayOfWeek === s.dayOfWeek &&
                            original.startTime === s.startTime &&
                            original.endTime === s.endTime
                        );
                        return (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-white border border-slate-200 text-xs shadow-xs flex items-center justify-between group hover:border-amber-300 transition-colors"
                          >
                            <div>
                              <span className="font-bold text-slate-800 block text-[11px]">
                                {s.startTime} - {s.endTime}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(globalIndex)}
                              className="text-slate-300 hover:text-rose-600 transition-colors p-1 rounded-md"
                              title={locale === "en" ? "Delete slot" : "Supprimer"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewDay(d.day);
                  }}
                  className="mt-3 w-full py-1 text-[10px] font-semibold rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-center transition-colors cursor-pointer"
                >
                  + {locale === "en" ? "Add" : "Ajouter"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Footer Save Action Bar */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            {locale === "en"
              ? "Remember to save your changes so they reflect in lesson scheduling and matching."
              : "Pensez à enregistrer vos modifications pour qu'elles soient prises en compte dans le calendrier."}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer shrink-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{locale === "en" ? "Publishing Schedule..." : "Publication..."}</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-[#e59a38]" />
              <span>
                {locale === "en"
                  ? "Save & Publish Availability"
                  : "Enregistrer mes disponibilités"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

