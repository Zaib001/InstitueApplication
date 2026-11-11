"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Loader2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Save,
  User,
  BookOpen,
  MapPin,
  Clock,
  Sparkles,
  Home,
  Laptop,
  ShieldCheck,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  GraduationCap,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { RequestCardData } from "./RequestCard";
import {
  FREQUENCY_OPTIONS,
  CONAKRY_COMMUNES,
} from "@/lib/validation/tutoring-request";
import { EducationLevelSelect } from "@/components/parent/EducationLevelSelect";
import { SubjectSelector } from "@/components/parent/SubjectSelector";
import { formatGnf } from "@/lib/money/currency";

interface StudentChild {
  id: string;
  fullName: string;
  gradeLevel: string;
  cycle?: string | null;
  customCycle?: string | null;
  preferredSubjects?: string[];
  customSubject?: string | null;
}

interface TutoringRequestWizardProps {
  initialData?: RequestCardData | null;
  defaultStudentId?: string | null;
  childrenList: StudentChild[];
  availableSubjects: Array<{ id: string; name: string; category?: string | null }>;
  gradeLevels: Array<{ id: string; name: string; cycle: string }>;
  onSaveSuccess: (savedRequest: any) => void;
  onCancel: () => void;
}

export function TutoringRequestWizard({
  initialData,
  defaultStudentId,
  childrenList,
  availableSubjects,
  gradeLevels,
  onSaveSuccess,
  onCancel,
}: TutoringRequestWizardProps) {
  const { locale } = useTranslation();
  const isEditing = Boolean(initialData?.id);

  // Stepper state: 1 to 5
  const [currentStep, setCurrentStep] = useState(1);

  // Form State - Step 1: Student
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialData?.student?.id || defaultStudentId || childrenList[0]?.id || ""
  );

  // Step 2: Subject & Level
  const [subjectName, setSubjectName] = useState(
    initialData?.subjectName || ""
  );
  const [customSubject, setCustomSubject] = useState(
    initialData?.customSubject || ""
  );
  const [cycle, setCycle] = useState(
    initialData?.cycle || childrenList[0]?.cycle || "LYCEE"
  );
  const [customCycle, setCustomCycle] = useState(
    initialData?.customCycle || childrenList[0]?.customCycle || ""
  );
  const [gradeLevelName, setGradeLevelName] = useState(
    initialData?.gradeLevelName || childrenList[0]?.gradeLevel || ""
  );

  // Step 3: Mode & Location
  const [mode, setMode] = useState<"HOME" | "ONLINE" | "HYBRID">(
    initialData?.mode || "HOME"
  );
  const [city] = useState(initialData?.city || "Conakry");
  const [commune, setCommune] = useState(initialData?.commune || "Ratoma");
  const [neighborhood, setNeighborhood] = useState(
    initialData?.neighborhood || ""
  );
  const [locationAddress, setLocationAddress] = useState("");

  // Step 4: Rhythm, Schedule & Budget
  const [frequency, setFrequency] = useState(
    initialData?.frequency || "2_WEEKLY"
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(120);
  const [preferredSchedule, setPreferredSchedule] = useState(
    initialData?.preferredSchedule || ""
  );
  const [budgetGnf, setBudgetGnf] = useState<number | "">(
    initialData?.budgetGnf || 800000
  );
  const [budgetType, setBudgetType] = useState<"MONTHLY" | "HOURLY">(
    (initialData?.budgetType as any) || "MONTHLY"
  );
  const [learningGoals, setLearningGoals] = useState(
    initialData?.learningGoals || ""
  );
  const [notes] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Currently selected child
  const selectedStudent = childrenList.find((c) => c.id === selectedStudentId);

  // Automatically update academic level when child changes (if not editing an existing request)
  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    const child = childrenList.find((c) => c.id === id);
    if (child && !isEditing) {
      if (child.cycle) setCycle(child.cycle);
      if (child.customCycle) setCustomCycle(child.customCycle);
      if (child.gradeLevel) setGradeLevelName(child.gradeLevel);
      if (child.preferredSubjects && child.preferredSubjects.length > 0) {
        setSubjectName(child.preferredSubjects[0]);
      }
      if (child.customSubject) setCustomSubject(child.customSubject);
    }
  };

  // Check if user can advance to the next step
  const canAdvance = () => {
    if (currentStep === 1) {
      return Boolean(selectedStudentId && childrenList.length > 0);
    }
    if (currentStep === 2) {
      const finalSubject = subjectName === "Autre" ? customSubject : subjectName;
      if (!finalSubject.trim()) return false;
      if (cycle === "AUTRE" && (!customCycle.trim() || customCycle.trim().length < 2)) return false;
      return Boolean(gradeLevelName.trim());
    }
    if (currentStep === 3) {
      if (mode === "HOME") {
        return Boolean(commune.trim() || neighborhood.trim());
      }
      return true;
    }
    if (currentStep === 4) {
      return Boolean(budgetGnf && Number(budgetGnf) >= 50000);
    }
    return true;
  };

  // Step navigation with inline error feedback
  const handleNextStep = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!selectedStudentId) {
        setErrorMessage(
          locale === "en"
            ? "Please select a student for this request."
            : "Veuillez sélectionner un élève."
        );
        return;
      }
    }

    if (currentStep === 2) {
      if (!subjectName.trim()) {
        setErrorMessage(
          locale === "en"
            ? "Please select or specify a subject."
            : "Veuillez sélectionner ou renseigner une matière."
        );
        return;
      }
      if (
        subjectName === "Autre" &&
        (!customSubject.trim() || customSubject.trim().length < 2)
      ) {
        setErrorMessage(
          locale === "en"
            ? "Please specify the custom subject (at least 2 characters)."
            : "Veuillez préciser la matière ou formation personnalisée (au moins 2 caractères)."
        );
        return;
      }
      if (
        cycle === "AUTRE" &&
        (!customCycle.trim() || customCycle.trim().length < 2)
      ) {
        setErrorMessage(
          locale === "en"
            ? "Please specify the custom educational cycle."
            : "Veuillez préciser le cycle ou la formation spécifique."
        );
        return;
      }
      if (!gradeLevelName.trim()) {
        setErrorMessage(
          locale === "en"
            ? "Please indicate the grade level / class."
            : "Veuillez indiquer la classe ou le niveau scolaire."
        );
        return;
      }
    }

    if (currentStep === 3) {
      if (mode === "HOME" && !commune.trim() && !neighborhood.trim()) {
        setErrorMessage(
          locale === "en"
            ? "Please indicate the commune or neighborhood for in-home tutoring."
            : "Veuillez indiquer la commune ou le quartier pour les cours à domicile."
        );
        return;
      }
    }

    if (currentStep === 4) {
      if (!budgetGnf || Number(budgetGnf) < 50000) {
        setErrorMessage(
          locale === "en"
            ? "Budget must be at least 50,000 GNF."
            : "Le budget indiqué doit être d'au moins 50 000 GNF."
        );
        return;
      }
    }

    setCurrentStep((prev) => Math.min(5, prev + 1));
  };

  // Handle final submission: action = "publish" | "save_draft"
  const handleSubmit = async (action: "publish" | "save_draft") => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        action,
        studentId: selectedStudentId,
        subjectName: subjectName.trim(),
        customSubject:
          subjectName === "Autre" ? customSubject.trim() : null,
        cycle,
        customCycle: cycle === "AUTRE" ? customCycle.trim() : null,
        gradeLevelName: gradeLevelName.trim(),
        mode,
        city,
        commune: commune.trim() || null,
        neighborhood: neighborhood.trim() || null,
        locationAddress: locationAddress.trim() || null,
        frequency,
        sessionDurationMinutes: Number(sessionDurationMinutes),
        preferredSchedule: preferredSchedule.trim() || null,
        budgetGnf: Number(budgetGnf) || 800000,
        budgetType,
        learningGoals: learningGoals.trim() || null,
        notes: notes.trim() || null,
      };

      const url = isEditing
        ? `/api/parent/requests/${initialData!.id}`
        : "/api/parent/requests";
      const method = isEditing ? "PATCH" : "POST";

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
              ? "An error occurred while saving the request."
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Executive Navy Header with Stepper Indicator */}
        <div className="p-6 pb-4 bg-[#16385c] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isEditing
                    ? locale === "en"
                      ? "Edit Tutoring Request"
                      : "Modifier la Demande de Tutorat"
                    : locale === "en"
                    ? "Create Tutoring Request"
                    : "Créer une Demande de Tutorat"}
                </h2>
                <p className="text-xs text-white/70">
                  {locale === "en"
                    ? "Find a certified private teacher in Guinea • Monsieur Fanyi"
                    : "Trouvez un professeur certifié en Guinée • Monsieur Fanyi"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper pills */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-[10px] sm:text-xs">
            {[
              { id: 1, label: locale === "en" ? "1. Student" : "1. Élève" },
              { id: 2, label: locale === "en" ? "2. Subject" : "2. Matière" },
              { id: 3, label: locale === "en" ? "3. Format" : "3. Format" },
              { id: 4, label: locale === "en" ? "4. Terms" : "4. Modalités" },
              { id: 5, label: locale === "en" ? "5. Validation" : "5. Validation" },
            ].map((s) => (
              <div
                key={s.id}
                className={`py-1.5 px-1 sm:px-2 rounded-lg text-center font-semibold transition-all truncate ${
                  currentStep === s.id
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : currentStep > s.id
                    ? "bg-white/20 text-white"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {s.label}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Choisir l'élève */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#16385c]" />
                  <span>
                    {locale === "en"
                      ? "Select one of your registered children *"
                      : "Sélectionnez l'enfant pour lequel vous créez cette demande *"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "You can create separate tutoring requests for different subjects for the same child."
                    : "Vous pouvez créer plusieurs demandes indépendantes pour le même enfant (ex: Maths et Anglais)."}
                </p>
              </div>

              {childrenList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-3">
                  <User className="w-8 h-8 text-amber-600 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-amber-950">
                      {locale === "en"
                        ? "No children registered yet"
                        : "Aucun enfant enregistré"}
                    </h4>
                    <p className="text-xs text-amber-800">
                      {locale === "en"
                        ? "Please register your child's profile first before creating a tutoring request."
                        : "Veuillez d'abord enregistrer la fiche de votre enfant avant de publier une demande."}
                    </p>
                  </div>
                  <Link
                    href="/parent/children"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16385c] text-white text-xs font-bold shadow-xs hover:bg-[#10243d] transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{locale === "en" ? "Register a Child" : "Ajouter un enfant"}</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {childrenList.map((child) => {
                      const isSelected = selectedStudentId === child.id;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleStudentChange(child.id)}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-[#16385c] bg-[#16385c]/5 ring-2 ring-[#16385c] shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16385c] to-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                              {child.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-slate-800 block">
                                {child.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {child.gradeLevel} {child.cycle ? `• ${child.cycle}` : ""}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                              isSelected
                                ? "bg-[#16385c] border-[#16385c] text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="text-slate-500">
                      {locale === "en" ? "Need to add another child?" : "Besoin d'ajouter un autre enfant ?"}
                    </span>
                    <Link
                      href="/parent/children"
                      className="inline-flex items-center gap-1 font-semibold text-[#16385c] hover:underline"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{locale === "en" ? "Register child profile" : "Ajouter un profil enfant"}</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Matière et Niveau */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#16385c]" />
                  <span>{locale === "en" ? "Subject and Educational Level" : "Matière et Niveau Scolaire"}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Choose the teaching discipline and academic level for this support request."
                    : "Sélectionnez la matière et le cycle d'études correspondant aux objectifs de l'élève."}
                </p>
              </div>

              {/* Subject Selector */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <SubjectSelector
                  selectedSubjects={subjectName ? [subjectName] : []}
                  onChange={(subs) => {
                    const chosen = subs[subs.length - 1] || "";
                    setSubjectName(chosen);
                  }}
                  customSubject={customSubject}
                  onCustomSubjectChange={setCustomSubject}
                  availableSubjects={availableSubjects}
                />
              </div>

              {/* Educational Level & Cycle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <EducationLevelSelect
                  selectedCycle={cycle}
                  onCycleChange={setCycle}
                  customCycle={customCycle}
                  onCustomCycleChange={setCustomCycle}
                  selectedGradeLevel={gradeLevelName}
                  onGradeLevelChange={setGradeLevelName}
                  gradeLevels={gradeLevels}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Format & Localisation */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#16385c]" />
                  <span>{locale === "en" ? "Teaching Format & Location" : "Format et Localisation"}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Specify whether the tutor should travel to your home or teach via video conference."
                    : "Précisez si l'enseignant intervient à votre domicile ou anime les cours à distance en visio."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("HOME")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    mode === "HOME"
                      ? "border-[#16385c] bg-[#16385c]/5 ring-2 ring-[#16385c] shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-slate-900">
                      {locale === "en" ? "In-Home Tutoring" : "À domicile"}
                    </span>
                    <Home className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {locale === "en"
                      ? "The tutor travels directly to your home in Conakry."
                      : "Le professeur certifié se déplace directement à votre domicile à Conakry."}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("ONLINE")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    mode === "ONLINE"
                      ? "border-[#16385c] bg-[#16385c]/5 ring-2 ring-[#16385c] shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-slate-900">
                      {locale === "en" ? "Online Lesson" : "En ligne (Visio)"}
                    </span>
                    <Laptop className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {locale === "en"
                      ? "Interactive video conference via digital classroom."
                      : "Séances interactives à distance avec tableau virtuel partagé."}
                  </p>
                </button>
              </div>

              {/* Geographical details if HOME tutoring */}
              {mode === "HOME" && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {locale === "en" ? "Commune / Area *" : "Commune principale (Guinée) *"}
                      </label>
                      <select
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                      >
                        {CONAKRY_COMMUNES.map((com) => (
                          <option key={com} value={com}>
                            {com}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {locale === "en" ? "Neighborhood" : "Quartier indicatif"}
                      </label>
                      <input
                        type="text"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        placeholder="ex: Kipé Centre Émetteur, Lambanyi..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {locale === "en" ? "Precise Home Address" : "Adresse précise du domicile"}
                      </label>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{locale === "en" ? "Confidential" : "Confidentiel"}</span>
                      </span>
                    </div>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="ex: Immeuble Diallo 2ème étage, face Pharmacie..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {locale === "en"
                        ? "Your exact street address is never shown publicly in marketplace searches."
                        : "L'adresse exacte n'est jamais divulguée dans les listes publiques de recherche."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Rythme, Horaires & Budget */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#16385c]" />
                  <span>{locale === "en" ? "Schedule, Rhythm & Indicative Budget" : "Rythme, Horaires & Budget"}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Set weekly frequency, preferred time slots, and your target budget."
                    : "Indiquez la fréquence hebdomadaire, les créneaux privilégiés et votre budget indicatif."}
                </p>
              </div>

              {/* Weekly Frequency */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {locale === "en" ? "Desired Weekly Rhythm *" : "Rythme des cours souhaité *"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FREQUENCY_OPTIONS.map((f) => {
                    const isSelected = frequency === f.value;
                    return (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFrequency(f.value)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer text-xs font-semibold flex items-center justify-between ${
                          isSelected
                            ? "border-[#16385c] bg-[#16385c]/5 text-[#16385c] ring-1 ring-[#16385c]"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{locale === "en" ? f.labelEn : f.labelFr}</span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "bg-[#16385c] border-[#16385c] text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session Duration & Preferred Schedule */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en" ? "Session Duration" : "Durée par séance"}
                  </label>
                  <select
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  >
                    <option value={90}>1h 30m (90 min)</option>
                    <option value={120}>2h 00m (120 min — Recommandé)</option>
                    <option value={150}>2h 30m (150 min)</option>
                    <option value={180}>3h 00m (180 min)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en" ? "Preferred Schedule / Days" : "Créneaux ou jours préférés"}
                  </label>
                  <input
                    type="text"
                    value={preferredSchedule}
                    onChange={(e) => setPreferredSchedule(e.target.value)}
                    placeholder="ex: Mardi & Jeudi après 16h30, Samedi matin"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  />
                </div>
              </div>

              {/* Target Budget & Pricing Basis */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {locale === "en" ? "Target Budget (GNF) *" : "Budget indicatif (GNF) *"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="50000"
                        min="50000"
                        value={budgetGnf}
                        onChange={(e) =>
                          setBudgetGnf(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full pl-3 pr-14 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                      />
                      <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">
                        GNF
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {formatGnf(Number(budgetGnf) || 0)} GNF
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {locale === "en" ? "Pricing Basis *" : "Base tarifaire *"}
                    </label>
                    <select
                      value={budgetType}
                      onChange={(e) => setBudgetType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                    >
                      <option value="MONTHLY">
                        {locale === "en" ? "Monthly Package (Recommended)" : "Forfait Mensuel (Recommandé)"}
                      </option>
                      <option value="HOURLY">
                        {locale === "en" ? "Hourly Rate" : "Taux horaire"}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Learning Goals */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {locale === "en"
                    ? "Learning Goals & Key Priorities"
                    : "Besoins pédagogiques & Objectifs prioritaires"}
                </label>
                <textarea
                  rows={3}
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  placeholder={
                    locale === "en"
                      ? "e.g., Preparation for Baccalaureate exam, help with differential calculus, strengthening grammar..."
                      : "ex: Préparation intensive du Bac Unique SM, remise à niveau en calcul vectoriel, exercices types..."
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Vérification & Validation */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {locale === "en"
                      ? "Review & Confirm Tutoring Request"
                      : "Vérification et Confirmation de la Demande"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Verify all details before publishing to certified teachers or saving as a draft."
                    : "Relisez les éléments de votre demande avant de la publier ou de l'enregistrer en brouillon."}
                </p>
              </div>

              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span className="font-bold text-sm text-[#16385c]">
                      {locale === "en" ? "Tutoring Request Summary" : "Récapitulatif de votre demande"}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {locale === "en" ? "Ready to publish" : "Prête pour publication"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {locale === "en" ? "Student" : "Élève"}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {selectedStudent?.fullName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <BookOpen className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {locale === "en" ? "Subject & Level" : "Matière & Niveau"}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {subjectName === "Autre" && customSubject
                          ? `Autre (${customSubject})`
                          : subjectName}
                        {" • "}
                        {gradeLevelName} {cycle === "AUTRE" && customCycle ? `(${customCycle})` : `(${cycle})`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {locale === "en" ? "Format & Location" : "Format & Lieu"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {mode === "HOME"
                          ? `${locale === "en" ? "In-Home" : "À domicile"} (${commune}${neighborhood ? ` - ${neighborhood}` : ""})`
                          : locale === "en"
                          ? "Online Lesson (Visio)"
                          : "En ligne (Visioconférence)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {locale === "en" ? "Rhythm & Duration" : "Rythme & Durée"}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {frequency} • {sessionDurationMinutes} min / séance
                      </span>
                      {preferredSchedule && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {preferredSchedule}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:col-span-2">
                    <Wallet className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {locale === "en" ? "Indicative Budget" : "Budget indicatif"}
                      </span>
                      <span className="font-extrabold text-emerald-700 text-base">
                        {formatGnf(Number(budgetGnf) || 0)} GNF
                        <span className="text-xs font-semibold text-slate-500 ml-1">
                          ({budgetType === "HOURLY" ? (locale === "en" ? "per hour" : "par heure") : (locale === "en" ? "monthly package" : "par mois")})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {learningGoals && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      {locale === "en" ? "Learning Goals & Objectives" : "Objectifs pédagogiques prioritaires"}
                    </span>
                    <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-200">
                      "{learningGoals}"
                    </p>
                  </div>
                )}
              </div>

              {/* Monsieur Fanyi Guarantee */}
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-blue-950 mb-0.5">
                    {locale === "en" ? "Monsieur Fanyi Quality & Safety Guarantee" : "Garantie Pédagogique Monsieur Fanyi :"}
                  </span>
                  <span>
                    {locale === "en"
                      ? "Your request will be notified to verified teachers meeting your criteria. You review tutor profiles, credentials, and proposed rates before approving any class."
                      : "Dès publication, les enseignants certifiés correspondant à vos critères seront informés. Vous pourrez examiner leurs dossiers, diplômes et tarifs avant toute confirmation."}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (currentStep > 1) setCurrentStep((prev) => prev - 1);
              else onCancel();
            }}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {currentStep > 1 ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>{locale === "en" ? "Previous" : "Précédent"}</span>
              </>
            ) : (
              <span>{locale === "en" ? "Cancel" : "Annuler"}</span>
            )}
          </button>

          {currentStep < 5 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit("save_draft")}
                disabled={isSubmitting || childrenList.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === "en" ? "Save Draft" : "Enregistrer brouillon"}</span>
              </button>

              <button
                type="button"
                disabled={!canAdvance() || isSubmitting}
                onClick={handleNextStep}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#204e7d] disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                <span>{locale === "en" ? "Next" : "Suivant"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSubmit("save_draft")}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === "en" ? "Keep as Draft" : "Garder en brouillon"}</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit("publish")}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{locale === "en" ? "Publishing..." : "Publication..."}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{locale === "en" ? "Publish Tutoring Request" : "Publier la demande de cours"}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
