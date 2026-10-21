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
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/session";

interface LightRightProfileProps {
  user: AuthenticatedUser;
}

export function LightRightProfile({ user }: LightRightProfileProps) {
  const [selectedDay, setSelectedDay] = useState(28);

  const daysOfWeek = [
    { day: "D", date: 24 },
    { day: "L", date: 25 },
    { day: "M", date: 26 },
    { day: "M", date: 27 },
    { day: "J", date: 28 },
    { day: "V", date: 29 },
    { day: "S", date: 30 },
  ];

  const upcomingTasks = [
    {
      id: "1",
      title: "Révision Fonctions & Dérivées",
      date: "24 Mai 2026 • 16h30",
      bgColor: "bg-purple-100/70",
      textColor: "text-purple-600",
      icon: Heart,
    },
    {
      id: "2",
      title: "Chimie Organique — Solutions",
      date: "26 Mai 2026 • 17h00",
      bgColor: "bg-emerald-100/70",
      textColor: "text-emerald-600",
      icon: Droplet,
    },
    {
      id: "3",
      title: "Dissertation Littéraire Française",
      date: "28 Mai 2026 • 15h00",
      bgColor: "bg-amber-100/70",
      textColor: "text-amber-600",
      icon: Scale,
    },
    {
      id: "4",
      title: "Bilan Pédagogique Mensuel",
      date: "30 Mai 2026 • 10h00",
      bgColor: "bg-cyan-100/70",
      textColor: "text-cyan-600",
      icon: Lightbulb,
    },
  ];

  return (
    <aside className="w-80 bg-white border-l border-slate-200/80 p-6 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto z-20 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-800 font-heading">
            Profil
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
          {/* Avatar with concentric gradient ring */}
          <div className="relative p-1 rounded-full bg-gradient-to-tr from-blue-600 via-teal-500 to-amber-400">
            <div className="w-18 h-18 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden">
              <span className="text-xl font-black text-[#16385c]">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm">{user.fullName}</h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {user.role === "PARENT"
                ? "Parent d'Élève • Conakry"
                : user.role === "TEACHER"
                ? "Professeur Certifié • Guinée"
                : "Administrateur National"}
            </p>
          </div>
        </div>

        {/* Mini Calendar Widget */}
        <div className="p-4 rounded-3xl bg-slate-50/70 border border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>Mai 2026</span>
            <button
              type="button"
              className="p-1 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Week Days Strip */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map((item) => {
              const isSelected = selectedDay === item.date;
              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => setSelectedDay(item.date)}
                  className="flex flex-col items-center gap-1.5 py-1.5 transition-all cursor-pointer group"
                >
                  <span className="text-[10px] text-slate-400 font-semibold group-hover:text-slate-600">
                    {item.day}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-[#16385c] text-white shadow-sm shadow-blue-900/30 scale-105"
                        : "text-slate-700 hover:bg-slate-200/60"
                    }`}
                  >
                    {item.date}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Upcoming Tasks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-900">Prochaines Séances</span>
            <Link
              href="#planning"
              className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-0.5"
            >
              <span>Voir tout</span>
              <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {upcomingTasks.map((task) => {
              const Icon = task.icon;
              return (
                <div
                  key={task.id}
                  className="p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl ${task.bgColor} ${task.textColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#16385c] transition-colors">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-slate-400">{task.date}</div>
                    </div>
                  </div>
                  <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Promotional / Escrow Card matching the reference image */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100/50 border border-blue-200/60 text-center space-y-3.5">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-[#16385c] leading-snug">
            Paiement Séquestre Garanti
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Vos fonds Orange & MTN restent protégés jusqu'à validation de chaque cours.
          </p>
        </div>

        <button
          type="button"
          className="w-full py-2.5 px-4 rounded-xl bg-[#16385c] hover:bg-[#122b49] text-white font-bold text-xs shadow-md shadow-blue-900/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          En savoir plus
        </button>
      </div>
    </aside>
  );
}
