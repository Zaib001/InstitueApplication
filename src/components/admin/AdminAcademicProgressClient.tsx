"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  BookOpen,
  Award,
  Loader2,
  ChevronRight,
  Eye,
  FileWarning,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function AdminAcademicProgressClient() {
  const { t } = useTranslation();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async (q?: string) => {
    try {
      setLoading(true);
      setError(null);
      const url = q
        ? `/api/admin/academic-progress?search=${encodeURIComponent(q)}`
        : "/api/admin/academic-progress";
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur de chargement des données académiques.");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(searchQuery);
  };

  const stats = data?.stats;
  const students = data?.students || [];

  return (
    <div className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {t("progressBook.adminList.title", "Supervision Académique Nationale")}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {t(
                "progressBook.adminList.subtitle",
                "Contrôle de la délivrance des cours, rapports en souffrance et rigueur pédagogique"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Élèves suivis</span>
            <div className="mt-2 text-2xl font-black text-slate-900">{stats.totalStudents}</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Séances dispensées</span>
            <div className="mt-2 text-2xl font-black text-indigo-600">{stats.totalCompletedSessions}</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rapports manquants</span>
            <div className={`mt-2 text-2xl font-black ${stats.totalMissingReports > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {stats.totalMissingReports}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Devoirs actifs</span>
            <div className="mt-2 text-2xl font-black text-amber-600">{stats.totalActiveHomework}</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Évaluations notées</span>
            <div className="mt-2 text-2xl font-black text-blue-600">{stats.totalAssessmentsRecorded}</div>
          </div>
        </div>
      )}

      {/* Search & Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <form onSubmit={handleSearch} className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                "progressBook.adminList.searchPlaceholder",
                "Rechercher par nom d'élève ou niveau..."
              )}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-purple-700 transition"
          >
            Rechercher
          </button>
        </form>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <p className="mt-2 text-sm text-slate-500">Chargement de la supervision...</p>
          </div>
        )}

        {!loading && students.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-500">
            {t("progressBook.adminList.noStudents", "Aucun élève trouvé.")}
          </div>
        )}

        {!loading && students.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Élève</th>
                  <th className="px-4 py-3">Parent</th>
                  <th className="px-4 py-3 text-center">Classes</th>
                  <th className="px-4 py-3 text-center">Séances validées</th>
                  <th className="px-4 py-3 text-center">Rapports en retard</th>
                  <th className="px-4 py-3 text-center">Contrôles</th>
                  <th className="px-4 py-3 text-center">Devoirs</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st: any) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900">{st.fullName}</div>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                        {st.gradeLevel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{st.parentName}</div>
                      <div className="text-slate-400">{st.parentContact}</div>
                    </td>

                    <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                      {st.classroomsCount}
                    </td>

                    <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                      {st.completedSessionsCount}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      {st.missingReportsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                          <FileWarning className="h-3.5 w-3.5" />
                          {st.missingReportsCount} en attente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />
                          À jour
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center font-semibold text-blue-600">
                      {st.assessmentsCount}
                    </td>

                    <td className="px-4 py-3.5 text-center font-semibold text-amber-600">
                      {st.homeworkCount}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/admin/students/${st.studentId}/progress`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Examiner</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

