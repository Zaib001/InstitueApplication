"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileCheck,
  Eye,
  Calendar,
  MapPin,
  BookOpen,
  DollarSign,
  ShieldCheck,
  Mail,
  Phone,
  Loader2,
  FileText,
  History,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface DocumentItem {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verifiedAt: string | null;
  createdAt: string;
}

interface TeacherDetailProfile {
  id: string;
  userId: string;
  headline: string | null;
  bio: string | null;
  city: string;
  serviceArea: string | null;
  yearsOfExperience: number;
  degrees: string | null;
  institution: string | null;
  isHomeAvailable: boolean;
  isOnlineAvailable: boolean;
  monthlyPackageRateGnf: number;
  monthlyPackageSessions: number;
  monthlyPackageHoursPerSession: number;
  verificationStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  verifiedAt: string | null;
  reviewerId: string | null;
  termsAccepted: boolean;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    createdAt: string;
    isActive: boolean;
  };
  subjects: Array<{
    id: string;
    subject: { id: string; name: string };
  }>;
  gradeLevels: Array<{
    id: string;
    gradeLevel: { id: string; name: string; cycle: string };
  }>;
  availabilities: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
  documents: DocumentItem[];
}

interface AuditLogItem {
  id: string;
  action: string;
  createdAt: string;
  detailsJson: string | null;
}

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AdminVerificationDetailClient({ teacherId }: { teacherId: string }) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [profile, setProfile] = useState<TeacherDetailProfile | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/verifications/${teacherId}`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push("/login?callbackUrl=/admin/verifications");
          return;
        }
        throw new Error(
          locale === "en" ? "Teacher dossier not found." : "Dossier enseignant introuvable."
        );
      }
      const data = await res.json();
      setProfile(data.profile);
      setAuditLogs(data.auditLogs || []);
    } catch (err: any) {
      setError(err.message || (locale === "en" ? "Error loading application." : "Erreur de chargement."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (teacherId) {
      fetchDetail();
    }
  }, [teacherId]);

  const handleApprove = async () => {
    if (!profile) return;
    const confirmText =
      locale === "en"
        ? `Are you sure you want to approve ${profile.user.fullName}?`
        : `Confirmez-vous l'approbation du dossier de ${profile.user.fullName} ?`;
    if (!window.confirm(confirmText)) return;

    setIsApproving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/verifications/${profile.id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (locale === "en" ? "Approval failed." : "Erreur lors de l'approbation."));
      }
      setActionSuccess(
        locale === "en"
          ? "Application approved successfully! The tutor is now verified."
          : "Candidature approuvée avec succès ! L'enseignant a été notifié."
      );
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !rejectionReason.trim()) return;

    setIsRejecting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch(`/api/admin/verifications/${profile.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (locale === "en" ? "Rejection failed." : "Erreur lors du rejet."));
      }
      setShowRejectModal(false);
      setRejectionReason("");
      setActionSuccess(
        locale === "en"
          ? "Application returned for corrections with reason provided."
          : "Candidature retournée avec motif explicatif."
      );
      fetchDetail();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            {locale === "en" ? "Loading teacher dossier..." : "Chargement du dossier de vérification..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center shadow-xs space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">
            {locale === "en" ? "Application Not Found" : "Dossier introuvable"}
          </h2>
          <p className="text-xs text-slate-600">{error || "Impossible de charger les détails du profil."}</p>
          <Link
            href="/admin/verifications"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#16385c] text-white rounded-xl text-xs font-semibold hover:bg-[#10243d] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {locale === "en" ? "Back to Verification Queue" : "Retour à la file de vérification"}
          </Link>
        </div>
      </div>
    );
  }

  const daysLabels = locale === "en" ? DAYS_EN : DAYS_FR;
  const hasIdentityDoc = profile.documents.some(
    (d) => d.type === "NATIONAL_ID" || d.type === "PASSPORT"
  );
  const hasDiplomaDoc = profile.documents.some((d) => d.type === "DIPLOMA");

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/verifications"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title={locale === "en" ? "Back to queue" : "Retour à la file"}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {locale === "en" ? "Admin Console" : "Console Admin"}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-500 font-medium">
                {locale === "en" ? "Dossier Inspection" : "Inspection du Dossier"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading">
              {profile.user.fullName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{actionError}</span>
        </div>
      )}

      {/* Verification Status Banner & Action Buttons */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#16385c] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-sm">
            {profile.user.avatarUrl ? (
              <img
                src={profile.user.avatarUrl}
                alt={profile.user.fullName}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              profile.user.fullName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900">{profile.user.fullName}</h2>
              {/* Status Badge */}
              {profile.verificationStatus === "APPROVED" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {locale === "en" ? "Verified & Approved" : "Dossier Validé & Approuvé"}
                </span>
              )}
              {profile.verificationStatus === "PENDING_REVIEW" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {locale === "en" ? "Pending Review" : "En attente de validation"}
                </span>
              )}
              {profile.verificationStatus === "REJECTED" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  {locale === "en" ? "Changes Requested" : "Dossier Rejeté / Complément requis"}
                </span>
              )}
              {profile.verificationStatus === "DRAFT" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  {locale === "en" ? "Draft" : "Brouillon non soumis"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {profile.headline || (locale === "en" ? "Private Tutor" : "Enseignant particulier")}
            </p>
            <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {profile.user.email}
              </span>
              {profile.user.phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {profile.user.phoneNumber}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profile.city} {profile.serviceArea ? `(${profile.serviceArea})` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {profile.verificationStatus !== "APPROVED" && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={isApproving || !hasIdentityDoc || !hasDiplomaDoc}
              title={
                !hasIdentityDoc || !hasDiplomaDoc
                  ? (locale === "en" ? "Missing mandatory ID or Diploma" : "Pièces justificatives obligatoires manquantes")
                  : ""
              }
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {locale === "en" ? "Approve Tutor" : "Valider le professeur"}
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-5 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-rose-600" />
            {locale === "en" ? "Reject / Request Corrections" : "Rejeter / Demander complément"}
          </button>
        </div>
      </div>

      {/* Rejection notice if existing */}
      {profile.verificationStatus === "REJECTED" && profile.rejectionReason && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold">
              {locale === "en" ? "Reason for rejection transmitted to teacher:" : "Motif de rejet transmis à l'enseignant :"}
            </h4>
            <p className="text-xs mt-1 text-rose-800 whitespace-pre-line">{profile.rejectionReason}</p>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pedagogy & Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio & Education */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              {locale === "en" ? "Academic Background & Presentation" : "Qualifications & Présentation"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {locale === "en" ? "Bio & Teaching Method" : "Biographie & Approche Pédagogique"}
                </label>
                <p className="text-slate-700 mt-1 whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                  {profile.bio || (locale === "en" ? "No presentation entered." : "Aucune présentation renseignée.")}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {locale === "en" ? "Experience" : "Expérience"}
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {profile.yearsOfExperience} {locale === "en" ? "years" : "ans"}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {locale === "en" ? "Highest Degree" : "Diplôme le plus élevé"}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {profile.degrees || (locale === "en" ? "Not specified" : "Non renseigné")}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {locale === "en" ? "University / School" : "Établissement d'origine"}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {profile.institution || (locale === "en" ? "Not specified" : "Non renseigné")}
                  </span>
                </div>
              </div>

              {/* Pricing & Formats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-0.5">
                    {locale === "en" ? "Monthly Package Rate" : "Forfait Mensuel Recommandé"}
                  </span>
                  <div className="text-lg font-black text-blue-900">
                    {new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-GN").format(
                      profile.monthlyPackageRateGnf || 0
                    )}{" "}
                    GNF
                  </div>
                  <span className="text-[11px] text-blue-600 mt-0.5 block font-medium">
                    {profile.monthlyPackageSessions} {locale === "en" ? "sessions/mo" : "séances/mois"} •{" "}
                    {profile.monthlyPackageHoursPerSession}h / {locale === "en" ? "session" : "séance"}
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    {locale === "en" ? "Delivery Modes" : "Modes d'enseignement"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        profile.isHomeAvailable
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-400 line-through"
                      }`}
                    >
                      {locale === "en" ? "In-Home" : "À Domicile"}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        profile.isOnlineAvailable
                          ? "bg-purple-100 text-purple-800"
                          : "bg-slate-200 text-slate-400 line-through"
                      }`}
                    >
                      {locale === "en" ? "Online" : "En Ligne"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects & Cycles */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              {locale === "en" ? "Subjects & Educational Cycles" : "Matières & Cycles Enseignés"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {locale === "en" ? "Assigned Subjects" : "Matières enseignées"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.subjects.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 font-semibold"
                    >
                      {s.subject.name}
                    </span>
                  ))}
                  {profile.subjects.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      {locale === "en" ? "No subjects selected." : "Aucune matière sélectionnée."}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {locale === "en" ? "Supported Educational Cycles" : "Cycles scolaires pris en charge"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {profile.gradeLevels.map((g) => (
                    <span
                      key={g.id}
                      className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                    >
                      {g.gradeLevel.name} ({g.gradeLevel.cycle})
                    </span>
                  ))}
                  {profile.gradeLevels.length === 0 && (
                    <span className="text-xs text-slate-400 italic">
                      {locale === "en" ? "No cycles selected." : "Aucun cycle sélectionné."}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Availability Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              {locale === "en" ? "Weekly Availabilities" : "Disponibilités Hebdomadaires"}
            </h3>

            {profile.availabilities.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                {locale === "en" ? "No availability slots entered." : "Aucune plage horaire renseignée."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
                  const daySlots = profile.availabilities.filter((a) => a.dayOfWeek === dayIdx);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={dayIdx} className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 block mb-1.5">
                        {daysLabels[dayIdx]}
                      </span>
                      <div className="space-y-1">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="text-xs bg-white px-2 py-1 rounded-lg border border-slate-200 font-medium text-slate-800 flex items-center gap-1.5"
                          >
                            <Clock className="w-3 h-3 text-slate-400" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Documents Vault & Compliance */}
        <div className="space-y-6">
          {/* Documents Vault */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                {locale === "en" ? "Documents Vault" : "Pièces Justificatives"}
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {profile.documents.length}
              </span>
            </div>

            {/* Checklist */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                {hasIdentityDoc ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className={hasIdentityDoc ? "text-slate-800 font-semibold" : "text-rose-600 font-semibold"}>
                  {locale === "en" ? "National ID / Passport" : "Pièce d'identité (CNI / Passeport)"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasDiplomaDoc ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className={hasDiplomaDoc ? "text-slate-800 font-semibold" : "text-rose-600 font-semibold"}>
                  {locale === "en" ? "Academic Diploma" : "Diplôme le plus élevé"}
                </span>
              </div>
            </div>

            {/* Document Cards */}
            <div className="space-y-2.5">
              {profile.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-200 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate block">
                        {doc.title || doc.fileName}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          doc.status === "VERIFIED"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{(doc.fileSizeBytes / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>

                  <a
                    href={`/api/teacher/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                    title={locale === "en" ? "View document securely" : "Visualiser le document"}
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                </div>
              ))}

              {profile.documents.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">
                  {locale === "en" ? "No documents uploaded." : "Aucun document n'a été déposé."}
                </p>
              )}
            </div>
          </div>

          {/* Legal Compliance */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              {locale === "en" ? "Legal Compliance & Terms" : "Engagement & Conditions"}
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>{locale === "en" ? "Terms Version" : "Version des termes"}</span>
                <span className="font-bold text-slate-800">{profile.termsVersion || "SRD_V2.0"}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>{locale === "en" ? "Terms Accepted" : "Termes acceptés"}</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {profile.termsAccepted ? (locale === "en" ? "Yes" : "Oui") : (locale === "en" ? "No" : "Non")}
                </span>
              </div>
              {profile.termsAcceptedAt && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span>{locale === "en" ? "Acceptance Date" : "Date d'acceptation"}</span>
                  <span className="font-semibold text-slate-700">
                    {new Date(profile.termsAcceptedAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-GN")}
                  </span>
                </div>
              )}
              <div className="p-3 rounded-xl bg-indigo-50/70 text-indigo-900 border border-indigo-100 text-[11px] leading-relaxed">
                {locale === "en"
                  ? "Tutor has accepted the Monsieur Fanyi code of ethics and 15% platform / 85% tutor net earnings financial distribution."
                  : "L'enseignant s'est engagé à respecter la charte éthique Monsieur Fanyi et la répartition financière 15% plateforme / 85% tuteur."}
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              {locale === "en" ? "Audit Trail" : "Historique & Traçabilité"}
            </h3>

            <div className="space-y-2.5">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs border-l-2 border-blue-500 pl-3 py-1">
                  <span className="font-bold text-slate-800 block">{log.action}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString(locale === "en" ? "en-US" : "fr-GN")}
                  </span>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <span className="text-xs text-slate-400 italic">
                  {locale === "en" ? "No events recorded." : "Aucun événement enregistré."}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {locale === "en" ? "Reject or Request Changes" : "Demander un complément / Rejeter"}
                </h3>
                <p className="text-xs text-slate-500">
                  {locale === "en"
                    ? "Explain clearly what the teacher needs to correct or upload."
                    : "Expliquez avec clarté les motifs du rejet ou les pièces manquantes."}
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {locale === "en" ? "Explanation for Teacher (Required)" : "Motif explicatif pour l'enseignant (Obligatoire)"}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    locale === "en"
                      ? "e.g., The diploma copy is blurry, please upload a clearer scan of your Bachelor's degree."
                      : "Ex : La photo de votre diplôme est illisible. Merci de téléverser une copie scannée nette de votre Licence."
                  }
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
                <span className="text-[10px] text-slate-400">Min. 5 caractères.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {locale === "en" ? "Cancel" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={isRejecting || rejectionReason.trim().length < 5}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isRejecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {locale === "en" ? "Confirm Rejection" : "Confirmer le rejet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
