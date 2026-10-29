"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  DollarSign,
  Upload,
  Trash2,
  Save,
  Send,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedUser } from "@/lib/auth/session";
import { TeacherApprovedDossierView } from "./TeacherApprovedDossierView";

interface SubjectItem {
  id: string;
  name: string;
  category: string | null;
}

interface GradeLevelItem {
  id: string;
  name: string;
  cycle: string;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface UploadedDoc {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  fileSizeBytes: number;
  status: string;
}

interface TeacherOnboardingClientProps {
  user: AuthenticatedUser;
}

export function TeacherOnboardingClient({ user }: TeacherOnboardingClientProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Verification & Status from Server
  const [verificationStatus, setVerificationStatus] = useState<string>("DRAFT");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [isEditingApproved, setIsEditingApproved] = useState(false);

  // Master Data
  const [allSubjects, setAllSubjects] = useState<SubjectItem[]>([]);
  const [allGradeLevels, setAllGradeLevels] = useState<GradeLevelItem[]>([]);

  // Form State
  const [fullName, setFullName] = useState(user.fullName || "");
  const [email, setEmail] = useState(user.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || "");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState(0);
  const [degrees, setDegrees] = useState("");
  const [institution, setInstitution] = useState("");

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedGradeLevelIds, setSelectedGradeLevelIds] = useState<string[]>([]);

  const [city, setCity] = useState("Conakry");
  const [serviceArea, setServiceArea] = useState("");
  const [isHomeAvailable, setIsHomeAvailable] = useState(true);
  const [isOnlineAvailable, setIsOnlineAvailable] = useState(true);
  const [hourlyRateGnf, setHourlyRateGnf] = useState<number | "">(150000);
  const [monthlyPackageRateGnf, setMonthlyPackageRateGnf] = useState<number | "">(1000000);
  const [monthlyPackageSessions, setMonthlyPackageSessions] = useState(8);
  const [monthlyPackageHoursPerSession, setMonthlyPackageHoursPerSession] = useState(2);

  const [availabilities, setAvailabilities] = useState<AvailabilitySlot[]>([
    { dayOfWeek: 1, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: 3, startTime: "16:00", endTime: "19:00" },
    { dayOfWeek: 5, startTime: "15:00", endTime: "18:00" },
  ]);

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDoc[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Uploading state for document input
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadType, setDocUploadType] = useState("NATIONAL_ID");

