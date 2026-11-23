"use client";

import React, { useState, useMemo } from "react";
import {
  Wallet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  User,
  GraduationCap,
  Sparkles,
  HelpCircle,
  X,
  RefreshCw,
  Plus,
  Smartphone,
  Check,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";

export interface TeacherEarningItem {
  id: string;
  sessionId: string;
  lessonDate: string;
  subjectName: string;
  studentName: string;
  studentGrade: string;
  grossAmountGnf: number;
  commissionRatePercent: number;
  platformCommissionGnf: number;
  teacherNetGnf: number;
  earningsStatus: string;
  isPaidOut: boolean;
  validatedAt: string;
}

export interface TeacherPendingSessionItem {
  id: string;
  scheduledStart: string;
  subjectName: string;
  studentName: string;
  durationMinutes: number;
  estimatedGrossGnf: number;
  status: string;
}

export interface TeacherPayoutItem {
  id: string;
  amountGnf: number;
  paymentReference: string;
  status: string;
  method: string;
  createdAt: string;
  confirmedAt: string | null;
}

export interface TeacherDestinationItem {
  id: string;
  operator: string;
  phone: string;
  accountHolderName: string;
  isDefault: boolean;
  verificationStatus: string;
}

interface TeacherFinancesClientProps {
  summary: {
    availableGnf: number;
    pendingValidationGnf: number;
    reservedGnf: number;
    paidGnf: number;
    totalEarnedHistoricalGnf: number;
  };
  earnings: TeacherEarningItem[];
  pendingSessions: TeacherPendingSessionItem[];
  payouts: TeacherPayoutItem[];
  destinations?: TeacherDestinationItem[];
}

export function TeacherFinancesClient({
  summary: initialSummary,
  earnings: initialEarnings,
  pendingSessions,
  payouts: initialPayouts,
  destinations: initialDestinations = [],
}: TeacherFinancesClientProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [summary, setSummary] = useState(initialSummary);
  const [earnings, setEarnings] = useState(initialEarnings);
  const [payouts, setPayouts] = useState(initialPayouts);
  const [destinations, setDestinations] = useState(initialDestinations);

  // Modals
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showDestinationModal, setShowDestinationModal] = useState<boolean>(false);

  // Payout request form
  const [requestedAmount, setRequestedAmount] = useState<string>("");
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    initialDestinations.find((d) => d.isDefault)?.id || initialDestinations[0]?.id || ""
  );
  const [payoutSubmitting, setPayoutSubmitting] = useState<boolean>(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccessMessage, setPayoutSuccessMessage] = useState<string | null>(null);

  // New destination form
  const [newOperator, setNewOperator] = useState<string>("ORANGE_MONEY");
  const [newPhone, setNewPhone] = useState<string>("");
  const [newHolderName, setNewHolderName] = useState<string>("");
  const [newIsDefault, setNewIsDefault] = useState<boolean>(true);
  const [destSubmitting, setDestSubmitting] = useState<boolean>(false);
  const [destError, setDestError] = useState<string | null>(null);

  const filteredEarnings = useMemo(() => {
    return earnings.filter((e) => {
      if (filterStatus === "AVAILABLE" && e.earningsStatus !== "ELIGIBLE") return false;
      if (filterStatus === "PAID" && !e.isPaidOut && e.earningsStatus !== "PAID") return false;
      if (filterStatus === "REVERSED" && e.earningsStatus !== "REVERSED") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = e.subjectName.toLowerCase().includes(q);
        const matchesStudent = e.studentName.toLowerCase().includes(q);
        if (!matchesSubject && !matchesStudent) return false;
      }
      return true;
    });
  }, [earnings, filterStatus, searchQuery]);

  // Handle payout submission
  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);
    setPayoutSuccessMessage(null);

    const amount = parseInt(requestedAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setPayoutError("Veuillez saisir un montant valide.");
      return;
    }

    if (amount > summary.availableGnf) {
      setPayoutError(`Le montant demandé excède votre solde disponible (${formatGnf(summary.availableGnf)}).`);
      return;
    }

    if (amount <= 0) {
      setPayoutError("Veuillez saisir un montant supérieur à 0 GNF.");
      return;
    }

    if (!selectedDestinationId && destinations.length === 0) {
      setPayoutError("Veuillez enregistrer un compte de versement Orange Money ou MTN MoMo.");
      return;
    }

    setPayoutSubmitting(true);
    try {
      const res = await fetch("/api/teacher/finances/payout-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountGnf: amount,
          destinationId: selectedDestinationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la demande de versement.");
      }

      setPayoutSuccessMessage("Votre demande de versement a été transmise à notre service financier avec succès.");
      setSummary((prev) => ({
        ...prev,
        availableGnf: prev.availableGnf - amount,
        reservedGnf: prev.reservedGnf + amount,
      }));

      // Add to payouts list
      if (data.payout) {
        setPayouts((prev) => [
          {
            id: data.payout.id,
            amountGnf: data.payout.amountGnf,
            paymentReference: data.payout.paymentReference,
            status: data.payout.status,
            method: data.payout.channel,
            createdAt: new Date().toISOString(),
            confirmedAt: null,
          },
          ...prev,
        ]);
      }

      setTimeout(() => {
        setShowPayoutModal(false);
        setRequestedAmount("");
        setPayoutSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setPayoutError(err.message || "Erreur réseau.");
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Handle adding a destination
  const handleAddDestination = async (e: React.FormEvent) => {
    e.preventDefault();
    setDestError(null);

    if (!newPhone || newPhone.trim().length < 8) {
      setDestError("Veuillez saisir un numéro de téléphone mobile money guinéen valide.");
      return;
    }
    if (!newHolderName || newHolderName.trim().length < 2) {
      setDestError("Veuillez saisir le nom complet du titulaire de la ligne.");
      return;
    }

    setDestSubmitting(true);
    try {
      const res = await fetch("/api/teacher/finances/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operator: newOperator,
          phone: newPhone.trim(),
          accountHolderName: newHolderName.trim(),
          isDefault: newIsDefault,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'enregistrement du compte.");
      }

      if (data.destination) {
        setDestDestinations((prev: TeacherDestinationItem[]) => {
          const next = prev.map((d) => (newIsDefault ? { ...d, isDefault: false } : d));
          return [data.destination, ...next];
        });
        setSelectedDestinationId(data.destination.id);
      }

      setShowDestinationModal(false);
      setNewPhone("");
      setNewHolderName("");
    } catch (err: any) {
      setDestError(err.message || "Erreur réseau.");
    } finally {
      setDestSubmitting(false);
    }
  };

  function setDestDestinations(updater: (prev: TeacherDestinationItem[]) => TeacherDestinationItem[]) {
    setDestinations((prev) => updater(prev));
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gestion financière & Rémunérations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Mes revenus & Virements
          </h1>
          <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
            Consultez le décompte de vos cours dispensés, vos rémunérations nettes disponibles et gérez vos comptes Mobile Money (Orange Money & MTN MoMo).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            type="button"
            onClick={() => setShowDestinationModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs backdrop-blur-xs transition-all border border-white/10"
          >
            <Smartphone className="w-4 h-4 text-amber-300" />
            <span>Mes comptes Mobile Money</span>
          </button>
          <button
            type="button"
            onClick={() => setShowPayoutModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold text-xs shadow-lg shadow-amber-400/20 transition-all hover:scale-102 active:scale-98"
          >
            <Wallet className="w-4 h-4" />
            <span>Demander un versement</span>
          </button>
        </div>
      </div>

      {/* 4 Autoritative KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gains disponibles
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatGnf(summary.availableGnf)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
              <span>Prêts pour versement</span>
            </p>
          </div>
        </div>

        {/* Pending Validation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En attente de validation
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatGnf(summary.pendingValidationGnf)}
            </div>
            <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
              <span>{pendingSessions.length} séance(s) en attente</span>
            </p>
          </div>
        </div>

        {/* Reserved Payouts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              En cours de versement
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatGnf(summary.reservedGnf)}
            </div>
            <p className="text-[11px] text-blue-700 mt-1 flex items-center gap-1 font-medium">
              <span>Demandes en traitement</span>
            </p>
          </div>
        </div>

        {/* Total Historical Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Rémunérations versées
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatGnf(summary.paidGnf)}
            </div>
            <p className="text-[11px] text-indigo-700 mt-1 flex items-center gap-1 font-medium">
              <span>Total historique décaissé</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Table of Remunerations & Payout History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="font-bold text-sm text-slate-800">
              Détail des rémunérations par séance ({filteredEarnings.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher élève ou matière..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setFilterStatus("ALL")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${filterStatus === "ALL" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("AVAILABLE")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${filterStatus === "AVAILABLE" ? "bg-emerald-600 text-white" : "text-slate-600 hover:text-emerald-700"
                  }`}
              >
                Disponibles
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("PAID")}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${filterStatus === "PAID" ? "bg-indigo-600 text-white" : "text-slate-600 hover:text-indigo-700"
                  }`}
              >
                Versés
              </button>
            </div>
          </div>
        </div>

        {/* Remuneration Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date du cours</th>
                <th className="py-3 px-4">Élève & Classe</th>
                <th className="py-3 px-4">Matière</th>
                <th className="py-3 px-4 text-right">Brut (GNF)</th>
                <th className="py-3 px-4 text-center">Commission</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Net Enseignant</th>
                <th className="py-3 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEarnings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Aucune rémunération trouvée</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Les gains s'afficheront automatiquement dès qu'une séance est validée par le parent.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEarnings.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(e.lessonDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{e.studentName}</div>
                      <div className="text-[11px] text-slate-400">{e.studentGrade}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                        {e.subjectName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">
                      {formatGnf(e.grossAmountGnf)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {e.commissionRatePercent}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatGnf(e.teacherNetGnf)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {e.isPaidOut || e.earningsStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Versé</span>
                        </span>
                      ) : e.earningsStatus === "RESERVED_FOR_PAYOUT" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>En cours de virement</span>
                        </span>
                      ) : e.earningsStatus === "ELIGIBLE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Disponible</span>
                        </span>
                      ) : e.earningsStatus === "REVERSED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3" />
                          <span>Annulé</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>En attente</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/60 text-blue-900 flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#16385c] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[#16385c]">
              Règlement hebdomadaire sans frais retenus :
            </span>
            <p className="text-blue-800 text-[11px] leading-relaxed">
              Vos rémunérations validées sont décaissées chaque semaine vers votre portefeuille Orange Money ou MTN Mobile Money. Monsieur Fanyi prend intégralement en charge les frais de transfert opérateur : <strong>aucun centime n'est déduit</strong> de votre part contractuelle de 85 %.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-slate-500" />
            <h3 className="font-bold text-sm text-slate-800">
              Historique des demandes de versement ({payouts.length})
            </h3>
          </div>
        </div>

        {payouts.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Aucun versement demandé à ce jour.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900">
                    {formatGnf(p.amountGnf)} via {p.method}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Demandé le {new Date(p.createdAt).toLocaleDateString("fr-FR")} — Réf : {p.paymentReference}
                  </div>
                </div>
                <div>
                  {p.status === "PAID" || p.status === "RECONCILED" ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                      Viré
                    </span>
                  ) : p.status === "APPROVED" ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px]">
                      Approuvé
                    </span>
                  ) : p.status === "FAILED" || p.status === "CANCELLED" ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">
                      {p.status === "CANCELLED" ? "Annulé" : "Échoué"}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px]">
                      En attente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACTIVE PAYOUT REQUEST MODAL (Phase M3.05) */}
      {showPayoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowPayoutModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Demander un versement
                  </h3>
                  <p className="text-xs text-slate-500">
                    Solde disponible : <strong className="text-slate-900">{formatGnf(summary.availableGnf)}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            {payoutSuccessMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <Check className="w-4 h-4 shrink-0" />
                <span>{payoutSuccessMessage}</span>
              </div>
            )}

            {summary.availableGnf < 50000 ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2 text-xs">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Solde inférieur au seuil minimum</span>
                </p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Le montant minimum pour demander un versement est de <strong>50 000 GNF</strong>. Dès que vos prochaines séances seront validées par les parents d'élèves, vos gains seront immédiatement débloqués.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayout} className="space-y-4 text-xs">
                {/* Select Destination Wallet */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Compte de réception Mobile Money
                  </label>
                  {destinations.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                      <p className="text-slate-500 text-[11px]">
                        Aucun compte Mobile Money enregistré.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPayoutModal(false);
                          setShowDestinationModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                      >
                        + Ajouter Orange Money ou MTN MoMo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {destinations.map((d) => (
                        <label
                          key={d.id}
                          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedDestinationId === d.id
                              ? "border-blue-600 bg-blue-50/50"
                              : "border-slate-200 hover:border-slate-300"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="destination"
                              value={d.id}
                              checked={selectedDestinationId === d.id}
                              onChange={() => setSelectedDestinationId(d.id)}
                              className="text-blue-600"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {d.operator === "ORANGE_MONEY" ? "Orange Money Guinée" : "MTN Mobile Money"}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {d.phone} • {d.accountHolderName}
                              </div>
                            </div>
                          </div>
                          {d.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                              Par défaut
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-semibold">
                      Montant à retirer (GNF)
                    </label>
                    <button
                      type="button"
                      onClick={() => setRequestedAmount(summary.availableGnf.toString())}
                      className="text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                    >
                      Tout retirer ({formatGnf(summary.availableGnf)})
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={summary.availableGnf}
                    placeholder="Ex: 100000"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Seuil indicatif proposé : 50 000 GNF (en attente de confirmation contractuelle) • Sans frais de retrait opérateur prélevés par Monsieur Fanyi
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1 text-[11px]">
                  <p className="font-semibold text-slate-800">Processus de règlement sécurisé</p>
                  <p className="text-slate-500">
                    Votre demande sera examinée par l'administration financière, puis transmise directement vers votre compte Mobile Money.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={payoutSubmitting || destinations.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-blue-600/20"
                  >
                    {payoutSubmitting ? "Envoi en cours..." : "Confirmer le versement"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MANAGE DESTINATIONS MODAL */}
      {showDestinationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowDestinationModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-slate-800">
                  Mes comptes Mobile Money
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDestinationModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {destError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {destError}
              </div>
            )}

            {/* List of existing */}
            {destinations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-600">Comptes enregistrés</h4>
                {destinations.map((d) => (
                  <div key={d.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">
                        {d.operator === "ORANGE_MONEY" ? "Orange Money" : "MTN MoMo"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {d.phone} • {d.accountHolderName}
                      </div>
                    </div>
                    {d.isDefault && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Par défaut
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add new destination */}
            <form onSubmit={handleAddDestination} className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <h4 className="text-xs font-bold text-slate-800">+ Ajouter un nouveau numéro</h4>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Opérateur Mobile Money
                </label>
                <select
                  value={newOperator}
                  onChange={(e) => setNewOperator(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  <option value="ORANGE_MONEY">Orange Money Guinée (61x, 62x)</option>
                  <option value="MTN_MOMO">MTN Mobile Money Guinée (65x, 66x)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Numéro de téléphone (+224)
                </label>
                <input
                  type="tel"
                  placeholder="+224 620 00 00 00"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Nom complet du titulaire
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alpha Soumah"
                  value={newHolderName}
                  onChange={(e) => setNewHolderName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="defaultCheck"
                  checked={newIsDefault}
                  onChange={(e) => setNewIsDefault(e.target.checked)}
                  className="rounded-sm text-blue-600"
                />
                <label htmlFor="defaultCheck" className="text-slate-600 cursor-pointer text-[11px]">
                  Définir comme compte de versement par défaut
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDestinationModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  disabled={destSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {destSubmitting ? "Enregistrement..." : "Enregistrer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
