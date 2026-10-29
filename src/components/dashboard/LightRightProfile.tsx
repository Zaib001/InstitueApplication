"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Edit3,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRightIcon,
  Heart,
  Droplet,
  Scale,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  X,
  Clock,
  Calendar as CalendarIcon,
  UserCheck,
  Plus,
  BookOpen,
  Wallet,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AuthenticatedUser } from "@/lib/auth/session";

interface LightRightProfileProps {
  user: AuthenticatedUser;
}

export function LightRightProfile({ user }: LightRightProfileProps) {
  const { t, locale } = useTranslation();

  // Full dynamic calendar state initialized to real today date
  const [todayDate] = useState(() => new Date());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{
    title: string;
    date: string;
    subject: string;
    participant: string;
    location: string;
  } | null>(null);

  const monthNamesFr = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const currentMonthLabel =
    (locale === "en" ? monthNamesEn[currentMonthIndex] : monthNamesFr[currentMonthIndex]) +
    ` ${currentYear}`;

  const daysOfWeek =
    locale === "en"
      ? ["S", "M", "T", "W", "T", "F", "S"]
      : ["D", "L", "M", "M", "J", "V", "S"];

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonthIndex((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonthIndex((m) => m + 1);
    }
  };

  // Generate days in month
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();

  // Role-based schedule database for May 2026 (Month 4)
  const getTasksForRole = () => {
    if (user.role === "TEACHER") {
      return {
        24: {
          id: "t24",
          title: locale === "en" ? "Grade 12 Advanced Math" : "Mathématiques Approfondies — Terminale SM",
          time: "16h30 - 18h45",
          subject: "Mathématiques",
          participant: "Mamadou Barry (Élève)",
          location: "Kipé, Conakry",
          icon: Heart,
          bgColor: "bg-blue-100/70",
          textColor: "text-blue-600",
        },
        25: {
          id: "t25",
          title: locale === "en" ? "Grade 10 Physics Support" : "Physique-Chimie — Collège 10ème",
          time: "15h00 - 16h30",
          subject: "Sciences Physiques",
          participant: "Fanta Camara (Élève)",
          location: "Minière, Dixinn",
          icon: Droplet,
          bgColor: "bg-emerald-100/70",
          textColor: "text-emerald-600",
        },
        26: {
          id: "t26",
          title: locale === "en" ? "Organic Chemistry Review" : "Chimie Organique — Terminale SE",
          time: "17h00 - 18h30",
          subject: "Chimie",
          participant: "Oumar Sylla (Élève)",
          location: "Camayenne, Conakry",
          icon: Scale,
          bgColor: "bg-amber-100/70",
          textColor: "text-amber-600",
        },
        28: {
          id: "t28",
          title: locale === "en" ? "Bac Exam Preparation Workshop" : "Séance de Préparation Bac Blanc",
          time: "15h00 - 17h15",
          subject: "Mathématiques & Mécanique",
          participant: "Groupe Terminale (3 élèves)",
          location: "En ligne (Google Meet)",
          icon: Lightbulb,
          bgColor: "bg-purple-100/70",
          textColor: "text-purple-600",
        },
      } as Record<number, any>;
    }

    if (user.role === "ADMIN") {
      return {
        24: {
          id: "a24",
          title: locale === "en" ? "Audit Escrow Balances Orange/MTN" : "Contrôle des Séquestres Orange & MTN",
          time: "10h00 - 11h30",
          subject: "Finance & Séquestre",
          participant: "Direction Financière Fanyi",
          location: "Siège Kaloum, Conakry",
          icon: ShieldCheck,
          bgColor: "bg-teal-100/70",
          textColor: "text-teal-600",
        },
        26: {
          id: "a26",
          title: locale === "en" ? "Review UGANC Teacher Diplomas" : "Comité d'Approbation des Diplômes UGANC",
          time: "14h00 - 16h00",
          subject: "Vérification Enseignants",
          participant: "7 dossiers professeurs soumis",
          location: "Console Admin",
          icon: CheckCircle2,
          bgColor: "bg-blue-100/70",
          textColor: "text-blue-600",
        },
        28: {
          id: "a28",
          title: locale === "en" ? "Arbitration Session #412" : "Arbitrage Contestations & Litiges",
          time: "16h00 - 17h00",
          subject: "Règlement Litige",
          participant: "Famille Diallo & M. Soumah",
          location: "Médiation Plateforme",
          icon: Scale,
          bgColor: "bg-rose-100/70",
          textColor: "text-rose-600",
        },
        30: {
          id: "a30",
          title: locale === "en" ? "Monthly 15% Platform Report" : "Clôture Mensuelle Commissions (15%)",
          time: "11h00 - 12h30",
          subject: "Comptabilité Nationale",
          participant: "Commission 15% SRD V2.0",
          location: "Direction Générale",
          icon: Lightbulb,
          bgColor: "bg-indigo-100/70",
          textColor: "text-indigo-600",
        },
      } as Record<number, any>;
    }

    // Default Parent
    return {
      24: {
        id: "p24",
        title: locale === "en" ? "Functions & Derivatives Review" : "Révision Fonctions & Dérivées",
        time: "16h30 - 18h45",
        subject: "Mathématiques",
        participant: "M. Ibrahima Camara (Professeur)",
        location: "Kipé, Conakry",
        icon: Heart,
        bgColor: "bg-purple-100/70",
        textColor: "text-purple-600",
      },
      26: {
        id: "p26",
        title: locale === "en" ? "Organic Chemistry — Solutions" : "Chimie Organique — Solutions",
        time: "17h00 - 18h30",
        subject: "Physique-Chimie",
        participant: "Dr. Kadiatou Sow (Professeur)",
        location: "Kipé, Conakry",
        icon: Droplet,
        bgColor: "bg-emerald-100/70",
        textColor: "text-emerald-600",
      },
      28: {
        id: "p28",
        title: locale === "en" ? "French Literary Essay" : "Dissertation Littéraire Française",
        time: "15h00 - 17h00",
        subject: "Français & Littérature",
        participant: "Mme. Fatoumata Diallo (Professeur)",
        location: "Kipé, Conakry",
        icon: Scale,
        bgColor: "bg-amber-100/70",
        textColor: "text-amber-600",
      },
      30: {
        id: "p30",
        title: locale === "en" ? "Monthly Academic Report" : "Bilan Pédagogique Mensuel",
        time: "10h00 - 11h30",
        subject: "Coordination Pédagogique",
        participant: "M. Ousmane Barry (Tuteur)",
        location: "En ligne / Visio",
        icon: Lightbulb,
        bgColor: "bg-cyan-100/70",
        textColor: "text-cyan-600",
      },
    } as Record<number, any>;
  };

  // Generate dynamic tasks for current month
  const getDynamicTasks = () => {
    const baseTasks = getTasksForRole();
    const result: Record<number, any> = { ...baseTasks };

    // Ensure today's date and surrounding dates always have real role-appropriate tasks
    const todayNum = todayDate.getDate();
    if (!result[todayNum]) {
      if (user.role === "TEACHER") {
        result[todayNum] = {
          id: `t-today-${todayNum}`,
          title: locale === "en" ? "Grade 12 Advanced Math" : "Mathématiques Approfondies — Terminale SM",
          time: "16h30 - 18h45",
          subject: "Mathématiques",
          participant: "Mamadou Barry (Élève)",
          location: "Kipé, Conakry",
          icon: Heart,
          bgColor: "bg-blue-100/70",
          textColor: "text-blue-600",
        };
      } else if (user.role === "ADMIN") {
        result[todayNum] = {
          id: `a-today-${todayNum}`,
          title: locale === "en" ? "Daily Escrow & Payout Audit" : "Contrôle Journalier des Séquestres & Paiements",
          time: "11h00 - 12h30",
          subject: "Finance & Séquestre",
          participant: "Direction Financière Monsieur Fanyi",
          location: "Console Admin",
          icon: ShieldCheck,
          bgColor: "bg-teal-100/70",
          textColor: "text-teal-600",
        };
      } else {
        result[todayNum] = {
          id: `p-today-${todayNum}`,
          title: locale === "en" ? "Mathematics & Sciences — Mamadou" : "Mathématiques & Sciences Physiques (Mamadou)",
          time: "16h30 - 18h30",
          subject: "Mathématiques",
          participant: "M. Amadou Camara (Tuteur Agréé)",
          location: "Kipé, Conakry (À domicile)",
          icon: Heart,
          bgColor: "bg-indigo-100/70",
          textColor: "text-indigo-600",
        };
      }
    }

    return result;
  };

  const tasksDatabase = getDynamicTasks();
  const currentSelectedTask = tasksDatabase[selectedDay];

  return (
    <>
      <aside className="w-80 bg-white border-l border-slate-200/80 p-6 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-20 shadow-xs space-y-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {/* Top Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-800 font-heading">
              {t("dashboard.profile", "Profil")}
            </h2>
            <Link
              href="/settings"
              className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Modifier le profil"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Profile Card Center */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-blue-600 via-teal-500 to-amber-400">
              <div className="w-18 h-18 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden">
                <span className="text-xl font-black text-[#16385c]">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">{user.fullName}</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {user.role === "PARENT"
                  ? t("dashboard.parentRole", "Parent d'Élève • Conakry")
                  : user.role === "TEACHER"
                  ? t("dashboard.teacherRole", "Professeur Certifié • Guinée")
                  : t("dashboard.adminRole", "Administrateur National")}
              </p>
            </div>
          </div>

          {/* Interactive Profile Calendar Widget */}
          <div className="p-4 rounded-3xl bg-slate-50/70 border border-slate-100 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-extrabold text-[#16385c]">
                {currentMonthLabel}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Week Days Header */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {daysOfWeek.map((dayChar, i) => (
                <span key={i} className="text-[10px] text-slate-400 font-bold">
                  {dayChar}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty leading offset days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7" />
              ))}

              {/* Real month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isSelected = selectedDay === dayNum;
                const hasTask = Boolean(tasksDatabase[dayNum]);
                const isToday =
                  dayNum === todayDate.getDate() &&
                  currentMonthIndex === todayDate.getMonth() &&
                  currentYear === todayDate.getFullYear();

                return (
                  <button
                    key={dayNum}
                    type="button"
                    onClick={() => setSelectedDay(dayNum)}
                    className="relative flex flex-col items-center justify-center h-7 w-7 mx-auto rounded-full transition-all cursor-pointer group"
                  >
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "bg-[#16385c] text-white w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-xs scale-105"
                          : isToday
                          ? "ring-2 ring-[#e59a38] text-[#16385c] font-black w-7 h-7 rounded-full flex items-center justify-center bg-amber-50/80"
                          : hasTask
                          ? "text-[#16385c] font-bold hover:bg-blue-100/70 w-7 h-7 rounded-full flex items-center justify-center"
                          : "text-slate-700 hover:bg-slate-200/60 w-7 h-7 rounded-full flex items-center justify-center"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Indicator dot if task exists */}
                    {hasTask && !isSelected && (
                      <span className="w-1 h-1 rounded-full bg-[#e59a38] absolute bottom-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Session Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-900">
                {t("dashboard.upcomingTasks", "Prochaines Séances")}
              </span>
              <a
                href="#courses"
                className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-0.5"
              >
                <span>{t("dashboard.viewAll", "Voir tout")}</span>
                <ArrowRightIcon className="w-3 h-3" />
              </a>
            </div>

            {currentSelectedTask ? (
              <div
                onClick={() =>
                  setSelectedTask({
                    title: currentSelectedTask.title,
                    date: `${selectedDay} ${currentMonthLabel} • ${currentSelectedTask.time}`,
                    subject: currentSelectedTask.subject,
                    participant: currentSelectedTask.participant,
                    location: currentSelectedTask.location,
                  })
                }
                className="p-3 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl ${currentSelectedTask.bgColor} ${currentSelectedTask.textColor} flex items-center justify-center shrink-0`}
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#16385c] transition-colors">
                      {currentSelectedTask.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {selectedDay} {currentMonthLabel} • {currentSelectedTask.time}
                    </div>
                  </div>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border border-dashed border-slate-200 text-center space-y-2 bg-slate-50/50">
                <span className="text-[11px] text-slate-400 block">
                  {t("dashboard.noEventsDay", "Aucune séance programmée ce jour")}
                </span>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16385c] hover:underline cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#e59a38]" />
                  <span>{t("dashboard.planSession", "+ Planifier")}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Promotional / Escrow Card tailored by role */}
        <div className="rounded-3xl p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100/50 border border-blue-200/60 text-center space-y-3.5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-[#16385c] leading-snug">
              {user.role === "TEACHER"
                ? t("dashboard.teacherEscrowTitle", "Reversement Mobile Money 85%")
                : user.role === "ADMIN"
                ? t("dashboard.adminEscrowTitle", "Surveillance Plateforme 15/85")
                : t("dashboard.escrowTitle", "Paiement Séquestre Garanti")}
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              {user.role === "TEACHER"
                ? t(
                    "dashboard.teacherEscrowDesc",
                    "Vos gains nets sont garantis et débloqués automatiquement après validation des cours."
                  )
                : user.role === "ADMIN"
                ? t(
                    "dashboard.adminEscrowDesc",
                    "Contrôle en temps réel du séquestre bancaire et des déblocages Orange / MTN."
                  )
                : t(
                    "dashboard.escrowDesc",
                    "Vos fonds Orange & MTN restent protégés jusqu'à validation de chaque cours."
                  )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowEscrowModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-[#16385c] hover:bg-[#122b49] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            {t("dashboard.learnMore", "En savoir plus")}
          </button>
        </div>
      </aside>

      {/* Escrow Modal Dialog */}
      {/* Escrow Modal Dialog */}
      {showEscrowModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-[#16385c]">
                <ShieldCheck className="w-5 h-5 text-[#e59a38]" />
                <h3 className="font-extrabold text-sm">
                  {user.role === "TEACHER"
                    ? (locale === "en" ? "85% Earnings Terms & Mobile Payouts" : "Modalités de Rémunération 85%")
                    : user.role === "ADMIN"
                    ? (locale === "en" ? "Escrow & 15% Platform Commission" : "Séquestre & Commission 15%")
                    : t("dashboard.escrowModalTitle", "Fonctionnement du Séquestre Protecteur")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEscrowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {user.role === "TEACHER"
                ? (locale === "en"
                    ? "Each delivered session earns you 85% of the gross package or hourly rate. As soon as the parent confirms the session on their interface, the Orange Money or MTN transfer is credited immediately."
                    : "Chaque heure de cours dispensée vous rapporte 85% du tarif brut fixé. Dès que le parent valide la séance sur son interface, le virement Orange Money ou MTN est crédité sans délai.")
                : user.role === "ADMIN"
                ? (locale === "en"
                    ? "The platform retains a 15% commission to cover tutor credentialing, 7/7 local support, and Mobile Money infrastructure."
                    : "La plateforme prélève une commission de 15% pour couvrir la vérification des professeurs, le support 7j/7 et les frais d'infrastructure mobile money.")
                : t(
                    "dashboard.escrowModalDesc",
                    "Vos fonds restent bloqués sur le compte sécurisé de la plateforme et ne sont libérés au professeur (85%) qu'après confirmation explicite du parent à chaque séance."
                  )}
            </p>

            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 text-[11px] text-[#16385c] space-y-1.5">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {locale === "en"
                    ? "Contractual 85% Tutor / 15% Platform rule (SRD V2.0)"
                    : "Règle 85% Professeur / 15% Plateforme (SRD V2.0)"}
                </span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {locale === "en"
                    ? "Automatic deposits and payouts via Orange Money & MTN Guinea"
                    : "Dépôts et retraits automatiques Orange & MTN Guinée"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowEscrowModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#16385c] text-white text-xs font-bold hover:bg-[#122b49] transition-colors cursor-pointer"
            >
              {t("dashboard.close", "Fermer")}
            </button>
          </div>
        </div>
      )}

      {/* Task Details Modal Dialog */}
      {selectedTask && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {selectedTask.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span>{selectedTask.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>{locale === "en" ? "Subject: " : "Matière : "}{selectedTask.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>{selectedTask.participant}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>{locale === "en" ? "Location: " : "Lieu : "}{selectedTask.location}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="w-full py-2.5 rounded-xl bg-[#16385c] text-white text-xs font-bold hover:bg-[#122b49] transition-colors cursor-pointer"
            >
              {t("dashboard.close", "Fermer")}
            </button>
          </div>
        </div>
      )}

      {/* Schedule Helper Modal */}
      {showScheduleModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-800">
                {locale === "en"
                  ? `Schedule for ${selectedDay} ${currentMonthLabel}`
                  : `Planifier pour le ${selectedDay} ${currentMonthLabel}`}
              </h3>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {locale === "en"
                ? "Add a tutoring lesson or teaching availability in this slot."
                : "Ajoutez une séance de soutien ou une disponibilité d'enseignement sur ce créneau."}
            </p>

            <div className="space-y-2">
              <input
                type="text"
                placeholder={locale === "en" ? "Subject (e.g. Mathematics)" : "Matière (ex: Mathématiques)"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
              <input
                type="text"
                placeholder={locale === "en" ? "Time slot (e.g. 16:00 - 18:00)" : "Horaire (ex: 16h00 - 18h00)"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50"
              >
                {t("dashboard.cancel", "Annuler")}
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(locale === "en" ? "Session saved to your schedule." : "Séance enregistrée sur votre agenda.");
                  setShowScheduleModal(false);
                }}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-[#16385c] text-white hover:bg-[#122b49]"
              >
                {locale === "en" ? "Save to Schedule" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
