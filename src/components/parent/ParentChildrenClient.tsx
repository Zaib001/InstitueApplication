"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  BookOpen,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { StudentCardData } from "./StudentCard";
import { StudentList } from "./StudentList";
import { StudentProfileForm } from "./StudentProfileForm";
import { ConfirmStudentActionDialog } from "./ConfirmStudentActionDialog";
import { GradeLevelOption } from "./EducationLevelSelect";
import { SubjectOption } from "./SubjectSelector";

interface ParentChildrenClientProps {
  initialChildren: StudentCardData[];
  masterData: {
    gradeLevels: GradeLevelOption[];
    subjects: SubjectOption[];
  };
  totalRequestsCount: number;
  activeClassesCount: number;
}

export function ParentChildrenClient({
  initialChildren,
  masterData,
  totalRequestsCount,
  activeClassesCount,
}: ParentChildrenClientProps) {
  const { locale } = useTranslation();

  const [childrenList, setChildrenList] = useState<StudentCardData[]>(initialChildren);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentCardData | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success Notification
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);

  const activeChildrenCount = childrenList.filter((c) => !c.isArchived).length;

  // Handle successful student creation
  const handleStudentCreated = (newStudent: StudentCardData) => {
    setChildrenList((prev) => [newStudent, ...prev]);
    setShowAddStudentModal(false);
    setBannerSuccess(
      locale === "en"
        ? `Student profile for "${newStudent.fullName}" created successfully.`
        : `Profil élève créé avec succès pour "${newStudent.fullName}".`
    );
    setTimeout(() => setBannerSuccess(null), 5000);
  };

  // Handle successful student edit
  const handleStudentUpdated = (updatedStudent: StudentCardData) => {
    setChildrenList((prev) =>
      prev.map((item) => (item.id === updatedStudent.id ? updatedStudent : item))
    );
    setEditingStudent(null);
    setBannerSuccess(
      locale === "en"
        ? `Student profile for "${updatedStudent.fullName}" updated successfully.`
        : `Fiche de "${updatedStudent.fullName}" mise à jour avec succès.`
    );
    setTimeout(() => setBannerSuccess(null), 5000);
  };

  // Handle student deletion or archival
  const handleConfirmDeleteStudent = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/parent/children/${deletingStudent.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur lors de la suppression.");
      }

      if (json.action === "ARCHIVED") {
        setChildrenList((prev) =>
          prev.map((item) =>
            item.id === deletingStudent.id ? { ...item, isArchived: true } : item
          )
        );
        setBannerSuccess(
          locale === "en"
            ? `Student "${deletingStudent.fullName}" was archived to protect lesson records.`
            : `L'élève "${deletingStudent.fullName}" a été archivé pour conserver l'historique pédagogique.`
        );
      } else {
        setChildrenList((prev) => prev.filter((item) => item.id !== deletingStudent.id));
        setBannerSuccess(
          locale === "en"
            ? `Student profile "${deletingStudent.fullName}" was removed.`
            : `Profil élève "${deletingStudent.fullName}" supprimé.`
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
      setDeletingStudent(null);
      setTimeout(() => setBannerSuccess(null), 5000);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              {locale === "en" ? "Parent Space" : "Espace Famille"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "My Children" : "Mes Enfants"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en" ? "My Children & Student Dossiers" : "Mes Enfants & Profils Scolaires"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Manage your children's educational profiles, view academic needs, and create tutoring requests."
              : "Gérez les parcours scolaires de vos enfants, renseignez leurs besoins et lancez des demandes de cours."}
          </p>
        </div>

        {/* Action Controls: Primary Add Child Button & Language Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddStudentModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#1f4a7a] active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-900/10 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#e59a38] shrink-0" />
            <span>{locale === "en" ? "Add a Child" : "Ajouter un enfant"}</span>
          </button>
          <NotificationBell variant="light" />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Success Notification Banner */}
      {bannerSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{bannerSuccess}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Children */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Registered Children" : "Enfants Inscrits"}
            </span>
            <div className="text-xl font-black text-slate-800">
              {activeChildrenCount}{" "}
              <span className="text-xs font-semibold text-slate-500">
                {activeChildrenCount > 1
                  ? locale === "en" ? "children" : "élèves"
                  : locale === "en" ? "child" : "élève"}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Tutoring Requests */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                {locale === "en" ? "Tutoring Requests" : "Demandes de cours"}
              </span>
              <div className="text-xl font-black text-slate-800">
                {totalRequestsCount}{" "}
                <span className="text-xs font-semibold text-slate-500">
                  {locale === "en" ? "requests" : "demandes"}
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/parent/requests"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors shrink-0"
          >
            {locale === "en" ? "View all" : "Consulter"}
          </Link>
        </div>

        {/* Metric 3: Active Classrooms */}
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {locale === "en" ? "Active Classrooms" : "Classes Actives"}
            </span>
            <div className="text-xl font-black text-slate-800">
              {activeClassesCount}{" "}
              <span className="text-xs font-semibold text-slate-500">
                {locale === "en" ? "classes" : "classes"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Student List with Search, Filters & Cards */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <StudentList
          childrenList={childrenList}
          onAddChild={() => setShowAddStudentModal(true)}
          onEditChild={(student) => setEditingStudent(student)}
          onDeleteChild={(student) => setDeletingStudent(student)}
          hideHeader={true}
        />
      </div>

      {/* Modals */}
      {showAddStudentModal && (
        <StudentProfileForm
          gradeLevels={masterData.gradeLevels}
          availableSubjects={masterData.subjects}
          onSaveSuccess={handleStudentCreated}
          onCancel={() => setShowAddStudentModal(false)}
        />
      )}

      {editingStudent && (
        <StudentProfileForm
          initialData={editingStudent}
          gradeLevels={masterData.gradeLevels}
          availableSubjects={masterData.subjects}
          onSaveSuccess={handleStudentUpdated}
          onCancel={() => setEditingStudent(null)}
        />
      )}

      {deletingStudent && (
        <ConfirmStudentActionDialog
          student={deletingStudent}
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteStudent}
          onCancel={() => setDeletingStudent(null)}
        />
      )}
    </div>
  );
}
