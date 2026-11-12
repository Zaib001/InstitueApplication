"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Coins,
  Edit2,
  FileText,
  GraduationCap,
  Home,
  Info,
  Laptop,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Users,
  XCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { RequestStatus, TutoringMode } from "@prisma/client";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { RequestActionDialog } from "./RequestActionDialog";
import { TutoringRequestWizard } from "./TutoringRequestWizard";
import { TeacherProfileModal, TeacherProfileModalData } from "./TeacherProfileModal";
import { CandidateSelectionDialog } from "./CandidateSelectionDialog";
import { useTranslation } from "@/lib/i18n";
import { isRequestEditable, isRequestCancellable } from "@/lib/tutoring-request/state-machine";
import { formatGnf } from "@/lib/money/currency";
import {
  BookmarkCheck,
  Check,
  Eye,
  Star,
  UserCheck,
  Award,
} from "lucide-react";

export interface DetailedRequestData {
  id: string;
  subjectId?: string | null;
  subjectName: string;
  customSubject?: string | null;
  gradeLevelName: string;
  cycle?: string | null;
  customCycle?: string | null;
  mode: TutoringMode;
  frequency?: string | null;
  preferredSchedule?: string | null;
  sessionDurationMinutes?: number;
  budgetGnf: number;
  budgetType?: string | null;
  city: string;
  commune?: string | null;
  neighborhood?: string | null;
  locationAddress?: string | null;
  learningGoals?: string | null;
  notes?: string | null;
  status: RequestStatus;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    fullName: string;
    gradeLevel?: string;
    cycle?: string | null;
    customCycle?: string | null;
    schoolName?: string | null;
  };
  classroom?: {
    id: string;
    status: string;
    isAssistedAssignment: boolean;
    hourlyRateGnf?: number | null;
    monthlyRateGnf?: number | null;
    teacherProfileId: string;
  } | null;
  applications?: Array<{
    id: string;
    status: string;
    proposedRateGnf?: number | null;
    proposedRateType?: string | null;
    sessionArrangement?: string | null;
    availabilityNotes?: string | null;
    pitchMessage?: string | null;
    rejectionReason?: string | null;
    decisionAt?: string | null;
    createdAt: string;
    teacher: {
      id: string;
      fullName: string;
      avatarUrl?: string | null;
      headline?: string | null;
      bio?: string | null;
      yearsOfExperience: number;
      city: string;
      serviceArea?: string | null;
      degrees?: string | null;
      institution?: string | null;
      isHomeAvailable: boolean;
      isOnlineAvailable: boolean;
      verificationStatus: string;
      subjects: string[];
      gradeLevels: string[];
      ratingAverage?: number | null;
      ratingsCount?: number;
    };
  }>;
  _count?: {
    applications?: number;
  };
}

interface RequestDetailsClientProps {
  initialRequest: DetailedRequestData;
  childrenList: Array<{
    id: string;
    fullName: string;
    gradeLevel: string;
    cycle?: string | null;
    customCycle?: string | null;
    preferredSubjects?: string[];
    customSubject?: string | null;
  }>;
  masterData: {
    subjects: Array<{ id: string; name: string; category?: string | null }>;
    gradeLevels: Array<{ id: string; name: string; cycle: string }>;
  };
}

