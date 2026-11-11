"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  UserCheck,
  UserPlus,
  GraduationCap,
  BookOpen,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  Copy,
  Check,
  Sparkles,
  Award,
  Wallet,
  Home,
  Laptop,
} from "lucide-react";
import { TutoringMode } from "@prisma/client";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";

interface AdminAssignmentWizardProps {
  onSuccess: (classroom: any) => void;
  onClose: () => void;
}

interface ParentItem {
  userId: string;
  parentProfileId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  city: string;
  address?: string | null;
  isAssistedRegistration?: boolean;
  children: Array<{
    id: string;
    fullName: string;
    gradeLevel: string;
    cycle?: string | null;
    schoolName?: string | null;
  }>;
}

interface TeacherItem {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsOfExperience: number;
  city: string;
  serviceArea?: string | null;
  degrees?: string | null;
  institution?: string | null;
  isHomeAvailable?: boolean;
  isOnlineAvailable?: boolean;
  hourlyRateGnf?: number | null;
  monthlyPackageRateGnf?: number | null;
  subjects: string[];
  gradeLevels: string[];
  cycles?: string[];
  customSubject?: string | null;
  customGradeLevel?: string | null;
  availabilities?: Array<{
    id: string;
    dayOfWeek: number;
    dayName: string;
    startTime: string;
    endTime: string;
    isRecurring?: boolean;
  }>;
  ratingAverage?: number | null;
  ratingsCount?: number;
  relevanceScore?: number;
  matchBadge?: "EXACT" | "SUBJECT_AND_LEVEL" | "SUBJECT_ONLY" | "COMPATIBLE";
  matchReasons?: string[];
}

const COMMON_SUBJECTS = [
  "Mathématiques",
  "Physique-Chimie",
  "Français",
  "Anglais",
  "Sciences de la Vie et de la Terre (SVT)",
  "Philosophie",
  "Histoire-Géographie",
  "Économie",
  "Informatique",
  "Autre matière",
];

const CONAKRY_COMMUNES = [
  "Kaloum",
  "Dixinn",
  "Matam",
  "Ratoma",
  "Matoto",
  "Autre / Périphérie",
];

