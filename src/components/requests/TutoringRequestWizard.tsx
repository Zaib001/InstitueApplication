"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  Loader2,
  Check,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  User,
  BookOpen,
  MapPin,
  Calendar,
  Clock,
  Coins,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Home,
  Laptop,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { RequestCardData } from "./RequestCard";
import {
  FREQUENCY_OPTIONS,
  CONAKRY_COMMUNES,
} from "@/lib/validation/tutoring-request";
import { EducationLevelSelect } from "@/components/parent/EducationLevelSelect";
import { SubjectSelector } from "@/components/parent/SubjectSelector";

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

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedStudentId, setSelectedStudentId] = useState(
    initialData?.student?.id || defaultStudentId || childrenList[0]?.id || ""
  );

  // Subject & Level
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

  // Mode & Location
  const [mode, setMode] = useState<"HOME" | "ONLINE" | "HYBRID">(
    initialData?.mode || "HOME"
  );
  const [city, setCity] = useState(initialData?.city || "Conakry");
  const [commune, setCommune] = useState(initialData?.commune || "Ratoma");
  const [neighborhood, setNeighborhood] = useState(
    initialData?.neighborhood || ""
  );
  const [locationAddress, setLocationAddress] = useState(
    // We do not overwrite with null
    ""
  );

  // Frequency & Schedule
  const [frequency, setFrequency] = useState(
    initialData?.frequency || "2_WEEKLY"
  );
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(120);
  const [preferredSchedule, setPreferredSchedule] = useState(
    initialData?.preferredSchedule || ""
  );

  // Budget & Objectives
  const [budgetGnf, setBudgetGnf] = useState<number | "">(
    initialData?.budgetGnf || 800000
  );
  const [budgetType, setBudgetType] = useState<"MONTHLY" | "HOURLY">(
    (initialData?.budgetType as any) || "MONTHLY"
  );
  const [learningGoals, setLearningGoals] = useState(
    initialData?.learningGoals || ""
  );
  const [notes, setNotes] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected student entity
  const selectedStudent = childrenList.find((c) => c.id === selectedStudentId);

  // Automatically update academic level when student changes (if not editing)
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

  // Step Validation before proceeding
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

    if (currentStep === 5) {
      if (!budgetGnf || Number(budgetGnf) < 50000) {
        setErrorMessage(
          locale === "en"
            ? "Budget must be at least 50,000 GNF."
            : "Le budget indiqué doit être d'au moins 50 000 GNF."
        );
        return;
      }
    }

    setCurrentStep((prev) => Math.min(6, prev + 1));
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
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-800 font-heading">
              {isEditing
                ? locale === "en"
                  ? "Edit Tutoring Request"
                  : "Modifier la demande de tutorat"
                : locale === "en"
                ? "Create a Tutoring Request"
                : "Créer une nouvelle demande de tutorat"}
            </h2>
            <p className="text-xs text-slate-400">
              {locale === "en"
                ? "Specify your educational requirements to match with certified tutors in Guinea."
                : "Définissez vos besoins pour trouver le bon professeur au bon moment."}
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

        {/* Stepper Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>
              {locale === "en" ? `Step ${currentStep} of 6:` : `Étape ${currentStep} sur 6 :`}
            </span>
            <span className="text-blue-700">
              {currentStep === 1 && (locale === "en" ? "Select Student" : "Choisir l'élève")}
              {currentStep === 2 && (locale === "en" ? "Subject & Grade" : "Matière & Niveau")}
              {currentStep === 3 && (locale === "en" ? "Format & Location" : "Format & Lieu")}
              {currentStep === 4 && (locale === "en" ? "Frequency & Availability" : "Fréquence & Horaires")}
              {currentStep === 5 && (locale === "en" ? "Budget & Objectives" : "Budget & Objectifs")}
              {currentStep === 6 && (locale === "en" ? "Review & Publish" : "Vérification & Publication")}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-full rounded-full transition-all duration-300 ${
                  s <= currentStep ? "bg-[#16385c]" : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Choisir l'élève */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                {locale === "en"
                  ? "Select one of your registered children *"
                  : "Sélectionnez l'enfant pour lequel vous créez cette demande *"}
              </label>
              <p className="text-xs text-slate-500 mb-3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {childrenList.map((child) => {
                  const isSelected = selectedStudentId === child.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => handleStudentChange(child.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
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
                          <span className="text-[11px] text-slate-400 block">
                            {child.gradeLevel}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
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
            )}
          </div>
        )}

        {/* STEP 2: Matière et formation */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Subject Selector */}
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

            {/* Educational Level & Cycle */}
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
        )}

        {/* STEP 3: Format & Localisation */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              {locale === "en" ? "Teaching Format *" : "Mode d'enseignement souhaité *"}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("HOME")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  mode === "HOME"
                    ? "border-[#16385c] bg-[#16385c]/5 ring-2 ring-[#16385c] shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-slate-800">
                    {locale === "en" ? "In-Home Tutoring" : "À domicile"}
                  </span>
                  <Home className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-400">
                  {locale === "en"
                    ? "The tutor travels directly to your home."
                    : "Le professeur se déplace chez vous à Conakry."}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("ONLINE")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  mode === "ONLINE"
                    ? "border-[#16385c] bg-[#16385c]/5 ring-2 ring-[#16385c] shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-slate-800">
                    {locale === "en" ? "Online Lesson" : "En ligne (Visio)"}
                  </span>
                  <Laptop className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-[11px] text-slate-400">
                  {locale === "en"
                    ? "Interactive video conference via classroom tools."
                    : "Cours en visioconférence interactive sécurisée."}
                </p>
              </button>
            </div>

            {/* Geographical details if HOME tutoring */}
            {mode === "HOME" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 pt-3">
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

        {/* STEP 4: Fréquence & Horaires */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
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
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer text-xs font-medium ${
                        isSelected
                          ? "border-[#16385c] bg-[#16385c]/5 text-[#16385c] font-bold ring-1 ring-[#16385c]"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {locale === "en" ? f.labelEn : f.labelFr}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
          </div>
        )}

        {/* STEP 5: Budget & Objectifs */}
        {currentStep === 5 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {locale === "en" ? "Target Budget (GNF) *" : "Budget indicatif (GNF) *"}
                </label>
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  value={budgetGnf}
                  onChange={(e) =>
                    setBudgetGnf(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {locale === "en" ? "Pricing Basis *" : "Base tarifaire *"}
                </label>
                <select
                  value={budgetType}
                  onChange={(e) => setBudgetType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                >
                  <option value="MONTHLY">
                    {locale === "en" ? "Monthly Package (8-12 sessions)" : "Forfait Mensuel (Recommandé)"}
                  </option>
                  <option value="HOURLY">
                    {locale === "en" ? "Hourly Rate" : "Taux horaire"}
                  </option>
                </select>
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

        {/* STEP 6: Vérification & Publication */}
        {currentStep === 6 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-sm text-[#16385c]">
                  {locale === "en" ? "Summary of Request" : "Récapitulatif de votre demande"}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                  {locale === "en" ? "Ready" : "Prête"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {locale === "en" ? "Student" : "Élève"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedStudent?.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {locale === "en" ? "Subject" : "Matière"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {subjectName === "Autre" && customSubject
                      ? `Autre (${customSubject})`
                      : subjectName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {locale === "en" ? "Level / Cycle" : "Niveau / Cycle"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {gradeLevelName}{" "}
                    {cycle === "AUTRE" && customCycle ? `(${customCycle})` : `(${cycle})`}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {locale === "en" ? "Format & Location" : "Format & Lieu"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {mode === "HOME"
                      ? `${locale === "en" ? "In-Home" : "À domicile"} (${commune})`
                      : locale === "en"
                      ? "Online (Visio)"
                      : "En ligne"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {locale === "en" ? "Frequency" : "Rythme"}
                  </span>
                  <span className="font-bold text-slate-800">
                    {frequency}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    {locale === "en" ? "Budget (GNF)" : "Budget indicatif"}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {new Intl.NumberFormat("fr-GN").format(Number(budgetGnf))} GNF (
                    {budgetType === "HOURLY" ? "Heure" : "Mois"})
                  </span>
                </div>
              </div>

              {learningGoals && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                    {locale === "en" ? "Learning Goals" : "Objectifs"}
                  </span>
                  <p className="text-xs text-slate-700 italic">
                    "{learningGoals}"
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <span className="font-bold block mb-0.5">
                {locale === "en" ? "Direct Match Guarantee:" : "Garantie Monsieur Fanyi :"}
              </span>
              {locale === "en"
                ? "Once published, your request will be visible to verified tutors who meet your criteria. You will review applications before selecting your teacher."
                : "Dès sa publication, votre demande sera accessible aux enseignants vérifiés correspondant à vos critères. Vous pourrez comparer les candidatures avant de choisir."}
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{locale === "en" ? "Back" : "Précédent"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {currentStep < 6 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit("save_draft")}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>{locale === "en" ? "Save Draft" : "Enregistrer brouillon"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={childrenList.length === 0}
                  className="px-5 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-bold transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <span>{locale === "en" ? "Continue" : "Continuer"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit("save_draft")}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span>{locale === "en" ? "Keep as Draft" : "Garder en brouillon"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("publish")}
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{locale === "en" ? "Publish Request" : "Publier la demande"}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
