"use client";

import React from "react";
import {
  X,
  GraduationCap,
  Award,
  BookOpen,
  MapPin,
  Clock,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface TeacherProfileModalData {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  yearsOfExperience: number;
  city: string;
  serviceArea?: string | null;
  degrees?: string | null;
  institution?: string | null;
  isHomeAvailable: boolean;
  isOnlineAvailable: boolean;
  verificationStatus: string;
  subjects: string[];
  gradeLevels: string[];
  ratingAverage?: number | null;
  ratingsCount?: number;
}

interface TeacherProfileModalProps {
  teacher: TeacherProfileModalData;
  onClose: () => void;
}

export function TeacherProfileModal({ teacher, onClose }: TeacherProfileModalProps) {
  const { locale } = useTranslation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-[#16385c] to-[#204e7d] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-lg text-white">
              {teacher.avatarUrl ? (
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                teacher.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{teacher.fullName}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Verified Teacher" : "Professeur Vérifié"}</span>
                </span>
              </div>
              {teacher.headline && (
                <p className="text-xs text-white/80 line-clamp-1">{teacher.headline}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Quick stats pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Experience" : "Expérience"}
              </span>
              <span className="font-bold text-slate-800 text-base">
                {teacher.yearsOfExperience}{" "}
                {locale === "en" ? "years" : "ans"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Rating" : "Évaluation"}
              </span>
              <span className="font-bold text-amber-600 text-base flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                {teacher.ratingAverage ? `${teacher.ratingAverage}/5` : "Nouveau"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "City" : "Ville"}
              </span>
              <span className="font-bold text-slate-800 text-base">
                {teacher.city || "Conakry"}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                {locale === "en" ? "Mode" : "Formats"}
              </span>
              <span className="font-bold text-slate-800 text-xs">
                {teacher.isHomeAvailable && teacher.isOnlineAvailable
                  ? locale === "en" ? "Home & Online" : "Domicile & Ligne"
                  : teacher.isHomeAvailable
                  ? locale === "en" ? "In-Home" : "À domicile"
                  : locale === "en" ? "Online" : "En ligne"}
              </span>
            </div>
          </div>

          {/* Bio / Presentation */}
          {teacher.bio && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === "en" ? "Pedagogical Presentation" : "Présentation pédagogique"}</span>
              </h4>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                {teacher.bio}
              </p>
            </div>
          )}

          {/* Education & Qualifications */}
          {(teacher.degrees || teacher.institution) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === "en" ? "Qualifications & Degrees" : "Diplômes & Formation"}</span>
              </h4>
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                {teacher.degrees && (
                  <p className="font-semibold text-emerald-950">{teacher.degrees}</p>
                )}
                {teacher.institution && (
                  <p className="text-xs text-emerald-700">{teacher.institution}</p>
                )}
              </div>
            </div>
          )}

          {/* Subjects Taught */}
          {teacher.subjects.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === "en" ? "Approved Teaching Subjects" : "Matières certifiées"}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((sub, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-[#16385c]/5 text-[#16385c] border border-[#16385c]/10"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Grade levels / Cycles */}
          {teacher.gradeLevels.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-slate-500" />
                <span>{locale === "en" ? "Education Levels" : "Niveaux & Cycles"}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {teacher.gradeLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              {locale === "en"
                ? "Teacher identity and qualifications are verified by Monsieur Fanyi. Direct contact details will be unlocked once your classroom is confirmed and funded."
                : "L'identité et les diplômes de l'enseignant ont été validés par l'équipe Monsieur Fanyi. Les coordonnées directes seront accessibles une fois la classe confirmée et financée."}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            {locale === "en" ? "Close" : "Fermer"}
          </button>
        </div>
      </div>
    </div>
  );
}

