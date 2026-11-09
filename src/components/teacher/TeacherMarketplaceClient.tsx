"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  Sparkles,
  BookOpen,
  MapPin,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { OpportunityCard, OpportunityItem } from "./OpportunityCard";

interface TeacherMarketplaceClientProps {
  initialOpportunities: OpportunityItem[];
  initialTotal: number;
  initialRecommendedCount: number;
  isTeacherApproved: boolean;
  masterSubjects: Array<{ id: string; name: string }>;
  teacherProfileSummary: {
    city: string;
    headline?: string | null;
    verificationStatus: string;
  };
}

export function TeacherMarketplaceClient({
  initialOpportunities,
  initialTotal,
  initialRecommendedCount,
  isTeacherApproved,
  masterSubjects,
  teacherProfileSummary,
}: TeacherMarketplaceClientProps) {
  const { locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active discovery tab: If there are recommended opportunities, start with recommended;
  // if 0 recommended or tab=all requested, start with all open requests.
  const defaultTab =
    searchParams.get("tab") === "all" || initialRecommendedCount === 0
      ? "all"
      : "recommended";

  const [activeTab, setActiveTab] = useState<"recommended" | "all">(defaultTab);

  // Filters state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedSubject, setSelectedSubject] = useState(searchParams.get("subjectId") || "");
  const [selectedCycle, setSelectedCycle] = useState(searchParams.get("cycle") || "");
  const [selectedMode, setSelectedMode] = useState(searchParams.get("mode") || "");
  const [selectedCommune, setSelectedCommune] = useState(searchParams.get("commune") || "");

  // Data & loading state
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(initialOpportunities);
  const [allCount, setAllCount] = useState(initialTotal);
  const [recommendedCount, setRecommendedCount] = useState(initialRecommendedCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isInitialMount = useRef(true);

  const communes = [
    "Kaloum",
    "Dixinn",
    "Matam",
    "Ratoma",
    "Matoto",
    "Sanoyah",
    "Kagbélen",
    "Dubréka",
    "Coyah",
  ];

  // Fetch opportunities when filters or tab change
  const fetchOpportunities = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "12");

      if (activeTab === "recommended") {
        params.set("recommendedOnly", "true");
      }

      if (searchQuery.trim()) {
        params.set("query", searchQuery.trim());
      }
      if (selectedSubject) {
        params.set("subjectId", selectedSubject);
      }
      if (selectedCycle) {
        params.set("cycle", selectedCycle);
      }
      if (selectedMode) {
        params.set("mode", selectedMode);
      }
      if (selectedCommune) {
        params.set("commune", selectedCommune);
      }

      const res = await fetch(`/api/teacher/opportunities?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
        setAllCount(data.allCount ?? data.allOpenTotal ?? data.total ?? 0);
        setRecommendedCount(data.recommendedCount ?? 0);
        setCurrentPage(data.page || 1);
      }
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Avoid double fetching on initial mount if server provided the data matching the initial tab
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchOpportunities(1);
  }, [activeTab, selectedSubject, selectedCycle, selectedMode, selectedCommune]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOpportunities(1);
  };

  const handleResetFilters = (targetTab?: "recommended" | "all") => {
    setSearchQuery("");
    setSelectedSubject("");
    setSelectedCycle("");
    setSelectedMode("");
    setSelectedCommune("");
    setActiveTab(targetTab || (initialRecommendedCount > 0 ? "recommended" : "all"));
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
            <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
            <span>
              {locale === "en"
                ? "Tutoring Opportunities Marketplace"
                : "Place de marché des cours particuliers"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {locale === "en"
              ? "Discover Real Tutoring Requests"
              : "Opportunités de tutorat en Guinée"}
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            {locale === "en"
              ? "Explore verified requests published by families in Conakry. Match with students according to your subjects, cycles, and availability."
              : "Consultez les demandes publiées par des familles vérifiées à Conakry. Postulez en proposant vos modalités pédagogiques et vos disponibilités."}
          </p>
        </div>

        {/* Status Callout if Teacher is not Approved */}
        {!isTeacherApproved && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 max-w-sm space-y-1.5 shrink-0">
            <div className="flex items-center gap-2 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>
                {locale === "en" ? "Verification In Progress" : "Validation Enseignant Requise"}
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-normal">
              {locale === "en"
                ? "Your teacher application is under review. You can discover open requests, but your profile must be approved before submitting applications."
                : "Votre dossier enseignant est en cours d'examen. Vous pouvez consulter les opportunités, mais l'approbation de votre profil est requise pour postuler."}
            </p>
          </div>
        )}
      </div>

      {/* Tabs & Filters Container */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("recommended")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "recommended"
                  ? "bg-white text-[#16385c] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#e59a38]" />
              <span>{locale === "en" ? "Recommended For You" : "Recommandées pour vous"}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "recommended"
                    ? "bg-[#16385c]/10 text-[#16385c]"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {recommendedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-white text-[#16385c] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "All Open Requests" : "Toutes les demandes disponibles"}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "all"
                    ? "bg-[#16385c]/10 text-[#16385c]"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {allCount}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleResetFilters()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#16385c] font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "Reset Filters" : "Réinitialiser les filtres"}</span>
          </button>
        </div>

        {/* Search & Multi-Faceted Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Field */}
          <form onSubmit={handleSearchSubmit} className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={locale === "en" ? "Search subject, zone..." : "Matière, zone, mot-clé..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c] text-slate-800"
            />
          </form>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c]"
            >
              <option value="">{locale === "en" ? "All Subjects" : "Toutes les matières"}</option>
              {masterSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cycle Filter */}
          <div>
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c]"
            >
              <option value="">{locale === "en" ? "All Cycles" : "Tous les cycles"}</option>
              <option value="PRIMAIRE">{locale === "en" ? "Primary" : "Primaire"}</option>
              <option value="COLLEGE">{locale === "en" ? "Middle School" : "Collège"}</option>
              <option value="LYCEE">{locale === "en" ? "High School" : "Lycée"}</option>
              <option value="SUPERIEUR">{locale === "en" ? "Higher Ed" : "Supérieur"}</option>
              <option value="AUTRE">{locale === "en" ? "Custom / Other" : "Autre (Spécialisé)"}</option>
            </select>
          </div>

          {/* Mode Filter */}
          <div>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c]"
            >
              <option value="">{locale === "en" ? "All Formats" : "Tous les formats"}</option>
              <option value="HOME">{locale === "en" ? "In-Home" : "À domicile"}</option>
              <option value="ONLINE">{locale === "en" ? "Online" : "En ligne"}</option>
              <option value="HYBRID">{locale === "en" ? "Hybrid" : "Hybride"}</option>
            </select>
          </div>

          {/* Commune Filter */}
          <div>
            <select
              value={selectedCommune}
              onChange={(e) => setSelectedCommune(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16385c]/20 focus:border-[#16385c]"
            >
              <option value="">{locale === "en" ? "All Communes" : "Toutes les communes"}</option>
              {communes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Opportunity Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded-md w-2/3"></div>
              <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
              <div className="h-16 bg-slate-50 rounded-xl"></div>
              <div className="h-10 bg-slate-100 rounded-xl mt-4"></div>
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {locale === "en" ? "No Opportunities Found" : "Aucune opportunité correspondante"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === "recommended"
              ? locale === "en"
                ? "No opportunities currently match your exact qualifications and service area. Check 'All Open Requests' to explore all available requests."
                : "Aucune demande ne correspond exactement à vos matières et zones dans cet onglet. Consultez l'onglet 'Toutes les demandes disponibles' pour explorer l'ensemble des offres."
              : locale === "en"
              ? "Try adjusting your search criteria or filters to see more results."
              : "Essayez d'élargir vos filtres ou vos termes de recherche pour afficher plus de résultats."}
          </p>
          <button
            type="button"
            onClick={() => handleResetFilters("all")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] hover:bg-[#10243d] text-white transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{locale === "en" ? "Show All Requests" : "Afficher toutes les demandes"}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isTeacherApproved={isTeacherApproved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

