"use client";

import React, { useState } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  Calendar,
  GraduationCap,
  School,
  Sparkles,
  ShieldCheck,
  User,
  Info,
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
  const [customCycle, setCustomCycle] = useState(initialData?.customCycle || "");
  const [gradeLevel, setGradeLevel] = useState(initialData?.gradeLevel || "");
  const [schoolName, setSchoolName] = useState(initialData?.schoolName || "");
  const [dateOfBirth, setDateOfBirth] = useState(
    initialData?.dateOfBirth ? initialData.dateOfBirth.split("T")[0] : ""
  );
  const [supportNeeds, setSupportNeeds] = useState(initialData?.supportNeeds || "");
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>(
    initialData?.preferredSubjects || []
  );
  const [customSubject, setCustomSubject] = useState(initialData?.customSubject || "");
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

    if (cycle === "AUTRE" && (!customCycle.trim() || customCycle.trim().length < 2)) {
      setErrorMessage(
        locale === "en"
          ? "Please specify the educational cycle or training area (at least 2 characters)."
          : "Veuillez préciser le cycle ou la formation spécifique (au moins 2 caractères)."
      );
      return;
    }

    if (
      preferredSubjects.includes("Autre") &&
      (!customSubject.trim() || customSubject.trim().length < 2)
    ) {
      setErrorMessage(
        locale === "en"
          ? "Please specify the custom subject or training (at least 2 characters)."
          : "Veuillez préciser la matière ou la formation spécifique (au moins 2 caractères)."
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
        customCycle: cycle === "AUTRE" ? customCycle.trim() : null,
        gradeLevel: gradeLevel.trim(),
        schoolName: schoolName.trim() || null,
        dateOfBirth: dateOfBirth || null,
        supportNeeds: supportNeeds.trim() || null,
        preferredSubjects,
        customSubject: preferredSubjects.includes("Autre") ? customSubject.trim() : null,
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
      aria-labelledby="student-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="relative bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Fixed Modern Header */}
        <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0 bg-white z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#16385c] to-blue-800 text-white flex items-center justify-center shadow-md shadow-blue-900/15 shrink-0 mt-0.5">
              <GraduationCap className="w-6 h-6 text-[#e59a38]" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {locale === "en" ? "Parent Space • Guinea" : "Espace Parent • Guinée"}
                </span>
                {isEditing && (
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    {locale === "en" ? "Edition" : "Modification"}
                  </span>
                )}
              </div>

              <h2
                id="student-modal-title"
                className="font-extrabold text-base sm:text-xl text-[#16385c] font-heading tracking-tight"
              >
                {isEditing
                  ? locale === "en"
                    ? "Edit Student Dossier"
                    : "Modifier la fiche de l'élève"
                  : locale === "en"
                  ? "Register a New Student"
                  : "Ajouter un nouvel enfant"}
              </h2>

              <p className="text-xs text-slate-500 line-clamp-1 sm:line-clamp-none">
                {locale === "en"
                  ? "Complete your child's academic profile to find verified private tutors in Conakry."
                  : "Renseignez les détails scolaires pour trouver un professeur certifié à Conakry."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label={locale === "en" ? "Close dialog" : "Fermer la boîte de dialogue"}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="mx-5 sm:mx-7 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Informative Rule: Creating Profile Does Not Automatically Create Request */}
        {!isEditing && (
          <div className="mx-5 sm:mx-7 mt-3 p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-950 flex items-start gap-2.5 shrink-0">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">
              {locale === "en"
                ? "Note: Registering a student creates their academic profile. To match an approved private tutor, a tutoring request will be created next."
                : "Rappel : L'inscription enregistre le profil scolaire de votre enfant. Pour trouver un professeur agréé, vous serez invité(e) à formuler une demande de cours immédiatement après."}
            </p>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form
          id="student-form"
          onSubmit={handleSubmit}
          className="px-5 sm:px-7 py-5 overflow-y-auto flex-1 space-y-6 scrollbar-thin"
        >
          {/* Section 1: Identity & School */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {locale === "en" ? "1. Student Identity & School" : "1. Identité & Établissement"}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t("parent.form.nameLabel", "Nom et prénom de l'élève *")}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("parent.form.namePlaceholder", "ex: Mamadou Barry")}
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 focus:border-[#16385c] transition-all"
                  />
                </div>
              </div>

              {/* School Name & Date of Birth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("parent.form.schoolLabel", "Établissement scolaire actuel")}
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder={t(
                        "parent.form.schoolPlaceholder",
                        "ex: Lycée Sainte-Marie de Dixinn"
                      )}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 focus:border-[#16385c] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {t("parent.form.dobLabel", "Date de naissance (facultatif)")}
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 focus:border-[#16385c] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Education Level & Specific Grade */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {locale === "en" ? "2. Academic Cycle & Class" : "2. Cursus & Niveau scolaire"}
              </h3>
            </div>

            <EducationLevelSelect
              selectedCycle={cycle}
              onCycleChange={setCycle}
              customCycle={customCycle}
              onCustomCycleChange={setCustomCycle}
              selectedGradeLevel={gradeLevel}
              onGradeLevelChange={setGradeLevel}
              gradeLevels={gradeLevels}
            />
          </div>

          {/* Section 3: Target Subjects & Pedagogical Goals */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {locale === "en"
                  ? "3. Priority Subjects & Support Goals"
                  : "3. Matières Cibles & Besoins Pédagogiques"}
              </h3>
            </div>

            {/* Target Tutoring Subjects */}
            <SubjectSelector
              selectedSubjects={preferredSubjects}
              onChange={setPreferredSubjects}
              customSubject={customSubject}
              onCustomSubjectChange={setCustomSubject}
              availableSubjects={availableSubjects}
            />

            {/* Academic Needs & Goals */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 focus:border-[#16385c] transition-all resize-y min-h-[70px]"
              />
            </div>

            {/* Confidential Educational Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {t(
                      "parent.form.notesLabel",
                      "Remarques éducatives confidentielles"
                    )}
                  </span>
                </label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {locale === "en" ? "Confidential" : "Confidentiel"}
                </span>
              </div>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(
                  "parent.form.notesPlaceholder",
                  "Remarques pédagogiques destinées uniquement à votre suivi et au professeur assigné..."
                )}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]/15 focus:border-[#16385c] transition-all resize-y min-h-[60px]"
              />
            </div>
          </div>
        </form>

        {/* Fixed Modern Footer */}
        <div className="px-5 sm:px-7 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 text-center sm:text-left">
            * {locale === "en" ? "Required fields" : "Champs obligatoires"}
          </span>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-center"
            >
              {t("parent.form.cancelBtn", "Annuler")}
            </button>

            <button
              type="submit"
              form="student-form"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{t("parent.form.saving", "Enregistrement en cours...")}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#e59a38]" />
                  <span>
                    {isEditing
                      ? locale === "en"
                        ? "Save Changes"
                        : "Enregistrer les modifications"
                      : t("parent.form.saveBtn", "Enregistrer l'élève")}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
