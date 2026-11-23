"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Loader2,
  HelpCircle,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { PaymentReceiptModal } from "./PaymentReceiptModal";

interface PaymentItem {
  id: string;
  intentReference: string;
  transactionReference: string | null;
  providerTransactionId: string | null;
  classroomId: string | null;
  subjectName: string;
  studentName: string;
  teacherName: string;
  packageId: string | null;
  packageType: string;
  sessionsCount: number;
  minutesPerSession: number;
  amountGnf: number;
  customerAmount: number;
  customerCurrency: string;
  provider: string;
  selectedMethod: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
  expiresAt: string;
  receiptAvailable: boolean;
  requiresReconciliation: boolean;
}

export function ParentPaymentsClient() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReceiptRef, setSelectedReceiptRef] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/parent/payments");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Impossible de charger vos paiements.");
      }
      setPayments(json.payments || []);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        p.intentReference.toLowerCase().includes(q) ||
        p.subjectName.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.teacherName.toLowerCase().includes(q) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status
    if (statusFilter === "ALL") return true;
    if (statusFilter === "SUCCEEDED") return p.status === "SUCCEEDED";
    if (statusFilter === "PENDING") return p.status === "PENDING" || p.status === "CREATED";
    if (statusFilter === "RECONCILIATION") return p.status === "REQUIRES_RECONCILIATION";
    if (statusFilter === "FAILED") return p.status === "FAILED" || p.status === "CANCELLED" || p.status === "EXPIRED";

    return true;
  });

  // Calculate totals safely
  const totalSettledGnf = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((sum, p) => sum + p.amountGnf, 0);

  const activeFundedCount = payments.filter((p) => p.status === "SUCCEEDED").length;
  const pendingReconciliationCount = payments.filter(
    (p) => p.status === "REQUIRES_RECONCILIATION"
  ).length;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#16385c] tracking-tight">
              Historique des Règlements & Reçus
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
              {payments.length} transaction(s)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Consultez vos approvisionnements de forfaits, téléchargez vos reçus officiels et suivez l'état de vos provisions de cours.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPayments}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
          <a
            href="/parent/classes"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs"
          >
            <span>Mes classes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Total Prépayé & Confirmé
            </span>
            <span className="text-lg font-extrabold text-emerald-800 block mt-1">
              {loading ? "..." : formatGnf(totalSettledGnf)}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Sécurisé en provisions de cours
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Forfaits Validés
            </span>
            <span className="text-lg font-extrabold text-[#16385c] block mt-1">
              {loading ? "..." : `${activeFundedCount} forfait(s)`}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Reçus officiels disponibles
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              En Rapprochement
            </span>
            <span className="text-lg font-extrabold text-amber-700 block mt-1">
              {loading ? "..." : `${pendingReconciliationCount} transaction(s)`}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Fonds protégés en vérification
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 overflow-x-auto text-xs font-semibold [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { value: "ALL", label: "Tous", count: payments.length },
            {
              value: "SUCCEEDED",
              label: "Payés",
              count: payments.filter((p) => p.status === "SUCCEEDED").length,
            },
            {
              value: "PENDING",
              label: "En attente",
              count: payments.filter((p) => p.status === "PENDING" || p.status === "CREATED").length,
            },
            {
              value: "RECONCILIATION",
              label: "Rapprochement",
              count: payments.filter((p) => p.status === "REQUIRES_RECONCILIATION").length,
            },
            {
              value: "FAILED",
              label: "Échoués / Expirés",
              count: payments.filter(
                (p) => p.status === "FAILED" || p.status === "CANCELLED" || p.status === "EXPIRED"
              ).length,
            },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 text-[11px] opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par réf, matière, élève..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#16385c] outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Main Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading && (
          <div className="py-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#16385c] mx-auto" />
            <p className="text-xs text-slate-500 font-medium">
              Chargement de votre historique de paiement...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold">
              !
            </div>
            <p className="text-xs font-semibold text-rose-700">{error}</p>
            <button
              type="button"
              onClick={fetchPayments}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] cursor-pointer"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && filteredPayments.length === 0 && (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto font-bold">
              <Wallet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">
              Aucun règlement trouvé
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "ALL"
                ? "Aucun paiement ne correspond à vos filtres de recherche."
                : "Vous n'avez pas encore effectué de prépaiement de cours."}
            </p>
            <a
              href="/parent/classes"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all cursor-pointer mt-2"
            >
              <span>Voir mes classes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {!loading && !error && filteredPayments.length > 0 && (
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left text-xs min-w-[650px] sm:min-w-full">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Réf.</th>
                  <th className="py-3 px-4">Prestation / Élève</th>
                  <th className="py-3 px-4">Mode & Passerelle</th>
                  <th className="py-3 px-4 text-right">Montant</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Date & Ref */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-[#16385c]">
                          {p.intentReference}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Service / Student */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{p.subjectName}</div>
                        <div className="text-[11px] text-slate-500">
                          Élève : <span className="font-medium text-slate-700">{p.studentName}</span> • Tuteur : {p.teacherName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {p.packageType} ({p.sessionsCount} séance{p.sessionsCount > 1 ? "s" : ""})
                        </div>
                      </td>

                      {/* Method & Provider */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">
                          {p.selectedMethod === "ORANGE_MONEY"
                            ? "Orange Money"
                            : p.selectedMethod === "MTN_MOMO"
                            ? "MTN Mobile Money"
                            : "Carte Bancaire"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Passerelle : {p.provider}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-extrabold text-sm text-slate-900 block">
                          {formatGnf(p.amountGnf)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Provision intégrale
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {p.status === "SUCCEEDED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Payé</span>
                          </span>
                        )}

                        {p.status === "REQUIRES_RECONCILIATION" && (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 cursor-help"
                            title="Fonds encaissés en provisions non affectées. En cours de validation administrative."
                          >
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>En rapprochement</span>
                          </span>
                        )}

                        {(p.status === "PENDING" || p.status === "CREATED") && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>En attente</span>
                          </span>
                        )}

                        {p.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Échoué</span>
                          </span>
                        )}

                        {p.status === "EXPIRED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Expiré</span>
                          </span>
                        )}

                        {p.status === "CANCELLED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span>Annulé</span>
                          </span>
                        )}
                      </td>

                      {/* Receipt Action */}
                      <td className="py-3 px-4 text-right">
                        {p.receiptAvailable ? (
                          <button
                            type="button"
                            onClick={() => setSelectedReceiptRef(p.intentReference)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#16385c] bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Reçu</span>
                          </button>
                        ) : p.status === "REQUIRES_RECONCILIATION" ? (
                          <span className="text-[10px] text-amber-600 font-medium">
                            En révision
                          </span>
                        ) : p.status === "FAILED" || p.status === "EXPIRED" ? (
                          <a
                            href="/parent/classes"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:underline"
                          >
                            <span>Réessayer</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Non disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for viewing and printing receipt */}
      {selectedReceiptRef && (
        <PaymentReceiptModal
          intentReference={selectedReceiptRef}
          onClose={() => setSelectedReceiptRef(null)}
        />
      )}
    </div>
  );
}

