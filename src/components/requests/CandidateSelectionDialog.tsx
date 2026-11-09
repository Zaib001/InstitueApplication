"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";

interface CandidateSelectionDialogProps {
  requestId: string;
  applicationId: string;
  teacherName: string;
  studentName: string;
  subjectName: string;
  proposedRateGnf?: number | null;
  proposedRateType?: string | null;
  onConfirmSuccess: (result: any) => void;
  onClose: () => void;
}

export function CandidateSelectionDialog({
  requestId,
  applicationId,
  teacherName,
  studentName,
  subjectName,
  proposedRateGnf,
  proposedRateType,
  onConfirmSuccess,
  onClose,
}: CandidateSelectionDialogProps) {
  const { locale } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/parent/requests/${requestId}/applications/${applicationId}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de valider ce professeur");
        setIsSubmitting(false);
        return;
      }
      onConfirmSuccess(data);
    } catch {
      setError("Erreur de connexion avec le serveur");
      setIsSubmitting(false);
    }
  };

  const isMonthly = proposedRateType === "MONTHLY" || !proposedRateType;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">
                {locale === "en" ? "Confirm Teacher Selection" : "Confirmer le choix du professeur"}
              </h3>
              <p className="text-xs text-slate-500">
                {locale === "en"
                  ? "Creation of the tutoring classroom"
                  : "Création officielle de la classe de soutien"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Teacher & Subject Summary */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {locale === "en" ? "Selected Teacher" : "Professeur retenu"}
              </span>
              <span className="font-bold text-[#16385c]">{teacherName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {locale === "en" ? "Student & Subject" : "Élève & Matière"}
              </span>
              <span className="font-medium text-slate-700">
                {studentName} • {subjectName}
              </span>
            </div>
            {proposedRateGnf && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-xs text-slate-500">
                  {locale === "en" ? "Agreed Pricing" : "Tarif convenu"}
                </span>
                <span className="font-bold text-emerald-700">
                  {formatGnf(proposedRateGnf)}{" "}
                  <span className="text-[11px] font-normal text-slate-500">
                    {isMonthly
                      ? locale === "en" ? "/month package" : "/forfait mensuel"
                      : locale === "en" ? "/hour" : "/heure"}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Operational Policy Invariants */}
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {locale === "en"
                  ? "A new Classroom will be established with status Pending Payment."
                  : "Une nouvelle Classe sera créée avec le statut En attente de paiement."}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {locale === "en"
                  ? "Your tutoring request will be marked as Matched and closed to further applications."
                  : "Votre demande sera marquée comme Pourvue et fermée aux nouvelles candidatures."}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                {locale === "en"
                  ? "Other applicants will be politely notified that another candidate was selected."
                  : "Les autres candidats seront automatiquement informés avec bienveillance."}
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                {locale === "en"
                  ? "Advance Payment Invariant: No sessions may occur and no teacher compensation is generated until the advance payment is completed."
                  : "Règle de prépaiement : Les cours ne peuvent débuter qu'après le règlement de la première provision. Aucun gain enseignant n'est généré prématurément."}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {locale === "en" ? "Cancel" : "Annuler"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{locale === "en" ? "Assigning..." : "Affectation..."}</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>
                  {locale === "en" ? "Confirm & Create Classroom" : "Confirmer & Créer la classe"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