  // Load existing profile & master data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/teacher/onboarding");
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            router.push("/login?callbackUrl=/teacher/onboarding");
            return;
          }
          throw new Error(
            locale === "en"
              ? "Error loading application dossier."
              : "Erreur de chargement des informations."
          );
        }
        const data = await res.json();

        setFullName(data.user.fullName || user.fullName || "");
        setEmail(data.user.email || user.email || "");
        setPhoneNumber(data.user.phoneNumber || user.phoneNumber || "");

        if (data.profile) {
          setVerificationStatus(data.profile.verificationStatus || "DRAFT");
          setRejectionReason(data.profile.rejectionReason || null);
          setSubmittedAt(data.profile.submittedAt || null);

          setHeadline(data.profile.headline || "");
          setBio(data.profile.bio || "");
          setYearsOfExperience(data.profile.yearsOfExperience || 0);
          setDegrees(data.profile.degrees || "");
          setInstitution(data.profile.institution || "");
          setCity(data.profile.city || "Conakry");
          setServiceArea(data.profile.serviceArea || "");
          setIsHomeAvailable(data.profile.isHomeAvailable ?? true);
          setIsOnlineAvailable(data.profile.isOnlineAvailable ?? true);
          setHourlyRateGnf(data.profile.hourlyRateGnf || 150000);
          setMonthlyPackageRateGnf(data.profile.monthlyPackageRateGnf || 1000000);
          setMonthlyPackageSessions(data.profile.monthlyPackageSessions || 8);
          setMonthlyPackageHoursPerSession(data.profile.monthlyPackageHoursPerSession || 2);
          setTermsAccepted(Boolean(data.profile.termsAccepted));

          if (data.profile.subjectIds) setSelectedSubjectIds(data.profile.subjectIds);
          if (data.profile.gradeLevelIds) setSelectedGradeLevelIds(data.profile.gradeLevelIds);
          if (data.profile.availabilities && data.profile.availabilities.length > 0) {
            setAvailabilities(data.profile.availabilities);
          }
          if (data.profile.documents) {
            setUploadedDocuments(data.profile.documents);
          }
        }

        if (data.masterData) {
          setAllSubjects(data.masterData.subjects || []);
          setAllGradeLevels(data.masterData.gradeLevels || []);
        }
      } catch (err: any) {
        setErrorMessage(
          err.message ||
            (locale === "en"
              ? "Connection error. Please try again."
              : "Erreur de connexion.")
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, user, locale]);

  // Days of week representation
  const dayNames =
    locale === "en"
      ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      : ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

  // Toggle subject
  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle grade level
  const toggleGradeLevel = (id: string) => {
    setSelectedGradeLevelIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Availability handlers
  const addAvailabilitySlot = () => {
    setAvailabilities((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: "16:00", endTime: "18:00" },
    ]);
  };

  const removeAvailabilitySlot = (index: number) => {
    setAvailabilities((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilitySlot = (
    index: number,
    field: keyof AvailabilitySlot,
    value: any
  ) => {
    setAvailabilities((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  // Document upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docUploadType);
      formData.append("title", file.name);

      const res = await fetch("/api/teacher/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            (locale === "en"
              ? "Error uploading document."
              : "Erreur lors du téléversement.")
        );
      }

      setUploadedDocuments((prev) => [data.document, ...prev]);
      setSuccessMessage(
        locale === "en"
          ? "Document successfully uploaded."
          : "Document téléversé avec succès."
      );
      e.target.value = "";
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          (locale === "en" ? "Upload error." : "Erreur de téléversement.")
      );
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Document deletion handler
  const handleDeleteDocument = async (id: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/teacher/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error ||
            (locale === "en"
              ? "Unable to delete this document."
              : "Impossible de supprimer ce document.")
        );
      }
      setUploadedDocuments((prev) => prev.filter((d) => d.id !== id));
      setSuccessMessage(
        locale === "en"
          ? "Document successfully deleted."
          : "Document supprimé avec succès."
      );
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Save draft or submit application
  const handleSaveOrSubmit = async (action: "save_draft" | "submit") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      const payload = {
        headline,
        bio,
        yearsOfExperience: Number(yearsOfExperience),
        city,
        serviceArea,
        degrees,
        institution,
        isHomeAvailable,
        isOnlineAvailable,
        hourlyRateGnf: hourlyRateGnf === "" ? null : Number(hourlyRateGnf),
        monthlyPackageRateGnf:
          monthlyPackageRateGnf === "" ? null : Number(monthlyPackageRateGnf),
        monthlyPackageSessions: Number(monthlyPackageSessions),
        monthlyPackageHoursPerSession: Number(monthlyPackageHoursPerSession),
        subjectIds: selectedSubjectIds,
        gradeLevelIds: selectedGradeLevelIds,
        availabilities,
        termsAccepted,
        action,
      };

      const res = await fetch("/api/teacher/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (locale === "en"
              ? "An error occurred while saving."
              : "Une erreur est survenue lors de l'enregistrement.")
        );
      }

      if (action === "submit") {
        setVerificationStatus("PENDING_REVIEW");
        setSubmittedAt(new Date().toISOString());
        setSuccessMessage(
          locale === "en"
            ? "Your application has been successfully submitted to administration! Review within 24 business hours."
            : "Votre dossier a été soumis avec succès à l'administration ! Examen sous 24h ouvrées."
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => {
          router.push("/teacher/dashboard");
        }, 2000);
      } else {
        setSuccessMessage(
          locale === "en"
            ? "Draft saved successfully."
            : "Brouillon sauvegardé avec succès."
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#16385c]" />
          <span className="text-sm font-semibold">
            {locale === "en"
              ? "Loading your teacher dossier..."
              : "Chargement de votre dossier enseignant..."}
          </span>
        </div>
      </div>
    );
  }

  if (verificationStatus === "APPROVED" && !isEditingApproved) {
    const selectedSubjectsList = allSubjects.filter((s) =>
      selectedSubjectIds.includes(s.id)
    );
    const selectedGradeLevelsList = allGradeLevels.filter((g) =>
      selectedGradeLevelIds.includes(g.id)
    );

    return (
      <TeacherApprovedDossierView
        user={user}
        headline={headline}
        bio={bio}
        yearsOfExperience={yearsOfExperience}
        degrees={degrees}
        institution={institution}
        city={city}
        serviceArea={serviceArea}
        isHomeAvailable={isHomeAvailable}
        isOnlineAvailable={isOnlineAvailable}
        hourlyRateGnf={hourlyRateGnf}
        monthlyPackageRateGnf={monthlyPackageRateGnf}
        monthlyPackageSessions={monthlyPackageSessions}
        monthlyPackageHoursPerSession={monthlyPackageHoursPerSession}
        selectedSubjects={selectedSubjectsList}
        selectedGradeLevels={selectedGradeLevelsList}
        availabilities={availabilities}
        documents={uploadedDocuments}
        submittedAt={submittedAt}
        onEditDossier={() => setIsEditingApproved(true)}
      />
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Top Header Section inside Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {locale === "en" ? "Teacher Portal" : "Portail Enseignant"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Accreditation Dossier" : "Dossier d'Accréditation"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading">
            {locale === "en"
              ? "Teacher Accreditation Dossier (SRD V2.0)"
              : "Dossier d'Accréditation Enseignant (SRD V2.0)"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Submit your identity proofs, university degrees, subjects, and availability for administrative verification."
              : "Complétez votre profil, déposez vos justificatifs et soumettez votre dossier à l'administration."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/dashboard"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200"
          >
            {locale === "en" ? "Back to Dashboard" : "Retour au tableau de bord"}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Form Canvas */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Status Banners */}
        {verificationStatus === "REJECTED" && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 shadow-xs">
            <div className="flex items-center gap-2.5 font-extrabold text-sm text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                {locale === "en"
                  ? "Application awaiting corrections"
                  : "Dossier en attente de correction"}
              </span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed pl-7">
              <strong>
                {locale === "en"
                  ? "Reason provided by administration:"
                  : "Motif indiqué par l'administration :"}
              </strong>{" "}
              {rejectionReason ||
                (locale === "en"
                  ? "Some supporting documents require updates."
                  : "Des pièces justificatives nécessitent une mise à jour.")}
            </p>
            <p className="text-[11px] text-rose-700 pl-7">
              {locale === "en"
                ? "Please make the required changes below and click 'Submit Application' on the final step."
                : "Veuillez apporter les modifications requises ci-dessous et cliquer sur « Soumettre mon dossier » à l'étape finale."}
            </p>
          </div>
        )}

        {verificationStatus === "PENDING_REVIEW" && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-amber-900">
                  {locale === "en"
                    ? "Application under administrative review"
                    : "Dossier en cours d'examen administratif"}
                </span>
                <span className="text-[11px] text-amber-800">
                  {locale === "en" ? "Application submitted on " : "Candidature soumise le "}
                  {submittedAt
                    ? new Date(submittedAt).toLocaleDateString(
                        locale === "en" ? "en-US" : "fr-FR",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : locale === "en"
                    ? "recently"
                    : "récemment"}
                  {locale === "en"
                    ? ". Our educational team reviews applications within 24 business hours."
                    : ". Notre équipe pédagogique valide les dossiers sous 24h ouvrées."}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-200/60 text-amber-900">
              {locale === "en" ? "Under Review" : "En cours"}
            </span>
          </div>
        )}

        {verificationStatus === "APPROVED" && (
          <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-xs block text-emerald-900">
                  {locale === "en"
                    ? "Congratulations! You are a Verified Monsieur Fanyi Tutor"
                    : "Félicitations ! Vous êtes un Enseignant Vérifié Monsieur Fanyi"}
                </span>
                <span className="text-[11px] text-emerald-800">
                  {locale === "en"
                    ? "Your credentials and diplomas have been validated. You are eligible to teach students across Guinea."
                    : "Vos pièces justificatives ont été validées. Vous êtes habilité à postuler à l'ensemble des offres de soutien en Guinée."}
                </span>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/60 text-emerald-900">
              {locale === "en" ? "Approved" : "Approuvé"}
            </span>
          </div>
        )}

        {/* Global Notifications / Errors */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Steps Progress Header */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold text-[#e59a38] uppercase tracking-wider block">
                {locale === "en"
                  ? `Step ${currentStep} of ${totalSteps}`
                  : `Étape ${currentStep} sur ${totalSteps}`}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 font-heading">
                {currentStep === 1 &&
                  (locale === "en"
                    ? "Identity & Academic Background"
                    : "Identité & Profil Pédagogique")}
                {currentStep === 2 &&
                  (locale === "en"
                    ? "Subjects & Teaching Levels"
                    : "Matières & Niveaux d'Enseignement")}
                {currentStep === 3 &&
                  (locale === "en"
                    ? "Location & Rate Options"
                    : "Localisation & Modalités Tarifaires")}
                {currentStep === 4 &&
                  (locale === "en"
                    ? "Weekly Availability"
                    : "Disponibilités Hebdomadaires")}
                {currentStep === 5 &&
                  (locale === "en"
                    ? "Certified Documents & Diplomas"
                    : "Justificatifs & Diplômes Certifiés")}
                {currentStep === 6 &&
                  (locale === "en"
                    ? "Code of Ethics & Final Submission"
                    : "Charte Déontologique & Soumission")}
              </h2>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleSaveOrSubmit("save_draft")}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{locale === "en" ? "Save Draft" : "Enregistrer brouillon"}</span>
              </button>
            </div>
          </div>

          {/* Stepper Dots / Bars */}
          <div className="grid grid-cols-6 gap-2 pt-2">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setCurrentStep(step)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  step === currentStep
                    ? "bg-[#16385c]"
                    : step < currentStep
                    ? "bg-emerald-500"
                    : "bg-slate-200"
                }`}
                title={locale === "en" ? `Go to step ${step}` : `Aller à l'étape ${step}`}
              />
            ))}
          </div>
        </div>

        {/* Step Form Cards */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
          {/* STEP 1: Personal & Professional Info */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {locale === "en"
                    ? "Tell us about yourself and your academic credentials"
                    : "Parlez-nous de vous et de votre parcours académique"}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "This information will establish your verified profile for families in Guinea."
                    : "Ces informations permettront d'établir votre profil auprès des familles guinéennes."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en" ? "Full Name" : "Nom & Prénom"}
                  </label>
                  <input
                    type="text"
                    disabled
                    value={fullName}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en" ? "Contact Email" : "Email de contact"}
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en"
                      ? "Phone Number (Orange / MTN Guinea) *"
                      : "Numéro de Téléphone (Orange / MTN Guinée) *"}
                  </label>
                  <input
                    type="tel"
                    disabled
                    value={phoneNumber}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">
                    {locale === "en"
                      ? "Can be updated from account settings."
                      : "Modifiable depuis vos paramètres de compte."}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en"
                      ? "Years of Teaching Experience *"
                      : "Années d'expérience d'enseignement *"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {locale === "en"
                    ? "Professional Headline (e.g. Certified Math & Physics Teacher)"
                    : "Titre professionnel / Accroche (ex: Professeur certifié de Mathématiques & Physique)"}
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder={
                    locale === "en"
                      ? "e.g. Certified Math Teacher — Intensive Baccalaureate Prep"
                      : "ex: Enseignant certifié en Sciences Mathématiques — Préparation intensive Bac"
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en"
                      ? "Highest Degree Obtained (e.g. Master's in Physics) *"
                      : "Diplôme le plus élevé (ex: Master 2 Didactique des Sciences) *"}
                  </label>
                  <input
                    type="text"
                    value={degrees}
                    onChange={(e) => setDegrees(e.target.value)}
                    placeholder={
                      locale === "en"
                        ? "e.g. Master's Degree in Physics"
                        : "ex: Master en Physique Fondamentale"
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en"
                      ? "Graduating University / Institution *"
                      : "Établissement / Université d'obtention *"}
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder={
                      locale === "en"
                        ? "e.g. Gamal Abdel Nasser University of Conakry (UGANC)"
                        : "ex: Université Gamal Abdel Nasser de Conakry (UGANC)"
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {locale === "en"
                    ? "Biography & Teaching Methodology * (at least 30 characters)"
                    : "Biographie & Méthodologie pédagogique * (au moins 30 caractères)"}
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={
                    locale === "en"
                      ? "Describe your background, teaching approach, and how you rebuild confidence in struggling students..."
                      : "Décrivez votre parcours, votre façon d'expliquer les notions difficiles, comment vous redonnez confiance aux élèves en difficulté..."
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {locale === "en"
                    ? `${bio.length} / 30 minimum characters`
                    : `${bio.length} / 30 caractères minimum`}
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: Subjects & Teaching Levels */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {locale === "en"
                    ? "Taught Subjects & Grade Levels"
                    : "Matières enseignées & Niveaux scolaires pris en charge"}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Select the disciplines in which you hold verified academic qualifications."
                    : "Sélectionnez les disciplines dans lesquelles vous possédez des qualifications vérifiables."}
                </p>
              </div>

              {/* Subjects Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === "en"
                    ? "Teaching subjects (select at least one) *"
                    : "Matières d'enseignement (sélectionnez au moins une matière) *"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allSubjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => toggleSubject(sub.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/70 text-blue-950 font-bold shadow-xs"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs block">{sub.name}</span>
                          {sub.category && (
                            <span className="text-[10px] text-slate-400 block font-normal">
                              {sub.category}
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grade Levels Selection */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === "en"
                    ? "Supported Grade Levels *"
                    : "Niveaux scolaires pris en charge *"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allGradeLevels.map((lvl) => {
                    const isSelected = selectedGradeLevelIds.includes(lvl.id);
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => toggleGradeLevel(lvl.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs block">{lvl.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {locale === "en" ? `Cycle: ${lvl.cycle}` : `Cycle : ${lvl.cycle}`}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 bg-white"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Location & Rates */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {locale === "en"
                    ? "Geographic Location & Rate Options"
                    : "Zone géographique & Modalités de cours"}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Specify your travel areas and pricing preferences in Guinean Francs (GNF)."
                    : "Indiquez où vous pouvez vous déplacer et vos préférences tarifaires en Francs Guinéens (GNF)."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en" ? "Primary City (Guinea) *" : "Ville principale (Guinée) *"}
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  >
                    <option value="Conakry">Conakry</option>
                    <option value="Kindia">Kindia</option>
                    <option value="Labé">Labé</option>
                    <option value="Mamou">Mamou</option>
                    <option value="Kankan">Kankan</option>
                    <option value="Boké">Boké</option>
                    <option value="Nzérékoré">Nzérékoré</option>
                    <option value="Autre région">
                      {locale === "en" ? "Other Region" : "Autre préfecture"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {locale === "en" ? "Communes / Neighborhoods Served" : "Communes / Quartiers desservis"}
                  </label>
                  <input
                    type="text"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder={
                      locale === "en"
                        ? "e.g. Ratoma, Dixinn, Kipé, Lambanyi, Camayenne"
                        : "ex: Ratoma, Dixinn, Kipé, Lambanyi, Camayenne"
                    }
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                  />
                </div>
              </div>

              {/* Modes of tutoring */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  {locale === "en" ? "Tutoring Formats Accepted" : "Modalités d'enseignement acceptées"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={isHomeAvailable}
                      onChange={(e) => setIsHomeAvailable(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold block text-slate-800">
                        {locale === "en" ? "In-Home Tutoring (Student residence)" : "Cours à domicile (Famille)"}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {locale === "en"
                          ? "You travel to the student's residence within your designated area."
                          : "Vous vous déplacez chez l'élève dans vos zones indiquées."}
                      </span>
                    </div>
                  </label>

                  <label className="p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={isOnlineAvailable}
                      onChange={(e) => setIsOnlineAvailable(e.target.checked)}
                      className="rounded text-blue-600 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold block text-slate-800">
                        {locale === "en" ? "Online Tutoring (Video conferencing)" : "Cours en ligne (Visioconférence)"}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        {locale === "en"
                          ? "Sessions conducted through Google Meet or integrated virtual room."
                          : "Séances via la classe virtuelle Google Meet / intégrée."}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Rates in GNF */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center gap-2 text-slate-800">
                  <DollarSign className="w-4 h-4 text-[#e59a38]" />
                  <span className="text-xs font-bold">
                    {locale === "en"
                      ? "Recommended Rates (Rule: 85% Tutor / 15% Platform Commission)"
                      : "Tarifs indicatifs recommandés (Règle 85% Enseignant / 15% Plateforme)"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {locale === "en"
                        ? "Hourly Tutoring Rate (GNF / hour)"
                        : "Tarif Horaire Indicatif (GNF / heure)"}
                    </label>
                    <input
                      type="number"
                      step="5000"
                      min="20000"
                      value={hourlyRateGnf}
                      onChange={(e) =>
                        setHourlyRateGnf(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {locale === "en" ? "Tutor net share (85%): " : "Part nette professeur (85%) : "}
                      <strong>
                        {hourlyRateGnf
                          ? Math.round(Number(hourlyRateGnf) * 0.85).toLocaleString(
                              locale === "en" ? "en-US" : "fr-FR"
                            )
                          : 0}{" "}
                        GNF
                      </strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {locale === "en"
                        ? "Monthly Package Rate (8 sessions of 2h)"
                        : "Forfait Mensuel Recommandé (8 séances de 2h)"}
                    </label>
                    <input
                      type="number"
                      step="50000"
                      min="100000"
                      value={monthlyPackageRateGnf}
                      onChange={(e) =>
                        setMonthlyPackageRateGnf(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {locale === "en" ? "Tutor net share (85%): " : "Part nette professeur (85%) : "}
                      <strong>
                        {monthlyPackageRateGnf
                          ? Math.round(Number(monthlyPackageRateGnf) * 0.85).toLocaleString(
                              locale === "en" ? "en-US" : "fr-FR"
                            )
                          : 0}{" "}
                        GNF
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Weekly Availability */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {locale === "en"
                      ? "Weekly Availability Schedule"
                      : "Disponibilités hebdomadaires habituelles"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {locale === "en"
                      ? "Set recurring slots when you are available to teach."
                      : "Définissez les créneaux pendant lesquels vous pouvez donner des cours."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addAvailabilitySlot}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "+ Add Time Slot" : "+ Ajouter un créneau"}</span>
                </button>
              </div>

              {availabilities.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                  <span className="text-xs text-slate-400 block">
                    {locale === "en"
                      ? "No time slots added yet."
                      : "Aucun créneau renseigné pour le moment."}
                  </span>
                  <button
                    type="button"
                    onClick={addAvailabilitySlot}
                    className="text-xs font-bold text-[#16385c] underline cursor-pointer"
                  >
                    {locale === "en" ? "Add your first time slot" : "Ajouter un premier créneau horaire"}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilities.map((slot, index) => (
                    <div
                      key={index}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex flex-wrap items-center gap-3 justify-between"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                            {locale === "en" ? "Day" : "Jour"}
                          </label>
                          <select
                            value={slot.dayOfWeek}
                            onChange={(e) =>
                              updateAvailabilitySlot(index, "dayOfWeek", Number(e.target.value))
                            }
                            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                          >
                            {dayNames.map((day, dIdx) => (
                              <option key={dIdx} value={dIdx}>
                                {day}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                            {locale === "en" ? "Start" : "Début"}
                          </label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) =>
                              updateAvailabilitySlot(index, "startTime", e.target.value)
                            }
                            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                          />
                        </div>

                        <span className="text-slate-400 self-end mb-2">
                          {locale === "en" ? "to" : "à"}
                        </span>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                            {locale === "en" ? "End" : "Fin"}
                          </label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) =>
                              updateAvailabilitySlot(index, "endTime", e.target.value)
                            }
                            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAvailabilitySlot(index)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title={locale === "en" ? "Delete slot" : "Supprimer ce créneau"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Certified Document Uploads */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {locale === "en"
                    ? "Identity Proofs & Certified Degrees"
                    : "Justificatifs d'identité & Diplômes certifiés"}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Files stored in an encrypted vault, strictly reserved for administrative compliance."
                    : "Documents stockés dans un espace privé sécurisé hors du web public, réservé au contrôle de l'administration."}
                </p>
              </div>

              {/* Upload Input Area */}
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <span className="text-xs font-bold text-[#16385c] block">
                  {locale === "en"
                    ? "Upload new supporting document (PDF, PNG, JPG, max 5 MB)"
                    : "Téléverser un nouveau document (PDF, PNG, JPG, max 5 Mo)"}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      {locale === "en" ? "Document Type *" : "Type de document *"}
                    </label>
                    <select
                      value={docUploadType}
                      onChange={(e) => setDocUploadType(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800"
                    >
                      <option value="NATIONAL_ID">
                        {locale === "en"
                          ? "Guinean National ID Card (CNI)"
                          : "Carte Nationale d'Identité (CNI)"}
                      </option>
                      <option value="PASSPORT">
                        {locale === "en" ? "Guinean Passport" : "Passeport Guinéen"}
                      </option>
                      <option value="DIPLOMA">
                        {locale === "en"
                          ? "University Degree or Certificate"
                          : "Diplôme universitaire ou attestation"}
                      </option>
                      <option value="POLICE_RECORD">
                        {locale === "en"
                          ? "Police Record Certificate (Optional)"
                          : "Casier judiciaire (facultatif)"}
                      </option>
                      <option value="CV">
                        {locale === "en"
                          ? "Detailed Curriculum Vitae"
                          : "Curriculum Vitae détaillé"}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                      {locale === "en" ? "Select File *" : "Sélectionner le fichier *"}
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={handleFileUpload}
                      disabled={isUploadingDoc}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#16385c] file:text-white hover:file:bg-[#10243d] cursor-pointer"
                    />
                  </div>
                </div>

                {isUploadingDoc && (
                  <div className="flex items-center gap-2 text-xs text-blue-700 pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>
                      {locale === "en"
                        ? "Encrypting and transferring supporting document..."
                        : "Chiffrement et transfert sécurisé du justificatif..."}
                    </span>
                  </div>
                )}
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  {locale === "en"
                    ? `Attached documents in your dossier (${uploadedDocuments.length})`
                    : `Documents enregistrés dans votre dossier (${uploadedDocuments.length})`}
                </span>

                {uploadedDocuments.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                    {locale === "en"
                      ? "No documents uploaded. At least one identity proof and one degree certificate are required to submit."
                      : "Aucun document téléversé. Au moins une pièce d'identité et un diplôme sont obligatoires pour soumettre."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <FileText className="w-4 h-4 text-[#16385c]" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block line-clamp-1">
                              {doc.title}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {locale === "en" ? "Type: " : "Type : "}
                              {doc.type} • {(doc.fileSizeBytes / 1024).toFixed(0)} KB •{" "}
                              {locale === "en" ? "Status: " : "Statut : "}
                              <span
                                className={`font-semibold ${
                                  doc.status === "VERIFIED"
                                    ? "text-emerald-600"
                                    : doc.status === "REJECTED"
                                    ? "text-rose-600"
                                    : "text-amber-600"
                                }`}
                              >
                                {doc.status === "VERIFIED"
                                  ? (locale === "en" ? "VERIFIED" : "VALIDÉ")
                                  : doc.status === "REJECTED"
                                  ? (locale === "en" ? "REJECTED" : "REJETÉ")
                                  : (locale === "en" ? "PENDING" : "EN ATTENTE")}
                              </span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`/api/teacher/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title={locale === "en" ? "Secure Preview" : "Aperçu sécurisé"}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={locale === "en" ? "Delete" : "Supprimer"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Review, Terms & Submission */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {locale === "en"
                    ? "Code of Ethics & Final Validation"
                    : "Charte Déontologique & Validation Finale"}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Verify your information before transmitting your application to administration."
                    : "Vérifiez vos informations avant de transmettre votre candidature à l'administration."}
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <span className="font-bold text-slate-800 block">
                  {locale === "en" ? "Application Summary" : "Résumé de votre candidature"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400 block">
                      {locale === "en" ? "Identity:" : "Identité :"}
                    </span>
                    <strong>{fullName}</strong> ({email})
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {locale === "en" ? "Phone:" : "Téléphone :"}
                    </span>
                    <strong>{phoneNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {locale === "en" ? "Selected Subjects:" : "Matières sélectionnées :"}
                    </span>
                    <strong>
                      {selectedSubjectIds.length}{" "}
                      {locale === "en" ? "subject(s)" : "matière(s)"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {locale === "en" ? "Grade Levels:" : "Niveaux scolaires :"}
                    </span>
                    <strong>
                      {selectedGradeLevelIds.length}{" "}
                      {locale === "en" ? "level(s)" : "niveau(x)"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {locale === "en" ? "Coverage Area:" : "Zone d'intervention :"}
                    </span>
                    <strong>{city}</strong> {serviceArea && `(${serviceArea})`}
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      {locale === "en" ? "Attached Documents:" : "Justificatifs joints :"}
                    </span>
                    <strong>
                      {uploadedDocuments.length}{" "}
                      {locale === "en" ? "document(s)" : "document(s)"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Charte Déontologique */}
              <div className="p-5 rounded-2xl border border-amber-200/80 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-[#e59a38]" />
                  <span>
                    {locale === "en"
                      ? "Monsieur Fanyi Pedagogical Engagement Charter (SRD V2.0)"
                      : "Charte d'Engagement Pédagogique Monsieur Fanyi (SRD V2.0)"}
                  </span>
                </div>

                <div className="text-[11px] text-amber-950 space-y-1.5 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-100 max-h-40 overflow-y-auto">
                  <p>
                    1. <strong>{locale === "en" ? "Excellence & Punctuality: " : "Excellence & Ponctualité : "}</strong>
                    {locale === "en"
                      ? "The teacher commits to punctuality, respectful conduct, and adhering to the National Curriculum of Guinea."
                      : "L'enseignant s'engage à respecter les horaires convenus et les programmes de l'Éducation Nationale Guinéenne."}
                  </p>
                  <p>
                    2. <strong>{locale === "en" ? "85% Remuneration: " : "Rémunération 85% : "}</strong>
                    {locale === "en"
                      ? "In accordance with SRD V2.0, the teacher receives 85% of confirmed session values, paid automatically via Orange Money or MTN."
                      : "Conformément au SRD V2.0, l'enseignant perçoit 85% de la valeur des cours confirmés par le parent, reversés automatiquement par Orange Money ou MTN."}
                  </p>
                  <p>
                    3. <strong>{locale === "en" ? "Child Protection: " : "Protection des mineurs : "}</strong>
                    {locale === "en"
                      ? "Absolute moral integrity, safety, and respect for minors during all tutoring interactions."
                      : "Engagement absolu de probité morale, de respect et de sécurité dans le cadre des cours dispensés."}
                  </p>
                  <p>
                    4. <strong>{locale === "en" ? "Credential Authenticity: " : "Exactitude des diplômes : "}</strong>
                    {locale === "en"
                      ? "The teacher certifies the authenticity of all uploaded diplomas and identity documents under penalty of permanent ban."
                      : "L'enseignant certifie sur l'honneur l'authenticité de tous les justificatifs académiques téléversés."}
                  </p>
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="rounded text-blue-600 w-4 h-4 mt-0.5"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {locale === "en"
                      ? "I have read and unconditionally accept the Monsieur Fanyi Code of Ethics (Version SRD-V2.0-2026)."
                      : "J'ai lu et j'accepte sans réserve les termes de la Charte Déontologique Monsieur Fanyi (Version SRD-V2.0-2026)."}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveOrSubmit("submit")}
                  disabled={isSaving || !termsAccepted}
                  className="w-full py-3.5 px-6 rounded-full bg-[#16385c] hover:bg-[#10243d] text-white font-bold text-sm shadow-md shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {locale === "en"
                          ? "Transmitting dossier to administration..."
                          : "Transmission du dossier à l'administration..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#e59a38]" />
                      <span>
                        {locale === "en"
                          ? "Submit My Application for Review"
                          : "Soumettre mon dossier de candidature"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Previous" : "Précédent"}</span>
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(totalSteps, s + 1))}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <span>{locale === "en" ? "Next" : "Suivant"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
