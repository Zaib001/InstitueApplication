"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Calendar,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { EducationLevelSelect, GradeLevelOption } from "./EducationLevelSelect";
import { SubjectSelector, SubjectOption } from "./SubjectSelector";
import { StudentCardData } from "./StudentCard";

interface StudentProfileFormProps {
  initialData?: StudentCardData | null;
  gradeLevels: GradeLevelOption[];
  availableSubjects: SubjectOption[];
  onSaveSuccess: (savedStudent: StudentCardData) => void;
  onCancel: () => void;
}

export function StudentProfileForm({
  initialData,
  gradeLevels,
  availableSubjects,
  onSaveSuccess,
  onCancel,
}: StudentProfileFormProps) {
  const { t, locale } = useTranslation();

  const isEditing = Boolean(initialData?.id);

  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [cycle, setCycle] = useState(initialData?.cycle || "LYCEE");
  const [gradeLevel, setGradeLevel] = useState(initialData?.gradeLevel || "");
  const [schoolName, setSchoolName] = useState(initialData?.schoolName || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    initialData?.dateOfBirth ? initialData.dateOfBirth.split("T")[0] : ""
  );
  const [supportNeeds, setSupportNeeds] = useState(initialData?.supportNeeds || "");
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>(
    initialData?.preferredSubjects || []
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage(
        locale === "en"
          ? "Please enter the student's full name (at least 2 characters)."
          : "Veuillez renseigner le nom complet de l'élève (au moins 2 caractères)."
      );
      return;
    }

    if (!gradeLevel.trim()) {
      setErrorMessage(
        locale === "en"
          ? "Please select or specify the student's grade level."
          : "Veuillez renseigner la classe ou le niveau scolaire de l'élève."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        cycle,
        gradeLevel: gradeLevel.trim(),
        schoolName: schoolName.trim() || null,
        dateOfBirth: dateOfBirth || null,
        supportNeeds: supportNeeds.trim() || null,
        preferredSubjects,
        notes: notes.trim() || null,
      };

      const url = isEditing
        ? `/api/parent/children/${initialData!.id}`
        : "/api/parent/children";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          json.error ||
            (locale === "en"
              ? "An error occurred while saving the profile."
              : "Une erreur est survenue lors de l'enregistrement.")
        );
      }

      onSaveSuccess(json.data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-800 font-heading">
              {isEditing
                ? t("parent.form.editTitle", "Modifier la fiche de l'élève")
                : t("parent.form.createTitle", "Ajouter un nouvel enfant")}
            </h2>
            <p className="text-xs text-slate-400">
              {locale === "en"
                ? "Academic information required to match with verified tutors in Guinea."
                : "Informations scolaires pour la mise en relation avec des enseignants qualifiés."}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("parent.form.nameLabel", "Nom et prénom de l'élève *")}
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("parent.form.namePlaceholder", "ex: Mamadou Barry")}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
            />
          </div>

          {/* Education Level & Specific Grade Select */}
          <EducationLevelSelect
            selectedCycle={cycle}
            onCycleChange={setCycle}
            selectedGradeLevel={gradeLevel}
            onGradeLevelChange={setGradeLevel}
            gradeLevels={gradeLevels}
          />

          {/* School Name & Optional Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("parent.form.schoolLabel", "Établissement scolaire actuel")}
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder={t(
                  "parent.form.schoolPlaceholder",
                  "ex: Lycée Sainte-Marie de Dixinn"
                )}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("parent.form.dobLabel", "Date de naissance (facultatif)")}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
              />
            </div>
          </div>

          {/* Target Tutoring Subjects */}
          <SubjectSelector
            selectedSubjects={preferredSubjects}
            onChange={setPreferredSubjects}
            availableSubjects={availableSubjects}
          />

          {/* Academic Needs & Goals */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t(
                "parent.form.needsLabel",
                "Besoins d'accompagnement & Objectifs académiques"
              )}
            </label>
            <textarea
              rows={3}
              value={supportNeeds}
              onChange={(e) => setSupportNeeds(e.target.value)}
              placeholder={t(
                "parent.form.needsPlaceholder",
                "ex: Difficultés en calcul intégral, consolidation des bases pour le Bac Unique..."
              )}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
            />
          </div>

          {/* Confidential Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("parent.form.notesLabel", "Remarques éducatives confidentielles")}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t(
                "parent.form.notesPlaceholder",
                "Remarques pédagogiques destinées uniquement à votre suivi et au professeur assigné..."
              )}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t("parent.form.cancelBtn", "Annuler")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("parent.form.saving", "Enregistrement en cours...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-[#e59a38]" />
                  <span>{t("parent.form.saveBtn", "Enregistrer l'élève")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