export function AdminAssignmentWizard({
  onSuccess,
  onClose,
}: AdminAssignmentWizardProps) {
  const { locale } = useTranslation();

  // Wizard Step (1 to 5)
  const [step, setStep] = useState<number>(1);

  // Step 1: Parent & Student
  const [parentMode, setParentMode] = useState<"search" | "register">("search");
  const [parentSearchQuery, setParentSearchQuery] = useState("");
  const [parentsList, setParentsList] = useState<ParentItem[]>([]);
  const [isSearchingParents, setIsSearchingParents] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentItem | null>(null);

  // Assisted Parent Registration Form
  const [newParentName, setNewParentName] = useState("");
  const [newParentPhone, setNewParentPhone] = useState("");
  const [newParentEmail, setNewParentEmail] = useState("");
  const [newParentAddress, setNewParentAddress] = useState("");
  const [newParentCommune, setNewParentCommune] = useState("Ratoma");
  const [isRegisteringParent, setIsRegisteringParent] = useState(false);
  const [generatedActivationLink, setGeneratedActivationLink] = useState<string | null>(null);
  const [hasCopiedLink, setHasCopiedLink] = useState(false);

  // Student selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState("Terminale");
  const [newStudentCycle, setNewStudentCycle] = useState("LYCEE");
  const [newStudentSchool, setNewStudentSchool] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Step 2: Subject & Format
  const [subjectName, setSubjectName] = useState("Mathématiques");
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [mode, setMode] = useState<TutoringMode>(TutoringMode.HOME);
  const [commune, setCommune] = useState("Ratoma");
  const [locationAddress, setLocationAddress] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("2 séances par semaine (2h)");

  // Step 3: Approved Teacher Selection & Filters
  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherFilterSubject, setTeacherFilterSubject] = useState("");
  const [teacherFilterCycle, setTeacherFilterCycle] = useState("TOUS");
  const [teacherFilterMode, setTeacherFilterMode] = useState<"TOUS" | "HOME" | "ONLINE">("TOUS");
  const [teacherFilterCommune, setTeacherFilterCommune] = useState("TOUS");
  const [teachersList, setTeachersList] = useState<TeacherItem[]>([]);
  const [isSearchingTeachers, setIsSearchingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null);

  // Sync Step 2 values to Step 3 filters when step becomes 3
  useEffect(() => {
    if (step === 3) {
      const activeSub = subjectName === "Autre matière" ? customSubjectName : subjectName;
      setTeacherFilterSubject(activeSub);
      setTeacherFilterMode(mode === TutoringMode.HOME ? "HOME" : mode === TutoringMode.ONLINE ? "ONLINE" : "TOUS");
      setTeacherFilterCommune(commune || "TOUS");
      const currentChild = selectedParent?.children.find((c) => c.id === selectedStudentId);
      if (currentChild?.cycle) {
        setTeacherFilterCycle(currentChild.cycle);
      }
    }
  }, [step]);

  // Search Approved Teachers effect with deterministic matching
  useEffect(() => {
    if (step !== 3) return;
    let active = true;
    const fetchTeachers = async () => {
      setIsSearchingTeachers(true);
      try {
        const params = new URLSearchParams();
        if (teacherSearchQuery.trim()) {
          params.set("q", teacherSearchQuery.trim());
        }
        if (teacherFilterSubject.trim() && teacherFilterSubject !== "TOUS") {
          params.set("subject", teacherFilterSubject.trim());
        }
        if (teacherFilterCycle && teacherFilterCycle !== "TOUS") {
          params.set("cycle", teacherFilterCycle);
        }
        if (teacherFilterMode && teacherFilterMode !== "TOUS") {
          params.set("mode", teacherFilterMode);
        }
        if (teacherFilterCommune && teacherFilterCommune !== "TOUS") {
          params.set("commune", teacherFilterCommune);
        }

        const res = await fetch(`/api/admin/teachers/search?${params.toString()}`);
        const data = await res.json();
        if (active && data.teachers) {
          setTeachersList(data.teachers);
        }
      } catch {
        // silent error
      } finally {
        if (active) setIsSearchingTeachers(false);
      }
    };

    const timer = setTimeout(fetchTeachers, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    step,
    teacherSearchQuery,
    teacherFilterSubject,
    teacherFilterCycle,
    teacherFilterMode,
    teacherFilterCommune,
  ]);

  // Step 4: Pricing & Source
  const [rateType, setRateType] = useState<"MONTHLY" | "HOURLY">("MONTHLY");
  const [monthlyRateGnf, setMonthlyRateGnf] = useState<number>(800000);
  const [hourlyRateGnf, setHourlyRateGnf] = useState<number>(50000);
  const [sessionsCount, setSessionsCount] = useState<number>(8);
  const [minutesPerSession, setMinutesPerSession] = useState<number>(60);
  const [assignmentSource, setAssignmentSource] = useState<string>("PHONE_INQUIRY");
  const [adminNotes, setAdminNotes] = useState<string>("");

  // Submitting final assignment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search Parents effect
  useEffect(() => {
    let active = true;
    const fetchParents = async () => {
      setIsSearchingParents(true);
      try {
        const res = await fetch(`/api/admin/parents/search?q=${encodeURIComponent(parentSearchQuery)}`);
        const data = await res.json();
        if (active && data.parents) {
          setParentsList(data.parents);
        }
      } catch {
        // silent error
      } finally {
        if (active) setIsSearchingParents(false);
      }
    };

    const timer = setTimeout(fetchParents, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [parentSearchQuery]);

  // Handle Assisted Parent Registration
  const handleRegisterParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newParentName.trim() || !newParentPhone.trim()) {
      setError("Le nom complet et le numéro de téléphone sont obligatoires.");
      return;
    }

    setIsRegisteringParent(true);
    try {
      const res = await fetch("/api/admin/parents/assisted-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newParentName.trim(),
          phoneNumber: newParentPhone.trim(),
          email: newParentEmail.trim() || undefined,
          address: newParentAddress.trim() || undefined,
          city: "Conakry",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'enregistrer le parent");
        setIsRegisteringParent(false);
        return;
      }

      const createdParent: ParentItem = {
        userId: data.parent.userId,
        parentProfileId: data.parent.parentProfileId,
        fullName: data.parent.fullName,
        email: data.parent.email,
        phoneNumber: data.parent.phoneNumber,
        city: data.parent.city,
        address: data.parent.address,
        isAssistedRegistration: true,
        children: [],
      };

      setSelectedParent(createdParent);
      setGeneratedActivationLink(
        `${window.location.origin}${data.activationUrl}`
      );
      setParentMode("search");
    } catch {
      setError("Erreur de communication avec le serveur");
    } finally {
      setIsRegisteringParent(false);
    }
  };

  // Handle Adding Student to Parent
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent) return;
    setError(null);

    if (!newStudentName.trim() || !newStudentGrade.trim()) {
      setError("Le nom et la classe de l'élève sont obligatoires.");
      return;
    }

    setIsAddingStudent(true);
    try {
      const res = await fetch(`/api/admin/parents/${selectedParent.parentProfileId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newStudentName.trim(),
          gradeLevel: newStudentGrade.trim(),
          cycle: newStudentCycle,
          schoolName: newStudentSchool.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible d'ajouter l'élève");
        setIsAddingStudent(false);
        return;
      }

      const updatedChildren = [...selectedParent.children, data.student];
      setSelectedParent({
        ...selectedParent,
        children: updatedChildren,
      });
      setSelectedStudentId(data.student.id);
      setShowAddStudentForm(false);
      setNewStudentName("");
    } catch {
      setError("Erreur lors de l'ajout de l'élève");
    } finally {
      setIsAddingStudent(false);
    }
  };

  // Handle Final Assignment Submission
  const handleSubmitAssignment = async () => {
    if (!selectedParent || !selectedStudentId || !selectedTeacher) {
      setError("Veuillez compléter toutes les étapes requises.");
      return;
    }

    const finalSubject = subjectName === "Autre matière" ? customSubjectName : subjectName;
    if (!finalSubject.trim()) {
      setError("Veuillez préciser la matière.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedStudent = selectedParent.children.find((c) => c.id === selectedStudentId);

      const payload = {
        parentProfileId: selectedParent.parentProfileId,
        studentId: selectedStudentId,
        teacherProfileId: selectedTeacher.id,
        subjectName: finalSubject.trim(),
        mode,
        gradeLevelName: selectedStudent?.gradeLevel,
        cycle: selectedStudent?.cycle,
        monthlyRateGnf: rateType === "MONTHLY" ? Number(monthlyRateGnf) : null,
        hourlyRateGnf: rateType === "HOURLY" ? Number(hourlyRateGnf) : null,
        sessionsCount: Number(sessionsCount),
        minutesPerSession: Number(minutesPerSession),
        assignmentSource,
        adminNotes: adminNotes.trim() || null,
        city: "Conakry",
        commune,
        locationAddress: locationAddress.trim() || null,
        preferredSchedule: preferredSchedule.trim() || null,
      };

      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de finaliser l'affectation directe");
        setIsSubmitting(false);
        return;
      }

      onSuccess(data.classroom);
    } catch {
      setError("Erreur de connexion au serveur");
      setIsSubmitting(false);
    }
  };

  // Validation before advancing step
  const canAdvance = () => {
    if (step === 1) {
      return !!selectedParent && !!selectedStudentId;
    }
    if (step === 2) {
      const sub = subjectName === "Autre matière" ? customSubjectName : subjectName;
      return !!sub.trim();
    }
    if (step === 3) {
      return !!selectedTeacher;
    }
    if (step === 4) {
      return (
        (rateType === "MONTHLY" && monthlyRateGnf > 0) ||
        (rateType === "HOURLY" && hourlyRateGnf > 0)
      );
    }
    return true;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Step Indicator */}
        <div className="p-6 pb-4 bg-[#16385c] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {locale === "en" ? "Administrator-Assisted Direct Assignment" : "Affectation Directe Administrateur"}
                </h2>
                <p className="text-xs text-white/70">
                  {locale === "en"
                    ? "Phone inquiry & walk-in family direct matching wizard"
                    : "Assistance téléphonique et accueil physique • Monsieur Fanyi"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper pills */}
          <div className="grid grid-cols-5 gap-1 sm:gap-2 text-[10px] sm:text-xs">
            {[
              { id: 1, label: locale === "en" ? "1. Family" : "1. Famille" },
              { id: 2, label: locale === "en" ? "2. Subject" : "2. Matière" },
              { id: 3, label: locale === "en" ? "3. Tutor" : "3. Tuteur" },
              { id: 4, label: locale === "en" ? "4. Terms" : "4. Tarifs" },
              { id: 5, label: locale === "en" ? "5. Confirm" : "5. Validation" },
            ].map((s) => (
              <div
                key={s.id}
                className={`py-1.5 px-1 sm:px-2 rounded-lg text-center font-semibold transition-all truncate ${
                  step === s.id
                    ? "bg-amber-500 text-white shadow-xs font-bold"
                    : step > s.id
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
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: PARENT & STUDENT */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Assisted Parent Activation Link Alert (if recently registered) */}
              {generatedActivationLink && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Compte parent assisté créé avec succès !</span>
                  </div>
                  <p className="text-emerald-700">
                    Pour respecter la sécurité sans mot de passe en clair, transmettez ce lien d&apos;activation sécurisé au parent (SMS ou WhatsApp) :
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedActivationLink}
                      className="flex-1 bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedActivationLink);
                        setHasCopiedLink(true);
                        setTimeout(() => setHasCopiedLink(false), 3000);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      {hasCopiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{hasCopiedLink ? "Copié !" : "Copier"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mode switch: Search existing vs Assisted register */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setParentMode("search")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    parentMode === "search"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Rechercher un parent existant
                </button>
                <button
                  type="button"
                  onClick={() => setParentMode("register")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    parentMode === "register"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  + Inscription assistée (Appel téléphonique)
                </button>
              </div>

              {parentMode === "search" ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={parentSearchQuery}
                      onChange={(e) => setParentSearchQuery(e.target.value)}
                      placeholder="Rechercher par nom, téléphone (+224...) ou email..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#16385c] outline-hidden"
                    />
                  </div>

                  {isSearchingParents ? (
                    <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recherche des comptes parents...</span>
                    </div>
                  ) : parentsList.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                      Aucun parent trouvé. Utilisez l&apos;onglet &laquo; Inscription assistée &raquo; ci-dessus pour enregistrer cette famille.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-100 rounded-xl p-1">
                      {parentsList.map((p) => {
                        const isSelected = selectedParent?.parentProfileId === p.parentProfileId;
                        return (
                          <div
                            key={p.parentProfileId}
                            onClick={() => {
                              setSelectedParent(p);
                              setSelectedStudentId(p.children[0]?.id || "");
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? "bg-blue-50/70 border-[#16385c] ring-1 ring-[#16385c]"
                                : "bg-white border-slate-100 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800 text-xs block">
                                  {p.fullName}
                                </span>
                                <span className="text-[11px] text-slate-500">
                                  {p.phoneNumber || p.email} • {p.city}
                                </span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                {p.children.length} élève(s)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Assisted Registration Form */
                <form onSubmit={handleRegisterParent} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Création assistée du compte parent (Appel / Visite)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Nom complet du parent *
                      </label>
                      <input
                        type="text"
                        required
                        value={newParentName}
                        onChange={(e) => setNewParentName(e.target.value)}
                        placeholder="Ex: M. Mamadou Diallo"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Numéro de téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={newParentPhone}
                        onChange={(e) => setNewParentPhone(e.target.value)}
                        placeholder="Ex: 622 12 34 56"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Adresse email (optionnelle)
                      </label>
                      <input
                        type="email"
                        value={newParentEmail}
                        onChange={(e) => setNewParentEmail(e.target.value)}
                        placeholder="parent@example.com (laisser vide si inconnu)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        Commune
                      </label>
                      <select
                        value={newParentCommune}
                        onChange={(e) => setNewParentCommune(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white outline-hidden"
                      >
                        {CONAKRY_COMMUNES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isRegisteringParent}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#204e7d] transition-colors"
                    >
                      {isRegisteringParent ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Enregistrement...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Créer le compte parent</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Student Selection for the selected parent */}
              {selectedParent && (
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        Élève(s) associés à {selectedParent.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Sélectionnez l&apos;élève qui bénéficiera de cette affectation
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                      className="text-xs font-semibold text-[#16385c] hover:underline"
                    >
                      {showAddStudentForm ? "Annuler" : "+ Ajouter un élève"}
                    </button>
                  </div>

                  {/* Add Student Subform */}
                  {showAddStudentForm && (
                    <form onSubmit={handleAddStudent} className="p-3 bg-white rounded-xl border border-slate-200 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Prénom & Nom de l&apos;élève *
                          </label>
                          <input
                            type="text"
                            required
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            placeholder="Ex: Ibrahima Diallo"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Classe / Niveau *
                          </label>
                          <input
                            type="text"
                            required
                            value={newStudentGrade}
                            onChange={(e) => setNewStudentGrade(e.target.value)}
                            placeholder="Ex: Terminale SM, 3ème..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Établissement (optionnel)
                          </label>
                          <input
                            type="text"
                            value={newStudentSchool}
                            onChange={(e) => setNewStudentSchool(e.target.value)}
                            placeholder="Ex: Lycée Saint-Georges"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs outline-hidden"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isAddingStudent}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                        >
                          {isAddingStudent ? "Enregistrement..." : "Enregistrer l'élève"}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Children Radio List */}
                  {selectedParent.children.length === 0 ? (
                    <p className="text-xs text-amber-700 italic">
                      Aucun profil élève n&apos;est rattaché à ce parent. Cliquez sur &laquo; + Ajouter un élève &raquo; ci-dessus pour continuer.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedParent.children.map((ch) => (
                        <label
                          key={ch.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedStudentId === ch.id
                              ? "bg-white border-[#16385c] ring-2 ring-[#16385c]/20"
                              : "bg-white/60 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="studentSelection"
                              checked={selectedStudentId === ch.id}
                              onChange={() => setSelectedStudentId(ch.id)}
                              className="text-[#16385c] focus:ring-[#16385c]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 text-xs block">
                                {ch.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                {ch.gradeLevel} {ch.schoolName ? `• ${ch.schoolName}` : ""}
                              </span>
                            </div>
                          </div>
                          <GraduationCap className="w-4 h-4 text-slate-400" />
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SUBJECT & FORMAT */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Matière demandée *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMMON_SUBJECTS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubjectName(sub)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                        subjectName === sub
                          ? "bg-[#16385c] text-white border-[#16385c] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                {subjectName === "Autre matière" && (
                  <input
                    type="text"
                    required
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    placeholder="Précisez la matière personnalisée..."
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden"
                  />
                )}
              </div>

              {/* Mode */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Format d&apos;enseignement *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { mode: TutoringMode.HOME, label: "À domicile", icon: Home },
                    { mode: TutoringMode.ONLINE, label: "En ligne", icon: Laptop },
                    { mode: TutoringMode.HYBRID, label: "Hybride", icon: Sparkles },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() => setMode(m.mode)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          mode === m.mode
                            ? "bg-blue-50 border-[#16385c] text-[#16385c] font-bold ring-1 ring-[#16385c]"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                        <span className="text-xs block">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location & Commune */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Commune (Zone géographique)
                  </label>
                  <select
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden"
                  >
                    {CONAKRY_COMMUNES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Adresse / Quartier
                  </label>
                  <input
                    type="text"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                    placeholder="Ex: Kipé Centre Émetteur"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden"
                  />
                </div>
              </div>

              {/* Preferred schedule */}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Créneaux horaires souhaités par la famille
                </label>
                <input
                  type="text"
                  value={preferredSchedule}
                  onChange={(e) => setPreferredSchedule(e.target.value)}
                  placeholder="Ex: Mercredi 16h-18h et Samedi 10h-12h"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 3: APPROVED TEACHER SELECTION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {locale === "en" ? "Select an Approved Tutor" : "Sélection d'un Enseignant Agréé Monsieur Fanyi"}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {locale === "en"
                      ? "Only active APPROVED teachers can be assigned to classes"
                      : "Seuls les enseignants au statut APPROUVÉ et avec compte actif sont affichés"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {teachersList.length} {locale === "en" ? "tutor(s) found" : "professeur(s) agréé(s)"}
                  </span>
                  {(teacherSearchQuery || teacherFilterSubject !== (subjectName === "Autre matière" ? customSubjectName : subjectName) || teacherFilterCycle !== "TOUS" || teacherFilterMode !== "TOUS" || teacherFilterCommune !== "TOUS") && (
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherSearchQuery("");
                        setTeacherFilterSubject(subjectName === "Autre matière" ? customSubjectName : subjectName);
                        setTeacherFilterCycle("TOUS");
                        setTeacherFilterMode("TOUS");
                        setTeacherFilterCommune("TOUS");
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {locale === "en" ? "Reset filters" : "Réinitialiser"}
                    </button>
                  )}
                </div>
              </div>

              {/* Advanced Multi-criteria Filter Bar */}
              <div className="space-y-2.5 p-3 rounded-2xl bg-slate-50/90 border border-slate-200">
                {/* Search Text Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder={
                      locale === "en"
                        ? "Search by teacher name, diploma, keywords, bio..."
                        : "Rechercher par nom de professeur, diplôme, biographie..."
                    }
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 outline-hidden focus:border-[#16385c] focus:ring-1 focus:ring-[#16385c]"
                  />
                  {teacherSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTeacherSearchQuery("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Row: Subject, Cycle, Mode, Commune */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {/* Subject filter */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      {locale === "en" ? "Subject" : "Matière"}
                    </label>
                    <select
                      value={teacherFilterSubject}
                      onChange={(e) => setTeacherFilterSubject(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-hidden font-medium"
                    >
                      <option value="TOUS">{locale === "en" ? "All subjects" : "Toutes les matières"}</option>
                      {COMMON_SUBJECTS.filter((s) => s !== "Autre matière").map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {customSubjectName && (
                        <option value={customSubjectName}>{customSubjectName} (Personnalisée)</option>
                      )}
                    </select>
                  </div>

                  {/* Cycle / Level filter */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      {locale === "en" ? "Cycle / Level" : "Cycle d'enseignement"}
                    </label>
                    <select
                      value={teacherFilterCycle}
                      onChange={(e) => setTeacherFilterCycle(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-hidden font-medium"
                    >
                      <option value="TOUS">{locale === "en" ? "All cycles" : "Tous les cycles"}</option>
                      <option value="PRIMAIRE">{locale === "en" ? "Primary" : "Primaire"}</option>
                      <option value="COLLEGE">{locale === "en" ? "Middle School" : "Collège"}</option>
                      <option value="LYCEE">{locale === "en" ? "High School" : "Lycée"}</option>
                      <option value="SUPERIEUR">{locale === "en" ? "Higher Ed" : "Supérieur"}</option>
                    </select>
                  </div>

                  {/* Mode filter */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      {locale === "en" ? "Teaching mode" : "Mode d'enseignement"}
                    </label>
                    <select
                      value={teacherFilterMode}
                      onChange={(e) => setTeacherFilterMode(e.target.value as any)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-hidden font-medium"
                    >
                      <option value="TOUS">{locale === "en" ? "All modes" : "Tous formats"}</option>
                      <option value="HOME">{locale === "en" ? "In-Person (Home)" : "À domicile"}</option>
                      <option value="ONLINE">{locale === "en" ? "Online" : "En ligne"}</option>
                    </select>
                  </div>

                  {/* Commune filter */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                      {locale === "en" ? "Commune / Area" : "Zone / Commune"}
                    </label>
                    <select
                      value={teacherFilterCommune}
                      onChange={(e) => setTeacherFilterCommune(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 outline-hidden font-medium"
                    >
                      <option value="TOUS">{locale === "en" ? "All Conakry" : "Tout Conakry"}</option>
                      {CONAKRY_COMMUNES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Results List */}
              {isSearchingTeachers ? (
                <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#16385c]" />
                  <span>{locale === "en" ? "Matching qualified tutors..." : "Recherche et classement des professeurs qualifiés..."}</span>
                </div>
              ) : teachersList.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {locale === "en"
                        ? "No tutor matches the selected criteria."
                        : "Aucun professeur ne correspond aux critères sélectionnés."}
                    </h5>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {locale === "en"
                        ? "You can broaden your filters (e.g. choose All cycles or All communes) to find other qualified teachers."
                        : "Vous pouvez modifier les filtres pour élargir la recherche."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherSearchQuery("");
                      setTeacherFilterSubject("TOUS");
                      setTeacherFilterCycle("TOUS");
                      setTeacherFilterMode("TOUS");
                      setTeacherFilterCommune("TOUS");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
                  >
                    <span>{locale === "en" ? "Broaden search (Show all tutors)" : "Élargir la recherche (Afficher tous)"}</span>
                  </button>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-3 border border-slate-100 rounded-2xl p-1.5 [scrollbar-width:thin]">
                  {teachersList.map((t) => {
                    const isSelected = selectedTeacher?.id === t.id;
                    const activeTargetSub = teacherFilterSubject !== "TOUS" ? teacherFilterSubject : (subjectName === "Autre matière" ? customSubjectName : subjectName);

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeacher(t)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs"
                            : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Teacher Identity & Details */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#16385c] to-blue-700 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                              {t.avatarUrl ? (
                                <img
                                  src={t.avatarUrl}
                                  alt={t.fullName}
                                  className="w-full h-full rounded-2xl object-cover"
                                />
                              ) : (
                                t.fullName.charAt(0).toUpperCase()
                              )}
                            </div>

                            <div className="space-y-1.5 flex-1 min-w-0">
                              {/* Name, Verified Badge & Match Relevance Badge */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {t.fullName}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                  <span>{locale === "en" ? "Approved" : "Agréé"}</span>
                                </span>

                                {/* Match Badge */}
                                {t.matchBadge === "EXACT" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                                    <span>{locale === "en" ? "Exact Match" : "Correspondance exacte"}</span>
                                  </span>
                                )}
                                {t.matchBadge === "SUBJECT_AND_LEVEL" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    <span>{locale === "en" ? "Subject & Level Match" : "Matière & Niveau compatibles"}</span>
                                  </span>
                                )}
                                {t.matchBadge === "SUBJECT_ONLY" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    <span>{locale === "en" ? "Subject Match" : "Matière compatible"}</span>
                                  </span>
                                )}
                              </div>

                              {/* Headline / Bio Excerpt */}
                              {t.headline && (
                                <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
                                  {t.headline}
                                </p>
                              )}

                              {/* Qualifications & Degrees */}
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                {t.degrees && (
                                  <span className="font-semibold text-slate-700">
                                    🎓 {t.degrees} {t.institution ? `(${t.institution})` : ""}
                                  </span>
                                )}
                                <span>• {t.yearsOfExperience} {locale === "en" ? "yrs exp." : "ans d'exp."}</span>
                                <span>• 📍 {t.serviceArea || t.city}</span>
                                {t.ratingAverage && (
                                  <span className="text-amber-700 font-bold">
                                    ★ {t.ratingAverage}/5 ({t.ratingsCount || 0})
                                  </span>
                                )}
                              </div>

                              {/* Subjects Chips (Highlighting matching subject) */}
                              {t.subjects && t.subjects.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                  {t.subjects.slice(0, 4).map((sub, idx) => {
                                    const isSubMatch = activeTargetSub && sub.toLowerCase().includes(activeTargetSub.toLowerCase());
                                    return (
                                      <span
                                        key={idx}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                          isSubMatch
                                            ? "bg-[#16385c] text-white border-[#16385c]"
                                            : "bg-slate-100 text-slate-700 border-slate-200/80"
                                        }`}
                                      >
                                        {sub}
                                      </span>
                                    );
                                  })}
                                  {t.subjects.length > 4 && (
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                      +{t.subjects.length - 4}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Verified Availability preview */}
                              {t.availabilities && t.availabilities.length > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                                  <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="line-clamp-1">
                                    {locale === "en" ? "Available:" : "Disponibilités :"} {t.availabilities.slice(0, 2).map((a) => `${a.dayName} (${a.startTime}-${a.endTime})`).join(", ")}
                                    {t.availabilities.length > 2 ? ` (+${t.availabilities.length - 2})` : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Pricing & Selection Control */}
                          <div className="text-right sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                            <div>
                              {t.monthlyPackageRateGnf ? (
                                <span className="font-extrabold text-slate-900 text-xs block">
                                  {formatGnf(t.monthlyPackageRateGnf)} <span className="text-[10px] font-medium text-slate-500">/mois</span>
                                </span>
                              ) : t.hourlyRateGnf ? (
                                <span className="font-extrabold text-slate-900 text-xs block">
                                  {formatGnf(t.hourlyRateGnf)} <span className="text-[10px] font-medium text-slate-500">/h</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  {locale === "en" ? "Standard rates" : "Tarif standard"}
                                </span>
                              )}

                              {/* Teaching mode badges */}
                              <div className="flex items-center justify-end gap-1 mt-1">
                                {t.isHomeAvailable && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-50 text-blue-700 border border-blue-200">
                                    {locale === "en" ? "In-Person" : "Domicile"}
                                  </span>
                                )}
                                {t.isOnlineAvailable && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-purple-50 text-purple-700 border border-purple-200">
                                    {locale === "en" ? "Online" : "En ligne"}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTeacher(t);
                              }}
                              className={`mt-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                                isSelected
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "bg-slate-100 text-slate-700 hover:bg-[#16385c] hover:text-white"
                              }`}
                            >
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{locale === "en" ? "Selected" : "Sélectionné"}</span>
                                </span>
                              ) : (
                                <span>{locale === "en" ? "Select" : "Choisir ce professeur"}</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: PRICING & SOURCE */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {locale === "en" ? "Agreed pricing formula *" : "Formule tarifaire convenue *"}
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setRateType("MONTHLY")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      rateType === "MONTHLY"
                        ? "bg-blue-50 border-[#16385c] text-[#16385c] font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Wallet className="w-4 h-4 mx-auto mb-1 text-slate-600" />
                    <span className="text-xs block">
                      {locale === "en" ? "Monthly package (recommended)" : "Forfait mensuel (recommandé)"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateType("HOURLY")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      rateType === "HOURLY"
                        ? "bg-blue-50 border-[#16385c] text-[#16385c] font-bold"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-slate-600" />
                    <span className="text-xs block">
                      {locale === "en" ? "Hourly rate" : "Tarif horaire"}
                    </span>
                  </button>
                </div>

                {rateType === "MONTHLY" ? (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {locale === "en" ? "Monthly package amount (GNF) *" : "Montant du forfait mensuel (en GNF) *"}
                    </label>
                    <input
                      type="number"
                      min="100000"
                      step="50000"
                      value={monthlyRateGnf}
                      onChange={(e) => setMonthlyRateGnf(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      {locale === "en" ? "e.g. 800,000 GNF for 8 sessions of 2h/month" : "Ex: 800 000 GNF pour 8 séances de 2h/mois"}
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {locale === "en" ? "Hourly rate (GNF / hour) *" : "Tarif horaire (en GNF / heure) *"}
                    </label>
                    <input
                      type="number"
                      min="20000"
                      step="5000"
                      value={hourlyRateGnf}
                      onChange={(e) => setHourlyRateGnf(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden"
                    />
                  </div>
                )}

                {/* Session configuration */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {locale === "en" ? "Planned number of sessions *" : "Nombre de séances prévues *"}
                    </label>
                    <select
                      value={sessionsCount}
                      onChange={(e) => setSessionsCount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden font-semibold text-slate-800"
                    >
                      <option value={4}>{locale === "en" ? "4 sessions (1 / week)" : "4 séances (1 / semaine)"}</option>
                      <option value={8}>{locale === "en" ? "8 sessions (2 / week)" : "8 séances (2 / semaine)"}</option>
                      <option value={12}>{locale === "en" ? "12 sessions (3 / week)" : "12 séances (3 / semaine)"}</option>
                      <option value={16}>{locale === "en" ? "16 sessions (4 / week)" : "16 séances (4 / semaine)"}</option>
                      <option value={20}>{locale === "en" ? "20 sessions" : "20 séances"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {locale === "en" ? "Duration per session *" : "Durée par séance *"}
                    </label>
                    <select
                      value={minutesPerSession}
                      onChange={(e) => setMinutesPerSession(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden font-semibold text-slate-800"
                    >
                      <option value={60}>{locale === "en" ? "60 minutes (1 hour)" : "60 minutes (1 heure)"}</option>
                      <option value={90}>{locale === "en" ? "90 minutes (1h30)" : "90 minutes (1h30)"}</option>
                      <option value={120}>{locale === "en" ? "120 minutes (2 hours)" : "120 minutes (2 heures)"}</option>
                    </select>
                  </div>
                </div>

                {/* Live pricing breakdown simulation */}
                {(() => {
                  const total =
                    rateType === "MONTHLY"
                      ? Number(monthlyRateGnf)
                      : Math.round(
                          (Number(hourlyRateGnf) * minutesPerSession) / 60
                        ) * sessionsCount;
                  const comm = Math.round((total * 15) / 100);
                  const net = total - comm;
                  const perSession = Math.round(total / (sessionsCount || 1));

                  return (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          {locale === "en" ? "Financial simulation (Monsieur Fanyi rules)" : "Simulation financière (Règles Monsieur Fanyi)"}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {locale === "en" ? "Commission 15% • Tutor 85%" : "Commission 15% • Tuteur 85%"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">{locale === "en" ? "Gross total" : "Total forfait"}</span>
                          <span className="font-bold text-slate-800 block mt-0.5 text-xs">{formatGnf(total)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">{locale === "en" ? "Commission (15%)" : "Commission (15%)"}</span>
                          <span className="font-bold text-amber-700 block mt-0.5 text-xs">{formatGnf(comm)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">{locale === "en" ? "Tutor net (85%)" : "Net tuteur (85%)"}</span>
                          <span className="font-bold text-emerald-700 block mt-0.5 text-xs">{formatGnf(net)}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-100">
                          <span className="text-[10px] text-slate-400 block font-semibold">{locale === "en" ? "Cost / session" : "Coût / séance"}</span>
                          <span className="font-bold text-slate-700 block mt-0.5 text-xs">{formatGnf(perSession)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Assignment Source */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  {locale === "en" ? "Assignment origin *" : "Origine de l'affectation assistée *"}
                </label>
                <select
                  value={assignmentSource}
                  onChange={(e) => setAssignmentSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden"
                >
                  <option value="PHONE_INQUIRY">{locale === "en" ? "Parent telephone call" : "Appel téléphonique du parent"}</option>
                  <option value="DIRECT_OFFICE">{locale === "en" ? "In-person visit to Monsieur Fanyi office" : "Visite en personne au bureau Monsieur Fanyi"}</option>
                  <option value="ADMIN_MATCH">{locale === "en" ? "VIP concierge / Moderation match" : "Accompagnement VIP / Arbitrage modération"}</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {locale === "en" ? "Internal administrator notes (traceability)" : "Notes internes de l'administrateur (traçabilité)"}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={locale === "en" ? "Specify contact notes, phone agreement, or specific instructions..." : "Préciser les éléments de contact, accord téléphonique ou consignes spécifiques..."}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 5: VERIFICATION & CONFIRMATION */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center justify-between">
                  <span>{locale === "en" ? "Assignment Summary" : "Récapitulatif de l'affectation"}</span>
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                    {locale === "en" ? "Initial status: PENDING_PAYMENT" : "Statut initial : PENDING_PAYMENT"}
                  </span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">{locale === "en" ? "Family & Student" : "Famille & Élève"}</span>
                    <span className="font-bold text-slate-800 block">{selectedParent?.fullName}</span>
                    <span className="text-slate-600 block">
                      {locale === "en" ? "Student:" : "Élève :"} {selectedParent?.children.find((c) => c.id === selectedStudentId)?.fullName}
                    </span>
                    <span className="text-slate-500 block text-[11px]">{selectedParent?.phoneNumber || selectedParent?.email}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">{locale === "en" ? "Assigned Tutor" : "Professeur Attribué"}</span>
                    <span className="font-bold text-emerald-800 block">{selectedTeacher?.fullName}</span>
                    <span className="text-slate-600 block">{selectedTeacher?.headline || (locale === "en" ? "Certified tutor" : "Enseignant agréé")}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">{locale === "en" ? "Subject & Mode" : "Matière & Mode"}</span>
                    <span className="font-semibold text-slate-800 block">
                      {subjectName === "Autre matière" ? customSubjectName : subjectName}
                    </span>
                    <span className="text-slate-600 block">
                      {mode === "HOME" ? (locale === "en" ? "In-Person" : "À domicile") : mode === "ONLINE" ? (locale === "en" ? "Online" : "En ligne") : (locale === "en" ? "Hybrid" : "Hybride")} • {commune}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">{locale === "en" ? "Package & Agreed Terms" : "Forfait & Tarification convenue"}</span>
                    <span className="font-bold text-emerald-700 text-sm block">
                      {rateType === "MONTHLY"
                        ? `${formatGnf(monthlyRateGnf)} (${sessionsCount} ${locale === "en" ? "sessions" : "séances"} • ${minutesPerSession} min)`
                        : `${formatGnf(hourlyRateGnf)} /h (${sessionsCount} ${locale === "en" ? "sessions" : "séances"} • ${minutesPerSession} min)`}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      {locale === "en" ? "Monsieur Fanyi Commission: 15% • Tutor Net: 85%" : "Part Monsieur Fanyi : 15% • Net Enseignant : 85%"}
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      {locale === "en" ? "Source:" : "Source :"} {assignmentSource === "PHONE_INQUIRY" ? (locale === "en" ? "Telephone call" : "Appel téléphonique") : (locale === "en" ? "Monsieur Fanyi office" : "Bureau Monsieur Fanyi")}
                    </span>
                  </div>
                </div>

                {adminNotes && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">{locale === "en" ? "Administrative notes" : "Notes administratives"}</span>
                    <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-100 mt-1">
                      {adminNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Advance Payment Policy Banner */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>{locale === "en" ? "Financial invariance rule:" : "Règle d'invariance financière :"}</span>
                </span>
                <p className="leading-relaxed">
                  {locale === "en"
                    ? "The class will be created in Payment Pending status. Zero premature payments or tutor earnings are generated. Sessions cannot begin until initial parent prepayment is deposited."
                    : "La classe sera créée avec le statut En attente de paiement. Aucun ordre de paiement fictif ni aucun gain enseignant n'est généré à cette étape. Les séances ne peuvent débuter qu'après le règlement initial par le parent."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (step > 1) setStep(step - 1);
              else onClose();
            }}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {step > 1 ? (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>{locale === "en" ? "Previous" : "Précédent"}</span>
              </>
            ) : (
              <span>{locale === "en" ? "Cancel" : "Annuler"}</span>
            )}
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={!canAdvance()}
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#204e7d] disabled:opacity-50 transition-colors shadow-xs"
            >
              <span>{locale === "en" ? "Next" : "Suivant"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitAssignment}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === "en" ? "Finalizing assignment..." : "Affectation en cours..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{locale === "en" ? "Confirm Direct Assignment" : "Confirmer l'affectation directe"}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

