"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  Edit2,
  Trash2,
  School,
  Calendar,
  BookOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Archive,
  Layers,
  FileText,
  User,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { StudentCardData } from "./StudentCard";
import { StudentProfileForm } from "./StudentProfileForm";
import { ConfirmStudentActionDialog } from "./ConfirmStudentActionDialog";
import { GradeLevelOption } from "./EducationLevelSelect";
import { SubjectOption } from "./SubjectSelector";

interface StudentDetailsClientProps {
  student: StudentCardData & {
    classrooms?: Array<{
      id: string;
      subjectName: string;
      status: string;
      teacherProfile?: {
        user?: {
          fullName: string;
          avatarUrl: string | null;
        };
      };
    }>;
    tutoringRequests?: Array<{
      id: string;
      subjectName: string;
      gradeLevelName: string;
      status: string;
      createdAt: string;
    }>;
  };
  masterData: {
    gradeLevels: GradeLevelOption[];
    subjects: SubjectOption[];
  };
}

export function StudentDetailsClient({
  student: initialStudent,
  masterData,
}: StudentDetailsClientProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [student, setStudent] = useState(initialStudent);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const cycleColors: Record<string, { bg: string; text: string; border: string }> = {
    PRIMAIRE: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    COLLEGE: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    LYCEE: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    SUPERIEUR: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  };

  const cycleStyle = student.cycle && cycleColors[student.cycle.toUpperCase()]
    ? cycleColors[student.cycle.toUpperCase()]
    : { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };

  const handleStudentUpdated = (updated: StudentCardData) => {
    setStudent((prev) => ({ ...prev, ...updated }));
    setShowEditModal(false);
    setSuccessBanner(
      locale === "en"
        ? "Student details updated successfully."
        : "La fiche de l'élève a été mise à jour avec succès."
    );
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/parent/children/${student.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur de suppression.");
      }

      router.push("/parent/dashboard");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/parent/dashboard"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-xs"
            title={locale === "en" ? "Back to Dashboard" : "Retour au tableau de bord"}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {locale === "en" ? "Student Dossier" : "Fiche Élève"}
              </span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs text-slate-500 font-medium">
                {student.fullName}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading">
              {student.fullName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{locale === "en" ? "Edit Profile" : "Modifier la fiche"}</span>
          </button>

          {!student.isArchived && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Remove / Archive" : "Archiver"}</span>
            </button>
          )}

          <LanguageSwitcher />
        </div>
      </div>

      {/* Success Notification */}
      {successBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successBanner}</span>
        </div>
      )}

      {/* Main Student Overview Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Academic Profile Overview */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Identity & Schooling */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#16385c] to-blue-700 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {student.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {student.gradeLevel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {student.isArchived && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5" />
                    <span>{t("parent.archivedBadge", "Archivé")}</span>
                  </span>
                )}
                {student.cycle && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${cycleStyle.bg} ${cycleStyle.text} ${cycleStyle.border}`}
                  >
                    {student.cycle}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  {locale === "en" ? "School / Institution" : "Établissement scolaire"}
                </span>
                <span className="font-semibold text-slate-800">
                  {student.schoolName || (locale === "en" ? "Not specified" : "Non renseigné")}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                  {locale === "en" ? "Date of Birth" : "Date de naissance"}
                </span>
                <span className="font-semibold text-slate-800">
                  {student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString(
                        locale === "en" ? "en-US" : "fr-FR",
                        { day: "numeric", month: "long", year: "numeric" }
                      )
                    : (locale === "en" ? "Not specified" : "Non renseignée")}
                </span>
              </div>
            </div>

            {/* Target Subjects */}
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                {locale === "en" ? "Target Tutoring Subjects:" : "Matières cibles de soutien :"}
              </span>
              {student.preferredSubjects && student.preferredSubjects.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {student.preferredSubjects.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  {locale === "en"
                    ? "No specific subjects selected."
                    : "Aucune matière prioritaire spécifiée."}
                </span>
              )}
            </div>

            {/* Academic Support Needs */}
            <div className="space-y-1 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                {locale === "en"
                  ? "Academic Support Needs & Objectives:"
                  : "Besoins d'accompagnement & Objectifs académiques :"}
              </span>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 leading-relaxed">
                {student.supportNeeds ||
                  (locale === "en"
                    ? "No specific support needs noted."
                    : "Aucun besoin spécifique renseigné.")}
              </div>
            </div>

            {/* Confidential Notes */}
            {student.notes && (
              <div className="space-y-1 pt-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {locale === "en"
                      ? "Confidential Educational Observations:"
                      : "Remarques éducatives confidentielles :"}
                  </span>
                </span>
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-950 leading-relaxed">
                  {student.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tutoring Requests & Classrooms (P04.07) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Classes Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Enrolled Classes" : "Classes actives & Tuteurs"}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {student.classrooms?.length || 0}
              </span>
            </div>

            {student.classrooms && student.classrooms.length > 0 ? (
              <div className="space-y-2">
                {student.classrooms.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {c.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {locale === "en" ? "Teacher: " : "Professeur : "}
                        {c.teacherProfile?.user?.fullName || "Professeur certifié"}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                <span className="text-xs text-slate-400 block">
                  {locale === "en"
                    ? "No active classroom currently enrolled."
                    : "Aucune classe active pour le moment."}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {locale === "en"
                    ? "Enrollment will appear here after teacher matching in Milestone 2."
                    : "L'inscription sera active dès l'assignation d'un tuteur."}
                </span>
              </div>
            )}
          </div>

          {/* Tutoring Requests Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-800">
                  {locale === "en" ? "Tutoring Requests History" : "Demandes de soutien scolaire"}
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                {student.tutoringRequests?.length || 0}
              </span>
            </div>

            {student.tutoringRequests && student.tutoringRequests.length > 0 ? (
              <div className="space-y-2">
                {student.tutoringRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {req.subjectName}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {req.gradeLevelName} •{" "}
                        {new Date(req.createdAt).toLocaleDateString(
                          locale === "en" ? "en-US" : "fr-FR"
                        )}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                <span className="text-xs text-slate-400 block">
                  {locale === "en"
                    ? "No tutoring requests submitted yet."
                    : "Aucune demande de cours soumise pour cet élève."}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {locale === "en"
                    ? "You will be able to request a tutor directly in the next milestone."
                    : "Vous pourrez publier une demande dès la mise en relation activée."}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {showEditModal && (
        <StudentProfileForm
          initialData={student}
          gradeLevels={masterData.gradeLevels}
          availableSubjects={masterData.subjects}
          onSaveSuccess={handleStudentUpdated}
          onCancel={() => setShowEditModal(false)}
        />
      )}

      {/* Confirm Deletion/Archival Dialog */}
      {showDeleteModal && (
        <ConfirmStudentActionDialog
          student={student}
          isLoading={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
