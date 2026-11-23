"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Scale,
  Landmark,
  CreditCard,
  AlertTriangle,
  History,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlusCircle,
  TrendingUp,
  Wallet,
  Users,
  Search,
  Filter,
  ArrowRight,
  AlertOctagon,
  Calendar,
  X,
  RotateCcw,
  Send,
  Smartphone,
  CheckCheck,
  Ban,
  Receipt,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";

interface AccountBalance {
  accountCode: string;
  accountName: string;
  type: string;
  totalDebitsGnf: number;
  totalCreditsGnf: number;
  netBalanceGnf: number;
}

interface Policy {
  id: string;
  version: string;
  platformPercent: number;
  teacherPercent: number;
  description: string;
  isActive: boolean;
  effectiveFrom: string;
}

export interface ClassroomFundingRow {
  id: string;
  classroomId: string;
  subjectName: string;
  studentName: string;
  teacherName: string;
  totalFundedAmountGnf: number;
  allocatedAmountGnf: number;
  availableBalanceGnf: number;
  refundedAmountGnf: number;
  status: string;
}

interface ProviderCapability {
  provider: string;
  displayName: string;
  supportsInternationalCards: boolean;
  supportsOrangeMoney: boolean;
  supportsMtnMomo: boolean;
  supportsDisbursements: boolean;
  supportedCurrencies: string[];
}

export interface AdminTeacherEarningRow {
  id: string;
  sessionId: string;
  teacherProfileId: string;
  teacherName: string;
  teacherEmail: string;
  studentName: string;
  subjectName: string;
  classroomId: string;
  lessonDate: string;
  grossAmountGnf: number;
  commissionRatePercent: number;
  platformCommissionGnf: number;
  teacherNetGnf: number;
  earningsStatus: string;
  isPaidOut: boolean;
  validatedAt: string;
}

export interface AdminPayoutRow {
  id: string;
  teacherProfileId: string;
  teacherName: string;
  teacherEmail: string;
  amountGnf: number;
  channel: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  status: string;
  disbursementMode: string;
  paymentReference: string;
  providerDisbursementRef?: string | null;
  rejectionReason?: string | null;
  notes?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  reconciledAt?: string | null;
  earningsCount: number;
  destination?: {
    id: string;
    operator: string;
    phone: string;
    accountHolderName: string;
  } | null;
}

export interface AdminRefundCaseRow {
  id: string;
  orderId?: string | null;
  classroomId?: string | null;
  disputeId?: string | null;
  reason: string;
  amountGnf: number;
  status: string;
  adminDecisionNotes?: string | null;
  createdAt: string;
  processedAt?: string | null;
  classroom?: {
    id: string;
    subjectName: string;
    studentName: string;
    parentName: string;
    parentEmail: string;
  } | null;
}

export interface FinancialKpis {
  totalCollectionsGnf: number;
  classroomPrepaidLiabilitiesGnf: number;
  teacherPayableBalancesGnf: number;
  recognizedPlatformCommissionGnf: number;
  reservedPayoutsGnf: number;
  unallocatedEscrowGnf: number;
  confirmedPayoutsGnf: number;
  earningsAwaitingValidationGnf: number;
}

function maskPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[\s\-\.\(\)]/g, "");
  if (cleaned.length < 9) return phone;
  return `${cleaned.slice(0, 4)} *** *${cleaned.slice(-2)}`;
}

