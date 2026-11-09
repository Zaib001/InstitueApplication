"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  Award,
  Calendar,
  ChevronRight,
  Loader2,
  Users,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { CreateHomeworkModal } from "@/components/progress/CreateHomeworkModal";
import { CreateAssessmentModal } from "@/components/progress/CreateAssessmentModal";

export function TeacherProgressClient() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick modals state
  const [activeStudentForHomework, setActiveStudentForHomework] = useState<any | null>(null);
  const [activeStudentForAssessment, setActiveStudentForAssessment] = useState<any | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/teacher/progress");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de chargement des élèves.");
      }
      setStudents(data);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {t("progressBook.teacherList.title", "Carnet de Progression des Élèves")}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                "progressBook.teacherList.subtitle",
                "Accédez aux bilans pédagogiques de vos élèves, assignez des devoirs et notez les contrôles"
              )}
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          <p className="mt-3 text-sm text-slate-500">Chargement des élèves...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h3 className="mt-2 text-base font-bold text-rose-900">Erreur</h3>
          <p className="mt-1 text-sm text-rose-700">{error}</p>
          <button
            onClick={fetchStudents}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition"
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-bold text-slate-800">
            {t("progressBook.teacherList.noStudents", "Aucun élève assigné actuellement.")}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            Les élèves de vos classes actives apparaîtront ici dès que vos attributions de cours seront en place.
          </p>
        </div>
      )}

      {!loading && !error && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((st) => (
            <div
              key={st.studentId}
              className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs hover:border-slate-300 hover:shadow-sm transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-lg">
                      {st.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{st.fullName}</h3>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {st.gradeLevel}
                      </span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                    {st.subjectName}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Parent :</span>
                    <span className="font-medium text-slate-800">{st.parentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Séances dispensées :</span>
                    <span className="font-semibold text-slate-800">{st.completedSessionsCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Dernière note :</span>
                    {st.latestAssessment ? (
                      <span className="font-bold text-blue-600">
                        {st.latestAssessment.score}/{st.latestAssessment.maxScore} ({st.latestAssessment.percentage}%)
                      </span>
                    ) : (
                      <span className="text-slate-400">Aucune</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Devoirs en cours :</span>
                    <span className="font-bold text-amber-600">{st.activeHomeworkCount}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <Link
                  href={`/teacher/students/${st.studentId}/progress`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                >
                  <span>Ouvrir le carnet complet</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActiveStudentForHomework(st)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50/60 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Devoir</span>
                  </button>
                  <button
                    onClick={() => setActiveStudentForAssessment(st)}
                    className="flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50/60 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Contrôle</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Modals */}
      {activeStudentForHomework && (
        <CreateHomeworkModal
          isOpen={true}
          onClose={() => setActiveStudentForHomework(null)}
          studentId={activeStudentForHomework.studentId}
          studentName={activeStudentForHomework.fullName}
          classrooms={[
            {
              id: activeStudentForHomework.classroomId,
              subjectName: activeStudentForHomework.subjectName,
            },
          ]}
          onSuccess={fetchStudents}
        />
      )}

      {activeStudentForAssessment && (
        <CreateAssessmentModal
          isOpen={true}
          onClose={() => setActiveStudentForAssessment(null)}
          studentId={activeStudentForAssessment.studentId}
          studentName={activeStudentForAssessment.fullName}
          classrooms={[
            {
              id: activeStudentForAssessment.classroomId,
              subjectName: activeStudentForAssessment.subjectName,
            },
          ]}
          onSuccess={fetchStudents}
        />
      )}
    </div>
  );
}

