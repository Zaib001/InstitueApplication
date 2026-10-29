"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Award,
  GraduationCap,
  BookOpen,
  Clock,
  MapPin,
  Phone,
  Mail,
  Wallet,
  Calendar,
  ExternalLink,
  Download,
  Edit3,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedUser } from "@/lib/auth/session";

interface DocumentItem {
  id: string;
  type: string;
  title: string;
  fileSizeBytes: number;
  status: string;
  fileUrl?: string;
}

interface SubjectItem {
  id: string;
  name: string;
  category: string | null;
}

interface GradeLevelItem {
  id: string;
  name: string;
  cycle: string;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface TeacherApprovedDossierViewProps {
  user: AuthenticatedUser;
  headline: string;
  bio: string;
  yearsOfExperience: number;
  degrees: string;
  institution: string;
  city: string;
  serviceArea: string;
  isHomeAvailable: boolean;
  isOnlineAvailable: boolean;
  hourlyRateGnf: number | "";
  monthlyPackageRateGnf: number | "";
  monthlyPackageSessions: number;
  monthlyPackageHoursPerSession: number;
  selectedSubjects: SubjectItem[];
  selectedGradeLevels: GradeLevelItem[];
  availabilities: AvailabilitySlot[];
  documents: DocumentItem[];
  submittedAt: string | null;
  onEditDossier?: () => void;
}

export function TeacherApprovedDossierView({
  user,
  headline,
  bio,
  yearsOfExperience,
  degrees,
  institution,
  city,
  serviceArea,
  isHomeAvailable,
  isOnlineAvailable,
  hourlyRateGnf,
  monthlyPackageRateGnf,
  monthlyPackageSessions,
  monthlyPackageHoursPerSession,
  selectedSubjects,
  selectedGradeLevels,
  availabilities,
  documents,
  submittedAt,
  onEditDossier,
}: TeacherApprovedDossierViewProps) {
  const { t, locale } = useTranslation();

  const dayNamesFr = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNames = locale === "en" ? dayNamesEn : dayNamesFr;

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} Ko`;
    return `${(kb / 1024).toFixed(1)} Mo`;
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "NATIONAL_ID":
        return locale === "en" ? "National Identity Card (CNI)" : "Carte Nationale d'Identité (CNI)";
      case "PASSPORT":
        return locale === "en" ? "Guinean Passport" : "Passeport Guinéen";
      case "DIPLOMA":
        return locale === "en" ? "University Degree" : "Diplôme Universitaire";
      case "POLICE_RECORD":
        return locale === "en" ? "Police Clearance Record" : "Casier Judiciaire (Bulletin N°3)";
      case "CV":
        return locale === "en" ? "Curriculum Vitae" : "Curriculum Vitae (CV)";
      default:
        return locale === "en" ? "Certified Document" : "Justificatif";
    }
  };

  // 85% rule
  const teacherShare = typeof monthlyPackageRateGnf === "number" ? Math.round(monthlyPackageRateGnf * 0.85) : 680000;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {locale === "en" ? "Accredited & Verified" : "Dossier Validé & Accrédité"}
            </span>
            <span className="text-xs text-slate-400 font-medium">SRD V2.0</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en" ? "Accredited Teacher Dossier" : "Dossier d'Enseignant Accrédité"}
          </h1>
          <p className="text-xs text-slate-500">
            {locale === "en"
              ? "Your academic credentials, verified documents, and teaching terms approved by the pedagogical board."
              : "Vos diplômes, pièces d'identité et modalités d'enseignement validés par l'administration Monsieur Fanyi."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/dashboard"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors border border-slate-200/90 shadow-xs"
          >
            {locale === "en" ? "Back to Dashboard" : "Tableau de bord"}
          </Link>
          {onEditDossier && (
            <button
              type="button"
              onClick={onEditDossier}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white px-3.5 py-2 rounded-xl bg-[#16385c] hover:bg-[#122e4d] shadow-sm transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Edit Details" : "Modifier mes informations"}</span>
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. Official Accreditation Badge Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-md shadow-emerald-600/10 shrink-0">
            <ShieldCheck className="w-9 h-9 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 font-heading">
                {locale === "en"
                  ? "Certified Monsieur Fanyi Educator"
                  : "Enseignant Officiellement Agréé Monsieur Fanyi"}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white tracking-wider">
                {locale === "en" ? "Active" : "Habilité"}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {locale === "en"
                ? "Your identity proofs, degrees, and academic experience have been authenticated by the administrative review committee. You are actively listed for tutoring requests across Conakry and Guinea."
                : "Votre identité, vos diplômes et vos compétences pédagogiques ont été vérifiés et certifiés. Vous êtes officiellement habilité à postuler et dispenser des cours aux élèves inscrits sur la plateforme."}
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-emerald-100">
          <span className="text-[11px] text-slate-500 font-medium">
            {locale === "en" ? "Dossier ID:" : "N° d'Agrément :"}
          </span>
          <span className="text-xs font-mono font-bold text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200/70">
            MF-GN-{(user.id || "0000").slice(0, 8).toUpperCase()}
          </span>
        </div>
      </div>

      {/* 3. Grid of Profile Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Main Pedagogical & Personal Dossier */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Personal Identity Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {locale === "en" ? "Personal & Contact Information" : "Identité & Coordonnées"}
                </h3>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                {locale === "en" ? "Verified" : "Validé"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Full Name" : "Nom & Prénom"}</span>
                <span className="font-bold text-slate-800 text-sm">{user.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Email Address" : "Adresse e-mail"}</span>
                <span className="font-semibold text-slate-700">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Phone Number" : "Numéro de téléphone"}</span>
                <span className="font-semibold text-slate-700">{user.phoneNumber || "+224 620 00 00 00"}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "City / Location" : "Ville de résidence"}</span>
                <span className="font-semibold text-slate-700">{city || "Conakry"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Teaching Zones / Communes" : "Communes & Quartiers d'intervention"}</span>
                <span className="font-semibold text-slate-700">{serviceArea || "Ratoma, Kipé, Lambanyi, Dixinn"}</span>
              </div>
              <div className="sm:col-span-2 flex items-center gap-4 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {isHomeAvailable ? (locale === "en" ? "In-Home Tutoring Available" : "Cours à domicile actif") : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {isOnlineAvailable ? (locale === "en" ? "Online Tutoring Available" : "Cours en ligne actif") : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Academic Background & Qualifications */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-[#e59a38]" />
                <h3 className="font-bold text-sm text-slate-800">
                  {locale === "en" ? "Academic Qualifications & Bio" : "Titres Académiques & Parcours"}
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {yearsOfExperience} {locale === "en" ? "years exp." : "ans d'expérience"}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Professional Headline" : "Titre professionnel"}</span>
                <p className="font-bold text-slate-800 text-sm">
                  {headline || "Professeur certifié de l'enseignement secondaire guinéen"}
                </p>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Highest Degree & University" : "Plus haut diplôme & Institution"}</span>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">{degrees || "Master 2 Didactique des Sciences"}</span>
                    <span className="text-slate-500 text-[11px]">{institution || "Université Gamal Abdel Nasser de Conakry (UGANC)"}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{locale === "en" ? "Pedagogical Biography" : "Présentation & Pédagogie"}</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                  {bio || "Enseignant passionné et rigoureux, engagé pour l'excellence académique des élèves guinéens."}
                </p>
              </div>
            </div>
          </div>

          {/* Subjects & Grade Levels */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <BookOpen className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-800">
                {locale === "en" ? "Authorized Subjects & Cycles" : "Matières & Niveaux d'Intervention Agréés"}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {locale === "en" ? "Subjects" : "Matières dispensées"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.length > 0 ? (
                    selectedSubjects.map((sub) => (
                      <span
                        key={sub.id}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                        {sub.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Mathématiques, Physique-Chimie</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {locale === "en" ? "Cycles & Grade Levels" : "Niveaux & Cycles scolaires"}
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedGradeLevels.length > 0 ? (
                    selectedGradeLevels.map((gl) => (
                      <span
                        key={gl.id}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-900 font-semibold text-xs"
                      >
                        {gl.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Terminale Sciences Mathématiques, Brevet BEPC</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Column 3: Verified Documents, Rates & Schedule */}
        <div className="space-y-6">

          {/* Verified Documents Dossier */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {locale === "en" ? "Verified Documents" : "Justificatifs Certifiés"}
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {documents.length} {locale === "en" ? "docs" : "pièces"}
              </span>
            </div>

            <div className="space-y-2.5">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {getDocTypeLabel(doc.type)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {locale === "en" ? "Verified" : "Vérifié"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                        <span className="text-[10px] text-slate-400">{formatFileSize(doc.fileSizeBytes)}</span>
                      </div>

                      <a
                        href={`/api/teacher/documents/${doc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-xs shrink-0"
                        title={locale === "en" ? "View document" : "Consulter le document"}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-400">
                  {locale === "en" ? "Documents are securely archived." : "Pièces archivées de manière sécurisée."}
                </div>
              )}
            </div>
          </div>

          {/* Rates & Net Earnings Card */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Wallet className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-sm text-slate-800">
                {locale === "en" ? "Rates & 85% Net Payout" : "Tarification & Part Nette (85%)"}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-1">
                <span className="text-[11px] font-medium text-teal-800 block">
                  {locale === "en" ? "Monthly Package (8 Sessions of 2h)" : "Forfait Mensuel (8 Séances de 2h)"}
                </span>
                <div className="text-xl font-black text-teal-900">
                  {new Intl.NumberFormat("fr-GN").format(Number(monthlyPackageRateGnf) || 800000)} GNF
                </div>
                <div className="text-[11px] font-bold text-teal-700 pt-1 border-t border-teal-200/60">
                  {locale === "en" ? "Your net share (85%): " : "Votre part nette (85%) : "}
                  {new Intl.NumberFormat("fr-GN").format(teacherShare)} GNF
                </div>
              </div>

              {hourlyRateGnf && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">{locale === "en" ? "Single Hourly Rate" : "Tarif horaire à l'unité"}</span>
                  <span className="font-bold text-slate-800">{new Intl.NumberFormat("fr-GN").format(Number(hourlyRateGnf))} GNF / h</span>
                </div>
              )}
            </div>
          </div>

          {/* Weekly Recurring Availability */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-800">
                {locale === "en" ? "Recurring Availability" : "Créneaux Disponibles"}
              </h3>
            </div>

            <div className="space-y-2">
              {availabilities.length > 0 ? (
                availabilities.map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <span className="font-bold text-slate-800">{dayNames[slot.dayOfWeek]}</span>
                    <span className="text-slate-600 font-mono font-medium">
                      {slot.startTime} — {slot.endTime}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-center py-2">
                  {locale === "en" ? "Flexible upon request" : "Sur rendez-vous avec le parent"}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
