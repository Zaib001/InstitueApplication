"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Archive } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { StudentCardData } from "./StudentCard";

interface ConfirmStudentActionDialogProps {
  student: StudentCardData;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmStudentActionDialog({
  student,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmStudentActionDialogProps) {
  const { t, locale } = useTranslation();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <h3 className="font-extrabold text-sm text-slate-800">
              {t("parent.confirmDelete.title", "Confirmation de retrait de l'élève")}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {locale === "en" ? (
            <>
              Are you sure you want to remove <strong>{student.fullName}</strong> ({student.gradeLevel})?
            </>
          ) : (
            <>
              Êtes-vous sûr de vouloir retirer <strong>{student.fullName}</strong> ({student.gradeLevel}) ?
            </>
          )}
        </p>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <Archive className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            {t(
              "parent.confirmDelete.desc",
              "Si cet élève a des classes ou demandes existantes, son profil sera archivé pour préserver l'historique pédagogique."
            )}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t("parent.confirmDelete.cancelBtn", "Conserver l'élève")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {isLoading
                ? (locale === "en" ? "Processing..." : "Traitement...")
                : t("parent.confirmDelete.confirmBtn", "Confirmer le retrait")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
