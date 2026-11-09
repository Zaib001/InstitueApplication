"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  FileText,
  AlertCircle,
  CheckCircle2,
  Send,
  Loader2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { RequestCard, RequestCardData } from "./RequestCard";
import { RequestSummaryCounters } from "./RequestSummaryCounters";
import { RequestFilterBar } from "./RequestFilterBar";
import { TutoringRequestWizard } from "./TutoringRequestWizard";
import { RequestActionDialog } from "./RequestActionDialog";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface ParentRequestsClientProps {
  initialRequests: RequestCardData[];
  initialCounts: {
    total: number;
    draft: number;
    open: number;
    matched: number;
    closed: number;
    cancelled: number;
  };
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

export function ParentRequestsClient({
  initialRequests,
  initialCounts,
  childrenList,
  masterData,
}: ParentRequestsClientProps) {
  const { locale } = useTranslation();

  const [requests, setRequests] = useState<RequestCardData[]>(initialRequests);
  const [counts, setCounts] = useState(initialCounts);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestCardData | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState<RequestCardData | null>(null);

  // Feedback notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (message: string, type: "success" | "error" = "success") => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const studentIdParam = params.get("studentId");
      const actionParam = params.get("action");
      if (studentIdParam) {
        setSelectedStudentId(studentIdParam);
      }
      if (actionParam === "new") {
        setShowWizard(true);
      }
    }
  }, []);

  // Filter Logic
  const filteredRequests = requests.filter((req) => {
    // 1. Status Filter
    if (selectedStatus && req.status !== selectedStatus) return false;

    // 2. Student Filter
    if (selectedStudentId && req.student.id !== selectedStudentId) return false;

    // 3. Search Filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      const matchSubject = req.subjectName.toLowerCase().includes(q);
      const matchCustomSubject = req.customSubject?.toLowerCase().includes(q);
      const matchStudent = req.student.fullName.toLowerCase().includes(q);
      const matchGrade = req.gradeLevelName.toLowerCase().includes(q);
      if (!matchSubject && !matchCustomSubject && !matchStudent && !matchGrade) {
        return false;
      }
    }

    return true;
  });

  // Action: Open wizard for editing
  const handleEdit = (req: RequestCardData) => {
    setEditingRequest(req);
    setShowWizard(true);
  };

  // Action: Create new request
  const handleCreateNew = () => {
    setEditingRequest(null);
    setShowWizard(true);
  };

  // Callback on wizard success
  const handleWizardSuccess = (savedRequest: any) => {
    setShowWizard(false);
    setEditingRequest(null);

    setRequests((prev) => {
      const exists = prev.some((r) => r.id === savedRequest.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRequest.id ? savedRequest : r));
      }
      return [savedRequest, ...prev];
    });

    // Update counts
    if (savedRequest.status === "OPEN") {
      setCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        open: prev.open + 1,
      }));
      showFeedback(
        locale === "en"
          ? "Tutoring request published successfully!"
          : "Demande de tutorat publiée avec succès !"
      );
    } else {
      setCounts((prev) => ({
        ...prev,
        total: prev.total + 1,
        draft: prev.draft + 1,
      }));
      showFeedback(
        locale === "en"
          ? "Draft saved successfully."
          : "Brouillon sauvegardé avec succès."
      );
    }
  };

  // Action: Publish direct from card
  const handlePublishDirect = async (req: RequestCardData) => {
    try {
      const res = await fetch(`/api/parent/requests/${req.id}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Erreur lors de la publication.");
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: "OPEN" } : r))
      );
      setCounts((prev) => ({
        ...prev,
        draft: Math.max(0, prev.draft - 1),
        open: prev.open + 1,
      }));
      showFeedback(
        locale === "en"
          ? "Tutoring request published! Qualified tutors will be notified."
          : "Demande publiée avec succès ! Les enseignants qualifiés peuvent désormais postuler."
      );
    } catch (err: any) {
      showFeedback(err.message, "error");
    }
  };

  // Action: Confirm cancel
  const handleConfirmCancel = async (reason?: string) => {
    if (!cancellingRequest) return;

    const res = await fetch(`/api/parent/requests/${cancellingRequest.id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Erreur lors de l'annulation.");
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === cancellingRequest.id ? { ...r, status: "CANCELLED" } : r
      )
    );

    setCounts((prev) => ({
      ...prev,
      draft:
        cancellingRequest.status === "DRAFT"
          ? Math.max(0, prev.draft - 1)
          : prev.draft,
      open:
        cancellingRequest.status === "OPEN"
          ? Math.max(0, prev.open - 1)
          : prev.open,
      cancelled: prev.cancelled + 1,
    }));

    showFeedback(
      locale === "en" ? "Tutoring request cancelled." : "Demande de tutorat annulée."
    );
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar: Title, Action, Language Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              {locale === "en" ? "Parent Space" : "Espace Famille"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Tutoring Requests" : "Demandes de Soutien"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading">
            {locale === "en"
              ? "My Tutoring Requests"
              : "Mes Demandes de Soutien Scolaire"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Manage private tutoring requests for your children, review applications, and publish new courses."
              : "Créez et suivez vos demandes de cours particuliers pour vos enfants à Conakry."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCreateNew}
            className="px-4 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-bold shadow-md shadow-blue-900/20 transition-all flex items-center gap-1.5 cursor-pointer transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4 text-[#e59a38]" />
            <span>{locale === "en" ? " Create a Request" : "+ Créer une demande"}</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. Notification Toast / Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs ${notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* 3. Summary Metric Counters */}
      <RequestSummaryCounters
        counts={counts}
        activeFilter={selectedStatus}
        onFilterSelect={(status) => setSelectedStatus(status)}
      />

      {/* 4. Filter Bar */}
      <RequestFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStudentId={selectedStudentId}
        onStudentChange={setSelectedStudentId}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        students={childrenList}
        onResetFilters={() => {
          setSearchQuery("");
          setSelectedStudentId(null);
          setSelectedStatus(null);
        }}
      />

      {/* 5. Request List or Empty States */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
              <FileText className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-extrabold text-slate-800">
                {requests.length === 0
                  ? locale === "en"
                    ? "No tutoring requests yet"
                    : "Aucune demande de soutien scolaire"
                  : locale === "en"
                    ? "No requests match your filters"
                    : "Aucune demande ne correspond à vos filtres"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {requests.length === 0
                  ? locale === "en"
                    ? "Publish a tutoring request to receive applications from verified tutors in your area."
                    : "Créez une demande pour trouver rapidement un enseignant vérifié adapté au niveau et aux besoins de votre enfant."
                  : locale === "en"
                    ? "Try adjusting your search criteria or resetting the active filters."
                    : "Essayez de modifier votre recherche ou d'effacer les filtres actifs."}
              </p>
            </div>

            {requests.length === 0 && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-5 py-2.5 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-[#e59a38]" />
                <span>{locale === "en" ? "Create First Request" : "Créer ma première demande"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                onEdit={handleEdit}
                onPublish={handlePublishDirect}
                onCancel={(r) => setCancellingRequest(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 6. Tutoring Request Wizard Modal */}
      {showWizard && (
        <TutoringRequestWizard
          initialData={editingRequest}
          defaultStudentId={selectedStudentId}
          childrenList={childrenList}
          availableSubjects={masterData.subjects}
          gradeLevels={masterData.gradeLevels}
          onSaveSuccess={handleWizardSuccess}
          onCancel={() => {
            setShowWizard(false);
            setEditingRequest(null);
          }}
        />
      )}

      {/* 7. Cancellation Confirmation Dialog */}
      {cancellingRequest && (
        <RequestActionDialog
          request={cancellingRequest}
          onConfirm={handleConfirmCancel}
          onClose={() => setCancellingRequest(null)}
        />
      )}
    </div>
  );
}
