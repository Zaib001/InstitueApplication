"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Printer,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CreditCard,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";

interface PaymentReceiptModalProps {
  intentReference: string;
  onClose: () => void;
}

export function PaymentReceiptModal({
  intentReference,
  onClose,
}: PaymentReceiptModalProps) {
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReceipt() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/parent/payments/${intentReference}/receipt`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Impossible de charger le reçu.");
        }
        setReceipt(json.receipt);
      } catch (err: any) {
        setError(err.message || "Erreur de chargement du reçu.");
      } finally {
        setLoading(false);
      }
    }
    if (intentReference) {
      fetchReceipt();
    }
  }, [intentReference]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[calc(100vh-2rem)] sm:max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-xs my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#16385c] text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Reçu de paiement — Monsieur Fanyi</h3>
              <p className="text-[11px] text-white/70">
                Réf : {intentReference}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {receipt && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors cursor-pointer"
                title="Imprimer le reçu"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimer</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 print:p-0 print:m-0">
          {loading && (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#16385c] mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Génération sécurisée du reçu officiel...
              </p>
            </div>
          )}

          {error && (
            <div className="py-12 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-bold">
                !
              </div>
              <p className="text-xs font-semibold text-rose-700">{error}</p>
            </div>
          )}

          {receipt && !loading && !error && (
            <div className="space-y-4 print:text-black">
              {/* Receipt Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold text-[#16385c] tracking-tight">
                    MONSIEUR FANYI
                  </h2>
                  <p className="text-[10px] text-slate-500">
                    {receipt.company.tagline}
                  </p>
                  {receipt.company.address && (
                    <p className="text-[10px] text-slate-500">
                      {receipt.company.address}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                      {receipt.company.phone}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5 text-slate-400" />
                      {receipt.company.email}
                    </span>
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{receipt.status}</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    {receipt.receiptNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Émis le : {new Date(receipt.issueDate).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {/* Payer and Tutor summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Parent d'élève (Payeur)
                  </span>
                  <div className="font-bold text-slate-800">{receipt.payer.name}</div>
                  <div className="text-[11px] text-slate-600">{receipt.payer.email}</div>
                  <div className="text-[11px] text-slate-600">{receipt.payer.phone}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Prestation & Enseignant
                  </span>
                  <div className="font-bold text-slate-800">{receipt.service.subjectName}</div>
                  <div className="text-[11px] text-slate-600">
                    Élève : <span className="font-medium text-slate-800">{receipt.service.studentName}</span> ({receipt.service.studentGrade})
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Professeur : <span className="font-medium text-slate-800">{receipt.service.teacherName}</span>
                  </div>
                </div>
              </div>

              {/* Package & Service details */}
              <div className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Détail du Forfait Prépayé
                </span>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
                    <span className="text-[10px] text-slate-400 block">Formule</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {receipt.service.packageType}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
                    <span className="text-[10px] text-slate-400 block">Volume</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {receipt.service.sessionsCount} séances
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs">
                    <span className="text-[10px] text-slate-400 block">Durée</span>
                    <span className="font-bold text-slate-800 text-xs block mt-0.5">
                      {receipt.service.minutesPerSession} min / séance
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Transaction Breakdown */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-200/50">
                  <span className="text-slate-600">Mode de règlement :</span>
                  <span className="font-bold text-slate-800">
                    {receipt.payment.paymentMethod === "ORANGE_MONEY"
                      ? "Orange Money Guinée"
                      : receipt.payment.paymentMethod === "MTN_MOMO"
                        ? "MTN Mobile Money Guinée"
                        : "Carte Bancaire (Visa/Mastercard)"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-200/50">
                  <span className="text-slate-600">Passerelle de paiement :</span>
                  <span className="font-bold text-slate-800">{receipt.payment.provider}</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-200/50">
                  <span className="text-slate-600">Réf. transactionnelle :</span>
                  <span className="font-mono text-[11px] text-slate-700">
                    {receipt.payment.transactionReference || receipt.payment.intentReference}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-emerald-200/50">
                  <span className="text-slate-600">Montant des cours :</span>
                  <span className="font-semibold text-slate-800">
                    {formatGnf(
                      receipt.payment.courseAmountGnf ||
                        receipt.payment.amountGnf - (receipt.payment.parentFeeGnf || 0)
                    )}
                  </span>
                </div>

                {receipt.payment.parentFeeGnf > 0 && (
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-emerald-200/50">
                    <span className="text-slate-600">Contribution frais de paiement (2 %) :</span>
                    <span className="font-semibold text-slate-800">
                      +{formatGnf(receipt.payment.parentFeeGnf)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-sm text-[#16385c]">
                    Total réglé :
                  </span>
                  <span className="font-extrabold text-base text-emerald-800">
                    {formatGnf(receipt.payment.amountGnf)}
                  </span>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                <p className="font-semibold text-slate-700 mb-0.5">
                  Notice de garantie & Provisions de cours :
                </p>
                <p>{receipt.terms.notice}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