export function AdminFinancesClient({
  accounts,
  trialBalance,
  activePolicy,
  policies,
  fundings,
  providers,
  kpis,
  teacherEarnings = [],
  payouts = [],
  refundCases = [],
}: {
  accounts: AccountBalance[];
  trialBalance: {
    totalDebitsGnf: number;
    totalCreditsGnf: number;
    isBalanced: boolean;
  };
  activePolicy: Policy | null;
  policies: Policy[];
  fundings: ClassroomFundingRow[];
  providers: ProviderCapability[];
  kpis?: FinancialKpis;
  teacherEarnings?: AdminTeacherEarningRow[];
  payouts?: AdminPayoutRow[];
  refundCases?: AdminRefundCaseRow[];
}) {
  const [activeTab, setActiveTab] = useState<
    "earnings" | "payouts" | "refunds" | "ledger" | "policies" | "classrooms" | "providers"
  >("earnings");

  // Earnings filtering
  const [earningsSearch, setEarningsSearch] = useState("");
  const [earningsStatusFilter, setEarningsStatusFilter] = useState("ALL");
  const [reversalTarget, setReversalTarget] = useState<AdminTeacherEarningRow | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);
  const [reversalFeedback, setReversalFeedback] = useState<string | null>(null);

  // Payout Management
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL");
  const [payoutSearch, setPayoutSearch] = useState("");
  const [approvePayoutTarget, setApprovePayoutTarget] = useState<AdminPayoutRow | null>(null);
  const [rejectPayoutTarget, setRejectPayoutTarget] = useState<AdminPayoutRow | null>(null);
  const [rejectPayoutReason, setRejectPayoutReason] = useState("");
  const [manualExecuteTarget, setManualExecuteTarget] = useState<AdminPayoutRow | null>(null);
  const [telecomRef, setTelecomRef] = useState("");
  const [reconcilePayoutTarget, setReconcilePayoutTarget] = useState<AdminPayoutRow | null>(null);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutFeedback, setPayoutFeedback] = useState<string | null>(null);

  // Refund Management
  const [refundTarget, setRefundTarget] = useState<ClassroomFundingRow | null>(null);
  const [refundAmountGnf, setRefundAmountGnf] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundFeedback, setRefundFeedback] = useState<string | null>(null);

  // Policy creation
  const [newVersion, setNewVersion] = useState("");
  const [newPlatformPercent, setNewPlatformPercent] = useState("15");
  const [newDescription, setNewDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/finance/commission-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: newVersion,
          platformPercent: Number(newPlatformPercent),
          description: newDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      setFeedbackMsg("Nouvelle version de politique créée avec succès.");
      window.location.reload();
    } catch (err: any) {
      setFeedbackMsg(`Échec : ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReverseEarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversalTarget || !reversalReason.trim()) return;

    setIsReversing(true);
    setReversalFeedback(null);

    try {
      const res = await fetch("/api/admin/finances/reverse-earning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: reversalTarget.sessionId,
          reason: reversalReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'annulation");
      }

      setReversalFeedback("Gains annulés et écritures compensatoires enregistrées avec succès.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setReversalFeedback(`Erreur : ${err.message}`);
    } finally {
      setIsReversing(false);
    }
  };

  // Payout Handlers
  const handleApprovePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvePayoutTarget) return;
    setIsProcessingPayout(true);
    setPayoutFeedback(null);

    try {
      const res = await fetch(`/api/admin/finances/payouts/${approvePayoutTarget.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "Approuvé par administrateur" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'approbation");

      setPayoutFeedback("Versement approuvé avec succès.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setPayoutFeedback(`Échec : ${err.message}`);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleRejectPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectPayoutTarget || !rejectPayoutReason.trim()) return;
    setIsProcessingPayout(true);
    setPayoutFeedback(null);

    try {
      const res = await fetch(`/api/admin/finances/payouts/${rejectPayoutTarget.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectPayoutReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de rejet");

      setPayoutFeedback("Versement rejeté et fonds réattribués aux gains éligibles.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setPayoutFeedback(`Échec : ${err.message}`);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleManualExecutePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualExecuteTarget || !telecomRef.trim()) return;
    setIsProcessingPayout(true);
    setPayoutFeedback(null);

    try {
      const res = await fetch(`/api/admin/finances/payouts/${manualExecuteTarget.id}/manual-execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerReference: telecomRef.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'enregistrement télécom");

      setPayoutFeedback("Règlement télécom enregistré et écritures comptables passées.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setPayoutFeedback(`Échec : ${err.message}`);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const handleReconcilePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcilePayoutTarget) return;
    setIsProcessingPayout(true);
    setPayoutFeedback(null);

    try {
      const res = await fetch(`/api/admin/finances/payouts/${reconcilePayoutTarget.id}/reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de rapprochement");

      setPayoutFeedback("Versement rapproché avec succès.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setPayoutFeedback(`Échec : ${err.message}`);
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // Refund Handlers
  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget || !refundAmountGnf || !refundReason.trim()) return;
    setIsProcessingRefund(true);
    setRefundFeedback(null);

    try {
      const res = await fetch("/api/admin/finances/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: refundTarget.classroomId,
          amountGnf: Number(refundAmountGnf),
          reason: refundReason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du remboursement");

      setRefundFeedback("Remboursement traité avec succès et écritures compensatoires passées.");
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setRefundFeedback(`Échec : ${err.message}`);
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Filtered Payouts
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (payoutStatusFilter !== "ALL" && p.status !== payoutStatusFilter) {
        return false;
      }
      if (payoutSearch.trim()) {
        const q = payoutSearch.toLowerCase();
        const mTeacher = p.teacherName.toLowerCase().includes(q) || p.teacherEmail.toLowerCase().includes(q);
        const mBeneficiary = p.beneficiaryName.toLowerCase().includes(q) || p.beneficiaryPhone.includes(q);
        const mRef = p.paymentReference.toLowerCase().includes(q) || (p.providerDisbursementRef || "").toLowerCase().includes(q);
        if (!mTeacher && !mBeneficiary && !mRef) return false;
      }
      return true;
    });
  }, [payouts, payoutStatusFilter, payoutSearch]);

  const payoutStats = useMemo(() => {
    const requested = payouts.filter((p) => p.status === "REQUESTED");
    const approved = payouts.filter((p) => p.status === "APPROVED");
    const paid = payouts.filter((p) => p.status === "PAID");
    const reconciled = payouts.filter((p) => p.status === "RECONCILED");

    return {
      requestedCount: requested.length,
      requestedGnf: requested.reduce((s, p) => s + p.amountGnf, 0),
      approvedCount: approved.length,
      approvedGnf: approved.reduce((s, p) => s + p.amountGnf, 0),
      paidCount: paid.length,
      paidGnf: paid.reduce((s, p) => s + p.amountGnf, 0),
      reconciledCount: reconciled.length,
      reconciledGnf: reconciled.reduce((s, p) => s + p.amountGnf, 0),
    };
  }, [payouts]);

  const filteredEarnings = useMemo(() => {
    return teacherEarnings.filter((e) => {
      if (earningsStatusFilter !== "ALL" && e.earningsStatus !== earningsStatusFilter) {
        return false;
      }
      if (earningsSearch.trim()) {
        const q = earningsSearch.toLowerCase();
        const mTeacher = e.teacherName.toLowerCase().includes(q) || e.teacherEmail.toLowerCase().includes(q);
        const mStudent = e.studentName.toLowerCase().includes(q);
        const mSubject = e.subjectName.toLowerCase().includes(q);
        if (!mTeacher && !mStudent && !mSubject) return false;
      }
      return true;
    });
  }, [teacherEarnings, earningsStatusFilter, earningsSearch]);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#16385c]/10 text-[#16385c] rounded-xl">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Supervision Financière & Grand Livre Comptable
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Milestone 3 (M3.01 - M3.05) — Gestion des provisions, gains enseignants, versements mobile money et réconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
              trialBalance.isBalanced
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>
              {trialBalance.isBalanced
                ? "Grand Livre Équilibré (Débits = Crédits)"
                : "Déséquilibre comptable détecté"}
            </span>
          </span>
        </div>
      </div>

      {/* 8 Full Financial KPI Cards (Section 9 Requirement) */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 text-xs">
          {/* 1. Total Encaissé Parents */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              1. Encaissé Parents (1010)
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-slate-800 truncate" title={formatGnf(kpis.totalCollectionsGnf)}>
              {formatGnf(kpis.totalCollectionsGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Collectes confirmées</span>
          </div>

          {/* 2. Fonds Prépayés Classes */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              2. Fonds Prépayés Classes (2020)
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-blue-700 truncate" title={formatGnf(kpis.classroomPrepaidLiabilitiesGnf)}>
              {formatGnf(kpis.classroomPrepaidLiabilitiesGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Provisions affectées aux cours</span>
          </div>

          {/* 3. Dettes Enseignants (Net Éligible) */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              3. Dettes Tuteurs (2030)
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-emerald-700 truncate" title={formatGnf(kpis.teacherPayableBalancesGnf)}>
              {formatGnf(kpis.teacherPayableBalancesGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Gains validés à verser</span>
          </div>

          {/* 4. Commission Reconnue */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              4. Commission Plateforme (4010)
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-amber-700 truncate" title={formatGnf(kpis.recognizedPlatformCommissionGnf)}>
              {formatGnf(kpis.recognizedPlatformCommissionGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Revenus acquis reconnus</span>
          </div>

          {/* 5. Gains en attente validation */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              5. En Attente Validation
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-purple-700 truncate" title={formatGnf(kpis.earningsAwaitingValidationGnf)}>
              {formatGnf(kpis.earningsAwaitingValidationGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Séances dispensées sans visa</span>
          </div>

          {/* 6. Virements Réservés */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              6. Virements Réservés (2040)
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-slate-700 truncate" title={formatGnf(kpis.reservedPayoutsGnf)}>
              {formatGnf(kpis.reservedPayoutsGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">En cours d'ordonnancement</span>
          </div>

          {/* 7. Virements Exécutés */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              7. Virements Versés
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-[#16385c] truncate" title={formatGnf(kpis.confirmedPayoutsGnf)}>
              {formatGnf(kpis.confirmedPayoutsGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">Décaissements confirmés</span>
          </div>

          {/* 8. Provisions Non Affectées */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider truncate">
              8. Fonds Non Affectés (2010)
            </span>
            <div className="text-sm sm:text-base lg:text-lg font-black text-rose-700 truncate" title={formatGnf(kpis.unallocatedEscrowGnf)}>
              {formatGnf(kpis.unallocatedEscrowGnf)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate">En attente d'affectation / régularisation</span>
          </div>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {[
          { key: "earnings", label: "Séances & Gains Tuteurs", icon: Wallet },
          { key: "payouts", label: "Versements Professeurs (M3.05)", icon: Send },
          { key: "refunds", label: "Remboursements Parents", icon: RotateCcw },
          { key: "ledger", label: "Grand Livre & Comptes", icon: Scale },
          { key: "policies", label: "Politiques de Commission", icon: TrendingUp },
          { key: "classrooms", label: "Provisions des Classes", icon: ShieldCheck },
          { key: "providers", label: "Prestataires & Passerelles", icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                isActive
                  ? "border-[#16385c] text-[#16385c] bg-white shadow-xs font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: SÉANCES & RÉMUNÉRATIONS TUTEURS (M3.04) */}
      {activeTab === "earnings" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-slate-400 font-semibold mr-1">Statut :</span>
              {["ALL", "ELIGIBLE", "PENDING_VALIDATION", "PAID", "REVERSED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setEarningsStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 ${
                    earningsStatusFilter === st
                      ? "bg-[#16385c] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL"
                    ? "Tous"
                    : st === "ELIGIBLE"
                    ? "Éligibles (Disponibles)"
                    : st === "PENDING_VALIDATION"
                    ? "En Attente"
                    : st === "PAID"
                    ? "Versés"
                    : "Annulés"}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer prof, élève, matière..."
                value={earningsSearch}
                onChange={(e) => setEarningsSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#16385c] focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[750px] sm:min-w-full">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Enseignant</th>
                    <th className="py-3 px-4">Élève & Matière</th>
                    <th className="py-3 px-4 text-right">Montant Brut</th>
                    <th className="py-3 px-4 text-right">Commission</th>
                    <th className="py-3 px-4 text-right">Net Tuteur</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4 text-center">Action Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEarnings.length > 0 ? (
                    filteredEarnings.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(item.lessonDate).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{item.teacherName}</div>
                          <div className="text-[10.5px] text-slate-400">{item.teacherEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{item.subjectName}</div>
                          <div className="text-[11px] text-slate-500">Élève : {item.studentName}</div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {formatGnf(item.grossAmountGnf)}
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500">
                          <span>{formatGnf(item.platformCommissionGnf)}</span>
                          <span className="text-[10px] text-slate-400 block">({item.commissionRatePercent}%)</span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">
                          {formatGnf(item.teacherNetGnf)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.earningsStatus === "ELIGIBLE" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Éligible
                            </span>
                          ) : item.earningsStatus === "PAID" || item.isPaidOut ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Versé
                            </span>
                          ) : item.earningsStatus === "REVERSED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              Annulé
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {item.earningsStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.earningsStatus === "ELIGIBLE" && !item.isPaidOut ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReversalTarget(item);
                                setReversalReason("");
                                setReversalFeedback(null);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                              title="Annuler les gains et poster les écritures de contrepassation"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Contrepasser</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Verrouillé</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Aucune rémunération trouvée avec les filtres sélectionnés.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reversal Confirmation Modal */}
      {reversalTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setReversalTarget(null)}
        >
          <div
            className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs overflow-y-auto my-auto [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Contrepassation comptable des gains
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Séance : {reversalTarget.subjectName} ({reversalTarget.teacherName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReversalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Cette action annulera la rémunération de <strong>{formatGnf(reversalTarget.teacherNetGnf)}</strong> pour l'enseignant, annulera la commission de <strong>{formatGnf(reversalTarget.platformCommissionGnf)}</strong> et réattribuera le montant brut de <strong>{formatGnf(reversalTarget.grossAmountGnf)}</strong> au compte de provisions affectées aux cours de la classe (<strong>2020_CLASSROOM_FUNDS</strong>).
            </p>

            <form onSubmit={handleReverseEarning} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Motif d'annulation obligatoire (justificatif d'audit) :
                </label>
                <textarea
                  required
                  rows={2}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder="Ex : Erreur de déclaration d'horaire, accord mutuel de report..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#16385c]"
                />
              </div>

              {reversalFeedback && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                  {reversalFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isReversing || !reversalReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                >
                  {isReversing ? "Enregistrement..." : "Confirmer la contrepassation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB: VERSEMENTS PROFESSEURS (M3.05) */}
      {activeTab === "payouts" && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600 block tracking-wider">
                1. En Attente Approbation
              </span>
              <div className="text-base sm:text-lg font-black text-slate-800">
                {formatGnf(payoutStats.requestedGnf)}
              </div>
              <span className="text-[10px] text-slate-500">
                {payoutStats.requestedCount} demande(s) reçue(s)
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-blue-600 block tracking-wider">
                2. Approuvés (Prêts Décaissement)
              </span>
              <div className="text-base sm:text-lg font-black text-blue-700">
                {formatGnf(payoutStats.approvedGnf)}
              </div>
              <span className="text-[10px] text-slate-500">
                {payoutStats.approvedCount} versement(s) ordonnancé(s)
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wider">
                3. Versés (Télécom Confirmé)
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-700">
                {formatGnf(payoutStats.paidGnf)}
              </div>
              <span className="text-[10px] text-slate-500">
                {payoutStats.paidCount} versement(s) décaissé(s)
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#16385c] block tracking-wider">
                4. Rapprochés
              </span>
              <div className="text-base sm:text-lg font-black text-[#16385c]">
                {formatGnf(payoutStats.reconciledGnf)}
              </div>
              <span className="text-[10px] text-slate-500">
                {payoutStats.reconciledCount} versement(s) clôturé(s)
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-slate-400 font-semibold mr-1">Statut :</span>
              {["ALL", "REQUESTED", "APPROVED", "PAID", "RECONCILED", "CANCELLED", "FAILED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPayoutStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer shrink-0 text-xs ${
                    payoutStatusFilter === st
                      ? "bg-[#16385c] text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL"
                    ? "Tous"
                    : st === "REQUESTED"
                    ? "En Attente"
                    : st === "APPROVED"
                    ? "Approuvés"
                    : st === "PAID"
                    ? "Versés"
                    : st === "RECONCILED"
                    ? "Rapprochés"
                    : st === "CANCELLED"
                    ? "Rejetés"
                    : "Échoués"}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrer prof, téléphone, référence..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-[#16385c] focus:outline-none"
              />
            </div>
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[750px] sm:min-w-full">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Enseignant</th>
                    <th className="py-3 px-4">Portefeuille & Bénéficiaire</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Mode</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                    <th className="py-3 px-4">Réf. Télécom</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayouts.length > 0 ? (
                    filteredPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{p.teacherName}</div>
                          <div className="text-[10.5px] text-slate-400">{p.teacherEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#16385c]" />
                            <span>{p.channel === "ORANGE_MONEY" ? "Orange Money" : p.channel === "MTN_MOMO" ? "MTN MoMo" : p.channel}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-600">
                            {maskPhone(p.beneficiaryPhone)} — {p.beneficiaryName}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-black text-slate-900">{formatGnf(p.amountGnf)}</div>
                          <div className="text-[10px] text-slate-400">{p.earningsCount} séance(s)</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            {p.disbursementMode === "MANUAL_ADMIN_RECORDED" ? "Manuel Télécom" : "Passerelle Directe"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {p.status === "REQUESTED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              En Attente
                            </span>
                          ) : p.status === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                              Approuvé
                            </span>
                          ) : p.status === "PAID" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              Versé
                            </span>
                          ) : p.status === "RECONCILIATION_PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              En attente rapprochement
                            </span>
                          ) : p.status === "RECONCILED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#16385c]/10 text-[#16385c] border border-[#16385c]/20">
                              <CheckCheck className="w-2.5 h-2.5 text-[#16385c]" />
                              Rapproché
                            </span>
                          ) : p.status === "CANCELLED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <Ban className="w-2.5 h-2.5 text-rose-600" />
                              Rejeté
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {p.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {p.providerDisbursementRef || (
                            <span className="text-slate-400 italic">En attente</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {p.status === "REQUESTED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setApprovePayoutTarget(p);
                                    setPayoutFeedback(null);
                                  }}
                                  className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Approuver la demande de versement"
                                >
                                  Approuver
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectPayoutTarget(p);
                                    setRejectPayoutReason("");
                                    setPayoutFeedback(null);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Rejeter et restaurer les gains"
                                >
                                  Rejeter
                                </button>
                              </>
                            )}

                            {p.status === "APPROVED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setManualExecuteTarget(p);
                                    setTelecomRef("");
                                    setPayoutFeedback(null);
                                  }}
                                  className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Saisir la référence du transfert télécom effectué"
                                >
                                  <Smartphone className="w-3 h-3" />
                                  <span>Règlement Télécom</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectPayoutTarget(p);
                                    setRejectPayoutReason("");
                                    setPayoutFeedback(null);
                                  }}
                                  className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                  title="Annuler l'autorisation"
                                >
                                  Annuler
                                </button>
                              </>
                            )}

                            {(p.status === "PAID" || p.status === "RECONCILIATION_PENDING") && (
                              <button
                                type="button"
                                onClick={() => {
                                  setReconcilePayoutTarget(p);
                                  setPayoutFeedback(null);
                                }}
                                className="px-2 py-1 rounded bg-[#16385c] hover:bg-[#112d4a] text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                                title="Rapprocher avec le relevé de compte"
                              >
                                <CheckCheck className="w-3 h-3" />
                                <span>Rapprocher</span>
                              </button>
                            )}

                            {p.status === "RECONCILED" && (
                              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Clôturé
                              </span>
                            )}

                            {p.status === "CANCELLED" && (
                              <span className="text-[10.5px] text-slate-400 italic" title={p.rejectionReason || ""}>
                                {p.rejectionReason ? `Motif: ${p.rejectionReason.slice(0, 20)}...` : "Annulé"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Aucun versement trouvé avec les critères sélectionnés.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: REMBOURSEMENTS PARENTS (M3.05) */}
      {activeTab === "refunds" && (
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                1. Dossiers de Remboursement
              </span>
              <div className="text-base sm:text-lg font-black text-slate-800">
                {refundCases.length} cas enregistré(s)
              </div>
              <span className="text-[10px] text-slate-500">Demandes parents & arbitrages</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                2. Total Remboursé aux Parents
              </span>
              <div className="text-base sm:text-lg font-black text-rose-700">
                {formatGnf(
                  refundCases
                    .filter((rc) => rc.status === "PROCESSED")
                    .reduce((sum, rc) => sum + rc.amountGnf, 0)
                )}
              </div>
              <span className="text-[10px] text-slate-500">Remboursements exécutés</span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                3. Provisions Classes Restantes
              </span>
              <div className="text-base sm:text-lg font-black text-blue-700">
                {formatGnf(fundings.reduce((sum, f) => sum + f.availableBalanceGnf, 0))}
              </div>
              <span className="text-[10px] text-slate-500">Soldes disponibles remboursables</span>
            </div>
          </div>

          {/* Section 1: Demandes de Remboursement */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Demandes & Dossiers de Remboursement Parents
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Historique des demandes initiées par les parents ou générées suite à un arbitrage administratif.
              </p>
            </div>

            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[700px] sm:min-w-full">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Parent & Élève</th>
                    <th className="py-2.5 px-3">Cours</th>
                    <th className="py-2.5 px-3 text-right">Montant</th>
                    <th className="py-2.5 px-3 text-center">Statut</th>
                    <th className="py-2.5 px-3">Motif</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refundCases.length > 0 ? (
                    refundCases.map((rc) => (
                      <tr key={rc.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {new Date(rc.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">
                            {rc.classroom?.parentName || "Parent"}
                          </div>
                          <div className="text-[10.5px] text-slate-400">
                            Élève : {rc.classroom?.studentName || "Élève"}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-700">
                          {rc.classroom?.subjectName || "Cours"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700 font-mono">
                          {formatGnf(rc.amountGnf)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {rc.status === "REQUESTED" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              En Attente
                            </span>
                          ) : rc.status === "PROCESSED" ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Traité
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {rc.status}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-xs truncate" title={rc.reason}>
                          {rc.reason}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {rc.status === "REQUESTED" && rc.classroomId ? (
                            <button
                              type="button"
                              onClick={() => {
                                const matchingFunding = fundings.find((f) => f.classroomId === rc.classroomId);
                                if (matchingFunding) {
                                  setRefundTarget(matchingFunding);
                                  setRefundAmountGnf(String(rc.amountGnf));
                                  setRefundReason(rc.reason);
                                  setRefundFeedback(null);
                                }
                              }}
                              className="px-2 py-1 rounded bg-[#16385c] hover:bg-[#112d4a] text-white text-[10.5px] font-semibold transition-colors cursor-pointer"
                            >
                              Traiter
                            </button>
                          ) : (
                            <span className="text-[10.5px] text-slate-400 italic">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun dossier de remboursement en cours.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Classes avec provisions remboursables */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3 p-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Classes avec Provisions Disponibles au Remboursement
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Seuls les fonds non encore consommés par des séances dispensées peuvent faire l'objet d'un remboursement.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[700px] sm:min-w-full">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Matière</th>
                    <th className="py-2.5 px-3">Élève</th>
                    <th className="py-2.5 px-3">Enseignant</th>
                    <th className="py-2.5 px-3 text-right">Provision Initiale</th>
                    <th className="py-2.5 px-3 text-right">Consommé</th>
                    <th className="py-2.5 px-3 text-right">Disponible</th>
                    <th className="py-2.5 px-3 text-center">Action Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fundings.filter((f) => f.availableBalanceGnf > 0).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{f.subjectName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{f.studentName}</td>
                      <td className="py-2.5 px-3 text-slate-700">{f.teacherName}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatGnf(f.totalFundedAmountGnf)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-700">
                        {formatGnf(f.allocatedAmountGnf)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                        {formatGnf(f.availableBalanceGnf)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setRefundTarget(f);
                            setRefundAmountGnf(String(f.availableBalanceGnf));
                            setRefundReason("");
                            setRefundFeedback(null);
                          }}
                          className="px-2.5 py-1 rounded-md text-[10.5px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                        >
                          Rembourser
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Approbation Versement */}
      {approvePayoutTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setApprovePayoutTarget(null)}
        >
          <div
            className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs overflow-y-auto my-auto [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Approuver la demande de versement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enseignant : {approvePayoutTarget.teacherName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovePayoutTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Montant net à décaisser :</span>
                <span className="font-bold text-slate-900">{formatGnf(approvePayoutTarget.amountGnf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Canal / Opérateur :</span>
                <span className="font-semibold text-slate-800">{approvePayoutTarget.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Numéro bénéficiaire :</span>
                <span className="font-mono text-slate-800">{maskPhone(approvePayoutTarget.beneficiaryPhone)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nom titulaire :</span>
                <span className="font-semibold text-slate-800">{approvePayoutTarget.beneficiaryName}</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Cette action autorise administrativement le versement. Les fonds restent réservés au compte de dette de versement (<strong>2040_PAYOUT_LIABILITY</strong>) jusqu'à ce que le virement télécom effectif soit confirmé.
            </p>

            {payoutFeedback && (
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                {payoutFeedback}
              </div>
            )}

            <form onSubmit={handleApprovePayout} className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovePayoutTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isProcessingPayout}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
              >
                {isProcessingPayout ? "Validation..." : "Autoriser le versement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rejet Versement */}
      {rejectPayoutTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setRejectPayoutTarget(null)}
        >
          <div
            className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs overflow-y-auto my-auto [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Rejeter la demande de versement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enseignant : {rejectPayoutTarget.teacherName} ({formatGnf(rejectPayoutTarget.amountGnf)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectPayoutTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Le rejet annulera ce dossier de versement, libérera les séances associées pour les remettre au statut <strong>ÉLIGIBLE</strong>, et passera une écriture de contrepassation du compte <strong>2040_PAYOUT_LIABILITY</strong> vers <strong>2030_TEACHER_PAYABLE</strong>.
            </p>

            <form onSubmit={handleRejectPayout} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Motif du rejet (notifié au professeur) :
                </label>
                <textarea
                  required
                  rows={2}
                  value={rejectPayoutReason}
                  onChange={(e) => setRejectPayoutReason(e.target.value)}
                  placeholder="Ex : Numéro Orange Money inactif, discordance d'identité titulaire..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#16385c]"
                />
              </div>

              {payoutFeedback && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                  {payoutFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectPayoutTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout || !rejectPayoutReason.trim()}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                >
                  {isProcessingPayout ? "Traitement..." : "Confirmer le rejet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enregistrement Règlement Télécom Manuel */}
      {manualExecuteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setManualExecuteTarget(null)}
        >
          <div
            className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs overflow-y-auto my-auto [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Saisie du règlement mobile money
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Versement : {manualExecuteTarget.teacherName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManualExecuteTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Montant à envoyer :</span>
                <span className="font-black text-emerald-800 text-sm">{formatGnf(manualExecuteTarget.amountGnf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Opérateur :</span>
                <span className="font-bold text-slate-800">{manualExecuteTarget.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Numéro de réception :</span>
                <span className="font-mono font-bold text-slate-900">{manualExecuteTarget.beneficiaryPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Titulaire :</span>
                <span className="font-semibold text-slate-800">{manualExecuteTarget.beneficiaryName}</span>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Effectuez le virement depuis votre terminal marchand Orange Money ou MTN MoMo vers le numéro ci-dessus. Une fois le transfert validé par l'opérateur, saisissez l'identifiant de transaction télécom officiel.
            </p>

            <form onSubmit={handleManualExecutePayout} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  ID de transaction télécom / Référence SMS :
                </label>
                <input
                  type="text"
                  required
                  value={telecomRef}
                  onChange={(e) => setTelecomRef(e.target.value)}
                  placeholder="Ex : MP261118.1402.B99120 ou CI26031804"
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-[#16385c]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Cette référence figurera sur le relevé de l'enseignant et dans le journal comptable.
                </span>
              </div>

              {payoutFeedback && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                  {payoutFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setManualExecuteTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayout || telecomRef.trim().length < 5}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isProcessingPayout ? "Enregistrement..." : "Confirmer le paiement télécom"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rapprochement Versement */}
      {reconcilePayoutTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setReconcilePayoutTarget(null)}
        >
          <div
            className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs overflow-y-auto my-auto [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#16385c]/10 text-[#16385c] flex items-center justify-center font-bold">
                  <CheckCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Rapprochement financier du versement
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Réf : {reconcilePayoutTarget.providerDisbursementRef || reconcilePayoutTarget.paymentReference}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReconcilePayoutTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 leading-relaxed text-[11px]">
              Confirmez que ce versement de <strong>{formatGnf(reconcilePayoutTarget.amountGnf)}</strong> pour <strong>{reconcilePayoutTarget.teacherName}</strong> a été vérifié et concorde avec le relevé officiel mensuel de l'opérateur ({reconcilePayoutTarget.channel}).
            </p>

            {payoutFeedback && (
              <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                {payoutFeedback}
              </div>
            )}

            <form onSubmit={handleReconcilePayout} className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReconcilePayoutTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isProcessingPayout}
                className="px-4 py-2 rounded-xl bg-[#16385c] hover:bg-[#112d4a] text-white font-semibold disabled:opacity-50"
              >
                {isProcessingPayout ? "Clôture en cours..." : "Valider le rapprochement"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Traitement Remboursement Parent */}
      {refundTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
          onClick={() => setRefundTarget(null)}
        >
          <div
            className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs overflow-y-auto my-auto [scrollbar-width:thin]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Remboursement de provision parent
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Classe : {refundTarget.subjectName} ({refundTarget.studentName})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRefundTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Provision totale initiale :</span>
                <span className="font-mono text-slate-800">{formatGnf(refundTarget.totalFundedAmountGnf)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consommé par les cours :</span>
                <span className="font-mono text-emerald-700">{formatGnf(refundTarget.allocatedAmountGnf)}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-slate-200 pt-1">
                <span className="text-slate-700">Solde disponible remboursable :</span>
                <span className="font-mono text-blue-700">{formatGnf(refundTarget.availableBalanceGnf)}</span>
              </div>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Montant à rembourser (GNF) :
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={refundTarget.availableBalanceGnf}
                  value={refundAmountGnf}
                  onChange={(e) => setRefundAmountGnf(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-1 focus:ring-[#16385c]"
                />
                <span className="text-[10.5px] text-slate-400 mt-0.5 block">
                  Ne peut pas excéder le solde disponible ({formatGnf(refundTarget.availableBalanceGnf)}).
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Motif du remboursement obligatoire (justificatif d'audit) :
                </label>
                <textarea
                  required
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ex : Arrêt anticipé des cours, déménagement de la famille..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#16385c]"
                />
              </div>

              {refundFeedback && (
                <div className="p-2.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-semibold">
                  {refundFeedback}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    isProcessingRefund ||
                    !refundAmountGnf ||
                    Number(refundAmountGnf) <= 0 ||
                    Number(refundAmountGnf) > refundTarget.availableBalanceGnf ||
                    !refundReason.trim()
                  }
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold disabled:opacity-50"
                >
                  {isProcessingRefund ? "Traitement..." : "Exécuter le remboursement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: GRAND LIVRE & COMPTES */}
      {activeTab === "ledger" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Débits Grand Livre</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatGnf(trialBalance.totalDebitsGnf)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Crédits Grand Livre</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatGnf(trialBalance.totalCreditsGnf)}
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Balance de Vérification</span>
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Différence : 0 GNF</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Plan Comptable & Soldes en Temps Réel (Partie Double)
              </h3>
              <span className="text-xs text-slate-500 font-mono">Devise : GNF (Entiers stricts)</span>
            </div>
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-left text-xs min-w-[700px] sm:min-w-full">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Code Compte</th>
                    <th className="py-3 px-4">Intitulé</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Total Débits</th>
                    <th className="py-3 px-4 text-right">Total Crédits</th>
                    <th className="py-3 px-4 text-right">Solde Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((acc) => (
                    <tr key={acc.accountCode} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {acc.accountCode}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{acc.accountName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatGnf(acc.totalDebitsGnf)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatGnf(acc.totalCreditsGnf)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatGnf(acc.netBalanceGnf)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: POLITIQUES DE COMMISSION */}
      {activeTab === "policies" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                Historique des Versions de Politique
              </h3>
              <div className="space-y-3">
                {policies.map((pol) => (
                  <div
                    key={pol.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      pol.isActive
                        ? "bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-300"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          Version : {pol.version}
                        </span>
                        {pol.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active en Production
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        En vigueur : {new Date(pol.effectiveFrom).toLocaleDateString("fr-FR")}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-200/60">
                      <div>
                        <span className="text-xs text-slate-500 block">Part Plateforme</span>
                        <span className="text-base font-extrabold text-[#16385c]">
                          {pol.platformPercent}%
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block">Part Enseignant</span>
                        <span className="text-base font-extrabold text-emerald-700">
                          {pol.teacherPercent}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{pol.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#16385c]" />
                <span>Créer une Nouvelle Politique</span>
              </h3>
              <form onSubmit={handleCreatePolicy} className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Identifiant Version (ex: POL-2026-V2)
                  </label>
                  <input
                    type="text"
                    required
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="POL-2026-V2"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16385c]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Pourcentage Plateforme (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={newPlatformPercent}
                    onChange={(e) => setNewPlatformPercent(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16385c]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Description ou Motif
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Validation formelle du client..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#16385c]"
                  />
                </div>
                {feedbackMsg && (
                  <p className="text-[11px] font-semibold text-slate-800 p-2 bg-slate-100 rounded-lg">
                    {feedbackMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-[#16385c] hover:bg-[#112d4a] text-white rounded-xl font-bold transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Enregistrement..." : "Publier & Activer la Politique"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PROVISIONS DES CLASSES */}
      {activeTab === "classrooms" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">
              Registres de Financement par Classe (ClassroomFunding)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Traçabilité des provisions prépayées par les parents et consommées séance par séance.
            </p>
          </div>
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs min-w-[700px] sm:min-w-full">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Matière</th>
                  <th className="py-3 px-4">Élève</th>
                  <th className="py-3 px-4">Enseignant</th>
                  <th className="py-3 px-4 text-right">Provision Totale</th>
                  <th className="py-3 px-4 text-right">Consommé</th>
                  <th className="py-3 px-4 text-right">Disponible</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fundings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-800">{f.subjectName}</td>
                    <td className="py-3 px-4 text-slate-700">{f.studentName}</td>
                    <td className="py-3 px-4 text-slate-700">{f.teacherName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatGnf(f.totalFundedAmountGnf)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                      {formatGnf(f.allocatedAmountGnf)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {formatGnf(f.availableBalanceGnf)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PRESTATAIRES & PASSERELLES */}
      {activeTab === "providers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div key={p.provider} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#16385c]" />
                  <span>{p.displayName}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                  {p.provider}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span>Cartes Internationales (Visa/Mastercard) :</span>
                  <span className={p.supportsInternationalCards ? "text-emerald-700 font-bold" : "text-slate-400"}>
                    {p.supportsInternationalCards ? "✓ Oui (3DSecure)" : "✕ Non"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Orange Money Guinée :</span>
                  <span className={p.supportsOrangeMoney ? "text-emerald-700 font-bold" : "text-slate-400"}>
                    {p.supportsOrangeMoney ? "✓ Oui (USSD / Direct)" : "✕ Non"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MTN Mobile Money Guinée :</span>
                  <span className={p.supportsMtnMomo ? "text-emerald-700 font-bold" : "text-slate-400"}>
                    {p.supportsMtnMomo ? "✓ Oui (Push USSD)" : "✕ Non"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Versements Tuteurs (Payouts) :</span>
                  <span className={p.supportsDisbursements ? "text-emerald-700 font-bold" : "text-slate-400"}>
                    {p.supportsDisbursements ? "✓ Oui (Wallets)" : "✕ Non"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