export function RequestDetailsClient({
  initialRequest,
  childrenList,
  masterData,
}: RequestDetailsClientProps) {
  const router = useRouter();
  const { locale } = useTranslation();

  const [request, setRequest] = useState<DetailedRequestData>(initialRequest);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEditWizard, setShowEditWizard] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [inspectedTeacher, setInspectedTeacher] = useState<TeacherProfileModalData | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<{
    applicationId: string;
    teacherName: string;
    proposedRateGnf?: number | null;
    proposedRateType?: string | null;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleShortlist = async (appId: string) => {
    setShortlistingId(appId);
    try {
      const res = await fetch(
        `/api/parent/requests/${request.id}/applications/${appId}/shortlist`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || "Impossible de présélectionner la candidature", "error");
        setShortlistingId(null);
        return;
      }
      setRequest((prev) => ({
        ...prev,
        applications: prev.applications?.map((a) =>
          a.id === appId ? { ...a, status: "SHORTLISTED" } : a
        ),
      }));
      showFeedback(
        locale === "en"
          ? "Teacher application shortlisted!"
          : "Candidature présélectionnée avec succès !",
        "success"
      );
      router.refresh();
    } catch {
      showFeedback("Erreur de connexion", "error");
    } finally {
      setShortlistingId(null);
    }
  };

  const handleSelectionSuccess = (result: any) => {
    setSelectedCandidate(null);
    setRequest((prev) => ({
      ...prev,
      status: RequestStatus.MATCHED,
      classroom: result.classroom,
      applications: prev.applications?.map((a) => {
        if (a.id === result.application.id) {
          return { ...a, status: "ACCEPTED" };
        }
        if (a.status === "SUBMITTED" || a.status === "SHORTLISTED") {
          return { ...a, status: "REJECTED" };
        }
        return a;
      }),
    }));
    showFeedback(
      locale === "en"
        ? "Teacher successfully selected! The classroom has been created (status: Pending payment)."
        : "Professeur sélectionné avec succès ! La classe a été créée (statut : En attente de paiement).",
      "success"
    );
    router.refresh();
  };

  const canEdit = isRequestEditable(request.status);
  const canCancel = isRequestCancellable(request.status);

  // Handle Publish
  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch(`/api/parent/requests/${request.id}/publish`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || "Impossible de publier la demande", "error");
        return;
      }
      setRequest(data.request);
      showFeedback(
        locale === "en"
          ? "Your tutoring request is now published and open to verified teachers!"
          : "Votre demande de cours est maintenant publiée et ouverte aux professeurs vérifiés !",
        "success"
      );
      router.refresh();
    } catch {
      showFeedback("Erreur de connexion réseau lors de la publication.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle Cancel
  const handleConfirmCancel = async (reason?: string) => {
    try {
      const res = await fetch(`/api/parent/requests/${request.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.error || "Erreur lors de l'annulation", "error");
        return;
      }
      setRequest(data.request);
      setShowCancelDialog(false);
      showFeedback(
        locale === "en"
          ? "The tutoring request has been cancelled."
          : "La demande de cours a été annulée.",
        "success"
      );
      router.refresh();
    } catch {
      showFeedback("Erreur de communication lors de l'annulation.", "error");
    }
  };

  // Format budget display
  const formattedBudget =
    new Intl.NumberFormat("fr-GN").format(request.budgetGnf) + " GNF";
  const budgetBasisText =
    request.budgetType === "HOURLY"
      ? locale === "en"
        ? "/ hour"
        : "/ heure"
      : locale === "en"
      ? "/ month"
      : "/ mois";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <Link
          href="/parent/requests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#16385c] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>{locale === "en" ? "Back to Tutoring Requests" : "Retour à mes demandes"}</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowEditWizard(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              <span>{locale === "en" ? "Edit Request" : "Modifier la demande"}</span>
            </button>
          )}

          {request.status === RequestStatus.DRAFT && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-sm disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{locale === "en" ? "Publishing..." : "Publication..."}</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{locale === "en" ? "Publish Now" : "Publier la demande"}</span>
                </>
              )}
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>{locale === "en" ? "Cancel Request" : "Annuler"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 shadow-xs ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <RequestStatusBadge status={request.status} />
              <span className="text-xs text-slate-400">
                {locale === "en" ? "Created on" : "Créée le"}{" "}
                {new Date(request.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#16385c]">
              {request.customSubject
                ? `${request.customSubject} (${request.subjectName})`
                : request.subjectName}
            </h1>

            <p className="text-sm text-slate-600 flex items-center gap-2">
              <span className="font-medium text-slate-800">
                {request.customCycle
                  ? `${request.customCycle} — ${request.gradeLevelName}`
                  : `${request.cycle || "Enseignement"} — ${request.gradeLevelName}`}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">
                {request.frequency || "2 séances / semaine"}
              </span>
            </p>
          </div>

          <div className="text-left md:text-right bg-amber-50/60 md:bg-transparent p-3 rounded-xl md:p-0 border md:border-0 border-amber-100">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              {locale === "en" ? "Budget Allocated" : "Budget Alloué"}
            </div>
            <div className="text-2xl font-black text-[#16385c]">
              {formattedBudget}
              <span className="text-sm font-semibold text-slate-500 ml-1">
                {budgetBasisText}
              </span>
            </div>
          </div>
        </div>

        {/* Cancellation Notice if Cancelled */}
        {request.status === RequestStatus.CANCELLED && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800">
                {locale === "en"
                  ? "This request was cancelled."
                  : "Cette demande a été annulée."}
              </p>
              {request.cancelledAt && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "en" ? "Cancelled on" : "Annulée le"}{" "}
                  {new Date(request.cancelledAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
              {request.cancellationReason && (
                <p className="text-xs text-slate-600 mt-1 italic">
                  « {request.cancellationReason} »
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Student Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800">
              {locale === "en" ? "Student Information" : "Fiche de l'Élève"}
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Full Name" : "Nom & Prénom"}
              </span>
              <span className="font-semibold text-[#16385c] text-base">
                {request.student.fullName}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Level & Grade" : "Niveau & Classe"}
              </span>
              <span className="text-slate-700">
                {request.student.gradeLevel || request.gradeLevelName}
              </span>
            </div>

            {request.student.schoolName && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {locale === "en" ? "Current School" : "Établissement scolaire"}
                </span>
                <span className="text-slate-700">{request.student.schoolName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Logistics & Mode */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800">
              {locale === "en" ? "Modality & Location" : "Format & Localisation"}
            </h2>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Teaching Mode" : "Mode d'enseignement"}
              </span>
              <span className="font-semibold text-slate-700 flex items-center gap-1.5 mt-0.5">
                {request.mode === "HOME" ? (
                  <>
                    <Home className="w-4 h-4 text-emerald-600" />
                    <span>{locale === "en" ? "In-Home (Face to face)" : "À domicile (Présentiel)"}</span>
                  </>
                ) : request.mode === "ONLINE" ? (
                  <>
                    <Laptop className="w-4 h-4 text-blue-600" />
                    <span>{locale === "en" ? "Online (Remote)" : "En ligne (Visioconférence)"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>{locale === "en" ? "Hybrid (Home & Online)" : "Hybride (Mixte)"}</span>
                  </>
                )}
              </span>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Zone / Location" : "Zone géographique"}
              </span>
              <span className="text-slate-700">
                {request.commune
                  ? `${request.commune}${request.neighborhood ? ` (${request.neighborhood})` : ""}, ${request.city}`
                  : request.city}
              </span>
            </div>

            {request.preferredSchedule && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {locale === "en" ? "Preferred Schedule" : "Créneaux souhaités"}
                </span>
                <span className="text-slate-700 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{request.preferredSchedule}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Educational Goals & Needs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800">
              {locale === "en" ? "Pedagogical Needs & Goals" : "Objectifs & Besoins Pédagogiques"}
            </h2>
          </div>

          <div className="space-y-4 text-sm">
            {request.learningGoals ? (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {locale === "en" ? "Learning Goals" : "Objectifs d'apprentissage"}
                </span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {request.learningGoals}
                </p>
              </div>
            ) : (
              <p className="text-slate-400 italic">
                {locale === "en"
                  ? "No specific learning goals detailed."
                  : "Aucun objectif particulier spécifié."}
              </p>
            )}

            {request.notes && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {locale === "en" ? "Additional Notes" : "Remarques complémentaires"}
                </span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {request.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Teacher Applications */}
      <div id="applications" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4 scroll-mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">
                {locale === "en" ? "Teacher Applications" : "Candidatures des Professeurs"}
              </h2>
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? "Verified teachers interested in accompanying your child"
                  : "Professeurs vérifiés intéressés pour accompagner votre enfant"}
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {request.applications?.length || 0}{" "}
            {locale === "en" ? "application(s)" : "candidature(s)"}
          </span>
        </div>

        {/* Informative state depending on status */}
        {(!request.applications || request.applications.length === 0) ? (
          <div className="py-8 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>

            {request.status === RequestStatus.OPEN ? (
              <div className="max-w-md mx-auto space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  {locale === "en"
                    ? "Your request is live on the marketplace"
                    : "Votre demande est visible par les professeurs vérifiés"}
                </p>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Qualified teachers in Conakry are reviewing your request. You will be notified as soon as a teacher applies."
                    : "Les professeurs vérifiés de Conakry examinent actuellement votre demande. Vous recevrez une notification dès qu'un enseignant postule."}
                </p>
              </div>
            ) : request.status === RequestStatus.DRAFT ? (
              <div className="max-w-md mx-auto space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  {locale === "en" ? "Draft Request" : "Demande en brouillon"}
                </p>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "This request is not visible to teachers yet. Publish it to start receiving qualified teacher applications."
                    : "Cette demande n'est pas encore visible. Publiez-la pour commencer à recevoir des candidatures de professeurs qualifiés."}
                </p>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Publish Request" : "Publier la demande"}</span>
                </button>
              </div>
            ) : request.status === RequestStatus.CANCELLED ? (
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? "This request was cancelled. No applications can be submitted."
                  : "Cette demande a été annulée. Aucune candidature ne peut être déposée."}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? "No applications found."
                  : "Aucune candidature pour le moment."}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Matched / Classroom Banner */}
            {request.classroom && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      {locale === "en" ? "Tutoring Class Created!" : "Classe de Soutien Créée !"}
                    </h4>
                    <p className="text-xs text-emerald-800">
                      {locale === "en"
                        ? "A teacher has been assigned to this request. Status: "
                        : "Un professeur a été validé pour cette demande. Statut : "}
                      <span className="font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                        {request.classroom.status === "PENDING_PAYMENT"
                          ? locale === "en" ? "Pending Payment" : "En attente de paiement initial"
                          : request.classroom.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="text-xs text-emerald-900 bg-white/70 px-3 py-2 rounded-xl border border-emerald-200/60">
                  <span className="font-semibold block">
                    {locale === "en" ? "Advance Payment Rule" : "Règle de prépaiement"}
                  </span>
                  <span>
                    {locale === "en"
                      ? "Lessons can start as soon as the first payment order is settled."
                      : "Les séances démarrent dès le règlement de la première provision."}
                  </span>
                </div>
              </div>
            )}

            {/* List of Applications */}
            <div className="grid grid-cols-1 gap-4">
              {request.applications.map((app) => {
                const isAccepted = app.status === "ACCEPTED";
                const isShortlisted = app.status === "SHORTLISTED";
                const isSubmitted = app.status === "SUBMITTED";
                const isRejected = app.status === "REJECTED";
                const canInteract =
                  request.status === RequestStatus.OPEN &&
                  (isSubmitted || isShortlisted);

                return (
                  <div
                    key={app.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isAccepted
                        ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/20"
                        : isShortlisted
                        ? "bg-amber-50/20 border-amber-200"
                        : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                    }`}
                  >
                    {/* Header: Teacher Info & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#16385c]/10 text-[#16385c] font-bold text-base flex items-center justify-center shrink-0">
                          {app.teacher.avatarUrl ? (
                            <img
                              src={app.teacher.avatarUrl}
                              alt={app.teacher.fullName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            app.teacher.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">
                              {app.teacher.fullName}
                            </h4>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" />
                              <span>{locale === "en" ? "Verified" : "Vérifié"}</span>
                            </span>
                          </div>
                          {app.teacher.headline && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {app.teacher.headline}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">
                              {app.teacher.yearsOfExperience}{" "}
                              {locale === "en" ? "years exp." : "ans d'exp."}
                            </span>
                            <span>•</span>
                            <span>{app.teacher.city || "Conakry"}</span>
                            {app.teacher.serviceArea && (
                              <>
                                <span>•</span>
                                <span className="text-slate-400">{app.teacher.serviceArea}</span>
                              </>
                            )}
                          </div>

                          {/* Teaching Subjects */}
                          {app.teacher.subjects && app.teacher.subjects.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {locale === "en" ? "Subjects:" : "Matières :"}
                              </span>
                              {app.teacher.subjects.map((subj) => (
                                <span
                                  key={subj}
                                  className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100"
                                >
                                  {subj}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Grade Levels */}
                          {app.teacher.gradeLevels && app.teacher.gradeLevels.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                {locale === "en" ? "Levels:" : "Niveaux :"}
                              </span>
                              {app.teacher.gradeLevels.map((lvl) => (
                                <span
                                  key={lvl}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                                >
                                  {lvl}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Degrees & Qualifications */}
                          {(app.teacher.degrees || app.teacher.institution) && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                              <GraduationCap className="w-3.5 h-3.5 text-[#16385c] shrink-0" />
                              <span className="truncate">
                                {[app.teacher.degrees, app.teacher.institution].filter(Boolean).join(" • ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status & Pricing */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
                        <div>
                          {isAccepted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{locale === "en" ? "Teacher Selected" : "Professeur Retenu"}</span>
                            </span>
                          ) : isShortlisted ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <BookmarkCheck className="w-3.5 h-3.5" />
                              <span>{locale === "en" ? "Shortlisted" : "Présélectionnée"}</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <span>{locale === "en" ? "Not Retained" : "Non retenue"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <span>{locale === "en" ? "Application Received" : "Candidature reçue"}</span>
                            </span>
                          )}
                        </div>

                        {app.proposedRateGnf && (
                          <div className="text-right">
                            <span className="font-bold text-slate-900 text-sm">
                              {formatGnf(app.proposedRateGnf)}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1">
                              {app.proposedRateType === "HOURLY"
                                ? locale === "en" ? "/hour" : "/h"
                                : locale === "en" ? "/month" : "/mois"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: Motivation Pitch */}
                    {app.pitchMessage && (
                      <div className="my-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                        &laquo; {app.pitchMessage} &raquo;
                      </div>
                    )}

                    {/* Session arrangement & Availability details */}
                    {(app.sessionArrangement || app.availabilityNotes) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                        {app.sessionArrangement && (
                          <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              {locale === "en" ? "Proposed Schedule / Sessions" : "Rythme & Séances proposés"}
                            </span>
                            <span className="text-slate-700 font-medium">{app.sessionArrangement}</span>
                          </div>
                        )}
                        {app.availabilityNotes && (
                          <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              {locale === "en" ? "Availability Notes" : "Disponibilités"}
                            </span>
                            <span className="text-slate-700 font-medium">{app.availabilityNotes}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer: Date & Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        {locale === "en" ? "Received on " : "Reçue le "}
                        {new Date(app.createdAt).toLocaleDateString(
                          locale === "en" ? "en-US" : "fr-FR",
                          { day: "numeric", month: "long", year: "numeric" }
                        )}
                      </span>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* Inspect Dossier Modal */}
                        <button
                          type="button"
                          onClick={() => setInspectedTeacher(app.teacher)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{locale === "en" ? "Inspect Dossier" : "Examiner le profil"}</span>
                        </button>

                        {/* Shortlist Action */}
                        {canInteract && isSubmitted && (
                          <button
                            type="button"
                            onClick={() => handleShortlist(app.id)}
                            disabled={shortlistingId === app.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
                          >
                            {shortlistingId === app.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <BookmarkCheck className="w-3.5 h-3.5" />
                            )}
                            <span>{locale === "en" ? "Shortlist" : "Présélectionner"}</span>
                          </button>
                        )}

                        {/* Select Teacher Action */}
                        {canInteract && (
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCandidate({
                                applicationId: app.id,
                                teacherName: app.teacher.fullName,
                                proposedRateGnf: app.proposedRateGnf,
                                proposedRateType: app.proposedRateType,
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>
                              {locale === "en" ? "Select this Teacher" : "Choisir ce professeur"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Wizard Modal */}
      {showEditWizard && (
        <TutoringRequestWizard
          initialData={{
            id: request.id,
            subjectName: request.subjectName,
            customSubject: request.customSubject,
            gradeLevelName: request.gradeLevelName,
            cycle: request.cycle,
            customCycle: request.customCycle,
            mode: request.mode,
            frequency: request.frequency,
            preferredSchedule: request.preferredSchedule,
            budgetGnf: request.budgetGnf,
            budgetType: request.budgetType,
            city: request.city,
            commune: request.commune,
            neighborhood: request.neighborhood,
            learningGoals: request.learningGoals,
            status: request.status,
            student: request.student,
            createdAt: request.createdAt,
          }}
          childrenList={childrenList}
          availableSubjects={masterData.subjects}
          gradeLevels={masterData.gradeLevels}
          onSaveSuccess={(savedReq) => {
            setShowEditWizard(false);
            setRequest((prev) => ({
              ...prev,
              ...savedReq,
            }));
            showFeedback(
              locale === "en"
                ? "Tutoring request successfully updated!"
                : "Demande de cours mise à jour avec succès !",
              "success"
            );
          }}
          onCancel={() => setShowEditWizard(false)}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <RequestActionDialog
          request={{
            id: request.id,
            subjectName: request.subjectName,
            customSubject: request.customSubject,
            gradeLevelName: request.gradeLevelName,
            mode: request.mode,
            budgetGnf: request.budgetGnf,
            city: request.city,
            status: request.status,
            createdAt: request.createdAt,
            student: request.student,
          }}
          onConfirm={handleConfirmCancel}
          onClose={() => setShowCancelDialog(false)}
        />
      )}

      {/* Inspect Teacher Dossier Modal */}
      {inspectedTeacher && (
        <TeacherProfileModal
          teacher={inspectedTeacher}
          onClose={() => setInspectedTeacher(null)}
        />
      )}

      {/* Candidate Selection Confirmation Dialog */}
      {selectedCandidate && (
        <CandidateSelectionDialog
          requestId={request.id}
          applicationId={selectedCandidate.applicationId}
          teacherName={selectedCandidate.teacherName}
          studentName={request.student.fullName}
          subjectName={request.subjectName}
          proposedRateGnf={selectedCandidate.proposedRateGnf}
          proposedRateType={selectedCandidate.proposedRateType}
          onConfirmSuccess={handleSelectionSuccess}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}
