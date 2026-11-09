"use client";

import React from "react";
import {
  X,
  Wallet,
  ShieldAlert,
  Info,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";

export interface PackageModalData {
  classroomId: string;
  subjectName: string;
  studentName: string;
  teacherName: string;
  mode: string;
  status: string;
  packageDetails?: {
    totalAmountGnf: number;
    sessionsCount: number;
    minutesPerSession: number;
    totalPlannedMinutes: number;
    pricingType: string;
    commissionRatePercent: number;
    totalPlatformCommissionGnf: number;
    totalTeacherShareGnf: number;
    allocations?: Array<{
      sessionIndex: number;
      allocatedAmountGnf: number;
      platformCommissionGnf: number;
      teacherNetGnf: number;
    }>;
  } | null;
  viewerRole?: "PARENT" | "TEACHER" | "ADMIN";
}

interface ClassroomPackageModalProps {
  data: PackageModalData;
  onClose: () => void;
}

export function ClassroomPackageModal({ data, onClose }: ClassroomPackageModalProps) {
  const { t, locale } = useTranslation();
  const pkg = data.packageDetails;

  const isTeacher = data.viewerRole === "TEACHER";
  const isAdmin = data.viewerRole === "ADMIN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 pb-4 bg-[#16385c] text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 font-bold shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate">
                {t("classes.modalTitle", "Détails Financiers & Forfait Convenu")}
              </h3>
              <p className="text-white/70 text-xs truncate">
                {data.subjectName} • {data.studentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* Main Info Strip */}
          <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t("classes.colSubjectMode", "Matière")}
                </span>
                <span className="font-bold text-slate-800 text-xs block truncate mt-0.5">
                  {data.subjectName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t("classes.studentLabel", "Élève")}
                </span>
                <span className="font-bold text-slate-800 text-xs block truncate mt-0.5">
                  {data.studentName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t("classes.tutorLabel", "Professeur")}
                </span>
                <span className="font-bold text-emerald-800 text-xs block truncate mt-0.5">
                  {data.teacherName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {t("classes.colStatus", "Statut")}
                </span>
                <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] inline-block mt-0.5">
                  {data.status === "PENDING_PAYMENT"
                    ? t("classes.statusPendingPayment", "En attente de paiement")
                    : data.status === "ACTIVE"
                    ? t("classes.statusActive", "Classe Active")
                    : data.status}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Terms Breakdown */}
          {pkg ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    {t("classes.grossTotal", "Total Brut du Forfait")}
                  </span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">
                    {formatGnf(pkg.totalAmountGnf)}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {pkg.sessionsCount} {t("classes.sessionsUnit", "séances")} • {pkg.minutesPerSession} min
                  </span>
                </div>

                {/* Show Net Share to Teacher or Admin */}
                {(isTeacher || isAdmin) && (
                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 block text-[10px] uppercase font-semibold">
                      {t("classes.tutorNetShare", "Part Nette Enseignant (85%)")}
                    </span>
                    <span className="text-lg font-black text-emerald-800 mt-1 block">
                      {formatGnf(pkg.totalTeacherShareGnf)}
                    </span>
                    <span className="text-[10px] text-emerald-600">
                      {locale === "en" ? "Projected net share" : "Part nette estimée"}
                    </span>
                  </div>
                )}

                {/* Show Commission to Admin */}
                {isAdmin && (
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="text-blue-700 block text-[10px] uppercase font-semibold">
                      {t("classes.platformCommission", "Commission Monsieur Fanyi (15%)")}
                    </span>
                    <span className="text-lg font-black text-blue-900 mt-1 block">
                      {formatGnf(pkg.totalPlatformCommissionGnf)}
                    </span>
                    <span className="text-[10px] text-blue-600">
                      {locale === "en" ? "Snapshot" : "Snapshot immuable"}
                    </span>
                  </div>
                )}

                {/* Show Effective Cost to Parent */}
                {!isTeacher && !isAdmin && (
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                    <span className="text-blue-700 block text-[10px] uppercase font-semibold">
                      {t("classes.unitValuePerSession", "Coût Moyen / Séance")}
                    </span>
                    <span className="text-lg font-black text-blue-900 mt-1 block">
                      {formatGnf(Math.round(pkg.totalAmountGnf / pkg.sessionsCount))}
                    </span>
                    <span className="text-[10px] text-blue-600">
                      {pkg.minutesPerSession} min / {t("classes.sessionsUnit", "séance")}
                    </span>
                  </div>
                )}
              </div>

              {/* Exact Per-Session Breakdown Table */}
              {pkg.allocations && pkg.allocations.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>{t("classes.sessionBreakdownTitle", "Échéancier d'Allocation Déterministe par Séance")}</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {t("classes.sessionBreakdownSubtitle", "Chaque franc guinéen est alloué avec précision sans perte d'arrondi.")}
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-100">
                          <th className="py-2 px-3">{t("classes.colSession", "Séance")}</th>
                          <th className="py-2 px-3">{t("classes.colGross", "Montant Brut")}</th>
                          {(isTeacher || isAdmin) && <th className="py-2 px-3">{t("classes.colTeacherNet", "Net Tuteur (85%)")}</th>}
                          {isAdmin && <th className="py-2 px-3">{t("classes.colCommission", "Commission (15%)")}</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pkg.allocations.map((alloc) => (
                          <tr key={alloc.sessionIndex} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-700">
                              {t("classes.colSession", "Séance")} #{alloc.sessionIndex}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {formatGnf(alloc.allocatedAmountGnf)}
                            </td>
                            {(isTeacher || isAdmin) && (
                              <td className="py-2 px-3 font-semibold text-emerald-700">
                                {formatGnf(alloc.teacherNetGnf)}
                              </td>
                            )}
                            {isAdmin && (
                              <td className="py-2 px-3 text-blue-700">
                                {formatGnf(alloc.platformCommissionGnf)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500">
              {locale === "en"
                ? "No structured package recorded yet for this class."
                : "Aucun forfait structuré n'est encore enregistré pour cette classe."}
            </div>
          )}

          {/* Advance Payment Security Policy Notice */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t("classes.escrowNoticeTitle", "Séquestre & Sécurité Financière :")}</span>
            </span>
            <p className="leading-relaxed text-[11px]">
              {t(
                "classes.escrowNoticeDesc",
                "Les fonds restent consignés sur le compte de la classe et ne sont débloqués qu'après validation parentale de chaque séance dispensée."
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {t("classes.closeBtn", "Fermer")}
          </button>
        </div>
      </div>
    </div>
  );
}
