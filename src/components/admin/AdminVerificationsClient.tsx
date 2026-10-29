"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Users,
  Eye,
  Calendar,
  MapPin,
  BookOpen,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedUser } from "@/lib/auth/session";

interface TeacherRow {
  id: string;
  userId: string;
  headline: string | null;
  city: string;
  serviceArea: string | null;
  yearsOfExperience: number;
  verificationStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  submittedAt: string | null;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  subjects: Array<{ subject: { id: string; name: string } }>;
  gradeLevels: Array<{ gradeLevel: { id: string; name: string } }>;
  documents: Array<{ id: string; type: string; title: string; status: string }>;
  _count: {
    documents: number;
    availabilities: number;
    classrooms: number;
  };
}

interface AdminVerificationsClientProps {
  user: AuthenticatedUser;
}

export function AdminVerificationsClient({ user }: AdminVerificationsClientProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>("PENDING_REVIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [counts, setCounts] = useState({ all: 0, pending: 0, approved: 0, rejected: 0, draft: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/verifications?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push("/login?callbackUrl=/admin/verifications");
          return;
        }
        throw new Error(
          locale === "en"
            ? "Error loading verification queue."
            : "Erreur de chargement de la file de vérification."
        );
      }

      const json = await res.json();
      setTeachers(json.data || []);
      if (json.meta?.counts) {
        setCounts(json.meta.counts);
      }
    } catch (err: any) {
      setError(err.message || (locale === "en" ? "Network error." : "Erreur réseau."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {locale === "en" ? "Admin Console" : "Console Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Teacher Accreditation" : "Accréditation Enseignants"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading">
            {locale === "en" ? "Teacher Verification Queue" : "File de Vérification des Enseignants"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Verify diplomas, identity documents, and credentials before granting marketplace access."
              : "Contrôlez l'authenticité des diplômes et pièces d'identité avant d'autoriser l'accès aux cours."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchQueue}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>{locale === "en" ? "Refresh Queue" : "Actualiser"}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Tab Filters */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
        {[
          {
            id: "PENDING_REVIEW",
            label: locale === "en" ? "Pending Review" : "À vérifier (Prioritaire)",
            count: counts.pending,
            color: "text-amber-700 bg-amber-50",
          },
          {
            id: "APPROVED",
            label: locale === "en" ? "Approved" : "Approuvés",
            count: counts.approved,
            color: "text-emerald-700 bg-emerald-50",
          },
          {
            id: "REJECTED",
            label: locale === "en" ? "Rejected / Incomplete" : "Rejetés / Compléments",
            count: counts.rejected,
            color: "text-rose-700 bg-rose-50",
          },
          {
            id: "DRAFT",
            label: locale === "en" ? "Drafts" : "Brouillons",
            count: counts.draft,
            color: "text-slate-700 bg-slate-100",
          },
          {
            id: "ALL",
            label: locale === "en" ? "All Dossiers" : "Tous",
            count: counts.all,
            color: "text-blue-700 bg-blue-50",
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#16385c] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                  isActive ? "bg-white/20 text-white" : tab.color
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              locale === "en"
                ? "Search by teacher name, email, city, subject..."
                : "Rechercher par nom d'enseignant, email, ville, matière..."
            }
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200/90 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-xl bg-[#16385c] text-white text-xs font-semibold hover:bg-[#10243d] transition-colors cursor-pointer"
        >
          {locale === "en" ? "Filter" : "Filtrer"}
        </button>
      </form>

      {/* Queue List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[#16385c]" />
          <span className="text-xs text-slate-500 font-medium">
            {locale === "en" ? "Loading teacher applications..." : "Chargement des dossiers d'enseignants..."}
          </span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      ) : teachers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">
            {locale === "en" ? "No applications in this category" : "Aucun dossier dans cette catégorie"}
          </h3>
          <p className="text-xs text-slate-400">
            {locale === "en"
              ? "All teacher applications have been reviewed or no records match your criteria."
              : "Tous les dossiers d'enseignants ont été traités ou aucun enregistrement ne correspond aux critères."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {teachers.map((tRow) => {
            const statusBadgeText =
              tRow.verificationStatus === "APPROVED"
                ? (locale === "en" ? "Approved" : "Dossier Validé")
                : tRow.verificationStatus === "PENDING_REVIEW"
                ? (locale === "en" ? "Pending Review" : "En attente")
                : tRow.verificationStatus === "REJECTED"
                ? (locale === "en" ? "Changes Requested" : "Rejeté / Complément")
                : (locale === "en" ? "Draft" : "Brouillon");

            const statusColor =
              tRow.verificationStatus === "APPROVED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : tRow.verificationStatus === "PENDING_REVIEW"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : tRow.verificationStatus === "REJECTED"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <div
                key={tRow.id}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-[#16385c]">
                      {tRow.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          {tRow.user.fullName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {statusBadgeText}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {tRow.user.email} • {tRow.user.phoneNumber || (locale === "en" ? "No phone" : "Numéro non renseigné")}
                      </span>
                    </div>
                  </div>

                  {/* Headline */}
                  {tRow.headline && (
                    <p className="text-xs text-slate-600 line-clamp-1 italic">
                      « {tRow.headline} »
                    </p>
                  )}

                  {/* Metadata tags */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{tRow.city}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span>
                        {tRow.subjects.length > 0
                          ? tRow.subjects.map((s) => s.subject.name).join(", ")
                          : (locale === "en" ? "No subjects" : "Aucune matière")}
                      </span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 font-semibold">
                      <FileCheck className="w-3 h-3 text-blue-500" />
                      <span>
                        {tRow._count.documents} {locale === "en" ? "document(s)" : "justificatif(s)"}
                      </span>
                    </span>

                    {tRow.submittedAt && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>
                          {locale === "en" ? "Submitted " : "Soumis le "}
                          {new Date(tRow.submittedAt).toLocaleDateString(
                            locale === "en" ? "en-US" : "fr-FR",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0 self-end sm:self-center">
                  <Link
                    href={`/admin/verifications/${tRow.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{locale === "en" ? "Review Dossier" : "Examiner le dossier"}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
