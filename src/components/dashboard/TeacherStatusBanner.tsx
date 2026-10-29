"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { TeacherVerificationStatus } from "@prisma/client";

interface TeacherStatusBannerProps {
  status: TeacherVerificationStatus;
  rejectionReason: string | null;
}

export function TeacherStatusBanner({ status, rejectionReason }: TeacherStatusBannerProps) {
  const { t, locale } = useTranslation();

  if (status === TeacherVerificationStatus.DRAFT) {
    return (
      <div className="mx-6 lg:mx-8 mt-6 p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <FileEdit className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold text-xs block text-amber-900">
              {locale === "en"
                ? "Accreditation dossier incomplete (Draft)"
                : "Dossier d'accréditation incomplet (Brouillon)"}
            </span>
            <span className="text-[11px] text-amber-800">
              {locale === "en"
                ? "Specify your subjects, availability, and upload identity & diploma documents to obtain admin approval."
                : "Renseignez vos matières, disponibilités et justificatifs certifiés pour obtenir l'approbation de l'administration."}
            </span>
          </div>
        </div>
        <Link
          href="/teacher/onboarding"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16385c] hover:bg-[#10243d] text-white text-xs font-semibold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>{locale === "en" ? "Complete My Dossier" : "Compléter mon dossier"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === TeacherVerificationStatus.PENDING_REVIEW) {
    return (
      <div className="mx-6 lg:mx-8 mt-6 p-4 rounded-3xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div>
            <span className="font-bold text-xs block text-blue-900">
              {locale === "en"
                ? "Application under administrative review"
                : "Candidature en cours d'examen administratif"}
            </span>
            <span className="text-[11px] text-blue-800">
              {locale === "en"
                ? "Your complete application has been submitted. Our pedagogical team reviews credentials within 24 business hours."
                : "Votre dossier complet a été transmis. Notre équipe pédagogique valide les pièces sous 24h ouvrées."}
            </span>
          </div>
        </div>
        <Link
          href="/teacher/onboarding"
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-100/50 text-blue-800 text-xs font-semibold transition-colors shrink-0 self-start sm:self-center"
        >
          <span>{locale === "en" ? "View My Dossier" : "Consulter mon dossier"}</span>
        </Link>
      </div>
    );
  }

  if (status === TeacherVerificationStatus.REJECTED) {
    return (
      <div className="mx-6 lg:mx-8 mt-6 p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <span className="font-bold text-xs block text-rose-900">
              {locale === "en"
                ? "Corrections required for your application"
                : "Complément requis pour votre dossier"}
            </span>
            <span className="text-[11px] text-rose-800">
              {locale === "en" ? "Reason:" : "Motif :"} {rejectionReason || (locale === "en" ? "Documents need to be updated." : "Des justificatifs nécessitent d'être remplacés.")}
            </span>
          </div>
        </div>
        <Link
          href="/teacher/onboarding"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-all shrink-0 self-start sm:self-center"
        >
          <span>{locale === "en" ? "Correct & Resubmit" : "Corriger et renvoyer"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  if (status === TeacherVerificationStatus.APPROVED) {
    return (
      <div className="mx-6 lg:mx-8 mt-6 p-3.5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold text-xs text-emerald-900">
            {locale === "en"
              ? "Accredited & Verified Teacher by Monsieur Fanyi • Full marketplace access in Conakry"
              : "Enseignant Agréé & Vérifié par Monsieur Fanyi • Accès complet au marketplace de Conakry"}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900">
          {locale === "en" ? "Active" : "Actif"}
        </span>
      </div>
    );
  }

  return null;
}
