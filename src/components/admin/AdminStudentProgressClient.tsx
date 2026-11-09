"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { StudentProgressBook } from "@/components/progress/StudentProgressBook";

interface AdminStudentProgressClientProps {
  studentId: string;
}

export function AdminStudentProgressClient({
  studentId,
}: AdminStudentProgressClientProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressBook = async () => {
    try {
      setLoading(true);
      setError(null);
      // Admin can use teacher or parent progress endpoint
      const res = await fetch(`/api/teacher/students/${studentId}/progress`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur de chargement du carnet de progression.");
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Impossible de charger le carnet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgressBook();
  }, [studentId]);

  return (
    <div className="flex-1 p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/admin/academic-progress"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("progressBook.actions.backToList", "Retour à la supervision")}</span>
        </Link>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="mt-3 text-sm text-slate-500">Chargement du carnet de progression...</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <h3 className="mt-2 text-base font-bold text-rose-900">Erreur</h3>
          <p className="mt-1 text-sm text-rose-700">{error}</p>
          <button
            onClick={fetchProgressBook}
            className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition"
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <StudentProgressBook
          data={data}
          actorRole="ADMIN"
          onRefresh={fetchProgressBook}
        />
      )}
    </div>
  );
}

