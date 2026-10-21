"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Bell,
  RotateCcw,
  CheckCircle2,
  Award,
  ChevronDown,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Play,
  Clock,
  TrendingUp,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedUser } from "@/lib/auth/session";

interface LightDashboardViewProps {
  user: AuthenticatedUser;
  stats?: {
    inProgress: number;
    completed: number;
    achievements: number;
    hoursSpentTotal: string;
    performancePercent: number;
  };
  customCourses?: Array<{
    id: string;
    title: string;
    lessonsCount: number;
    progressPercent: number;
  }>;
}

export function LightDashboardView({
  user,
  stats = {
    inProgress: 4,
    completed: 18,
    achievements: 12,
    hoursSpentTotal: "126h 48m",
    performancePercent: 72,
  },
  customCourses,
}: LightDashboardViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState("7 derniers jours");

  const courses = customCourses || [
    {
      id: "1",
      title: "Mathématiques & Algèbre Approfondie",
      lessonsCount: 10,
      progressPercent: 50,
    },
    {
      id: "2",
      title: "Physique-Chimie — Ondes & Mécanique",
      lessonsCount: 7,
      progressPercent: 27,
    },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
      {/* 1. Header Bar: Title, Search, Notifications, Language Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Bienvenue sur votre espace d'excellence Monsieur Fanyi
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Pill Input matching the image */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un cours..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full bg-white border border-slate-200/90 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c] focus:border-transparent transition-all shadow-xs"
            />
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            className="w-9 h-9 rounded-full bg-white border border-slate-200/90 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-[#e59a38] absolute top-2 right-2 ring-2 ring-white" />
          </button>

          <LanguageSwitcher />
        </div>
      </div>

      {/* 2. Top 3 Metric Cards matching the reference image */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* In progress card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              En cours (In progress)
            </span>
            <div className="text-lg font-black text-slate-800">
              {stats.inProgress} Séances
            </div>
          </div>
        </div>

        {/* Completes card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Validées (Completes)
            </span>
            <div className="text-lg font-black text-slate-800">
              {stats.completed} Séances
            </div>
          </div>
        </div>

        {/* Achievements card */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Réussite (Achievements)
            </span>
            <div className="text-lg font-black text-slate-800">
              {stats.achievements} Notions
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle 2 Analytics Cards: Wave Line Chart (Hour Spent) & Semi-Circle Gauge (Performance) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Chart: Hour Spent (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Hour Spent</h2>
              <div className="text-xs text-slate-400 font-medium pt-0.5">
                {stats.hoursSpentTotal}
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <span>{timeRange}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Spline Wave Chart SVG with Friday Tooltip Indicator */}
          <div className="relative pt-4 pb-2">
            {/* Tooltip Pill above Friday Peak */}
            <div className="absolute top-2 left-[58%] -translate-x-1/2 bg-[#122b49] text-white px-3 py-1.5 rounded-xl shadow-lg text-[10px] flex items-center gap-2 z-10 pointer-events-none">
              <Clock className="w-3 h-3 text-[#e59a38]" />
              <div>
                <span className="font-semibold block">Vendredi, 24 Mai</span>
                <span className="text-[#e59a38] font-bold">2h 15m</span>
              </div>
            </div>

            {/* SVG Spline */}
            <svg
              className="w-full h-44 overflow-visible"
              viewBox="0 0 600 160"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Vertical soft highlight column under Friday */}
              <rect x="330" y="20" width="40" height="130" rx="12" fill="#eff6ff" />

              {/* Gradient Area Fill */}
              <path
                d="M 10 100 
                   C 60 90, 80 40, 130 50 
                   C 170 58, 200 115, 250 110 
                   C 290 105, 310 25, 350 35 
                   C 390 45, 430 110, 480 95 
                   C 520 85, 550 105, 590 100 
                   L 590 150 L 10 150 Z"
                fill="url(#waveGradient)"
              />

              {/* Main Wave Spline Line */}
              <path
                d="M 10 100 
                   C 60 90, 80 40, 130 50 
                   C 170 58, 200 115, 250 110 
                   C 290 105, 310 25, 350 35 
                   C 390 45, 430 110, 480 95 
                   C 520 85, 550 105, 590 100"
                stroke="#2563eb"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Peak Marker Dot on Friday */}
              <circle cx="350" cy="35" r="5" fill="#2563eb" stroke="#ffffff" strokeWidth="2.5" />
              <circle cx="350" cy="35" r="9" stroke="#2563eb" strokeOpacity="0.3" strokeWidth="2" />
            </svg>

            {/* Day Labels Strip */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-2 pt-1">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mer</span>
              <span>Jeu</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Ven
              </span>
              <span>Sam</span>
              <span>Dim</span>
            </div>
          </div>
        </div>

        {/* Right Chart: Performance (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between items-center text-center space-y-4">
          <div className="w-full text-left">
            <h2 className="text-sm font-bold text-slate-800">Performance</h2>
          </div>

          {/* Semi-circular radial arc gauge */}
          <div className="relative flex flex-col items-center justify-center pt-2">
            <svg className="w-40 h-28 overflow-visible" viewBox="0 0 160 100">
              {/* Background Arc */}
              <path
                d="M 20 90 A 60 60 0 0 1 140 90"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Foreground Arc (72%) */}
              <path
                d="M 20 90 A 60 60 0 0 1 140 90"
                fill="none"
                stroke="#2563eb"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="188.5"
                strokeDashoffset={188.5 * (1 - 0.72)}
              />
            </svg>

            {/* Inner Percentage */}
            <div className="absolute bottom-2 text-center">
              <span className="text-2xl font-black text-slate-800">
                {stats.performancePercent}%
              </span>
              <span className="block text-[10px] text-slate-400 font-medium">
                Complété
              </span>
            </div>
          </div>

          <div className="space-y-3 w-full">
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Votre objectif mensuel est presque atteint !
            </p>
            <button
              type="button"
              className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              Plus de détails
            </button>
          </div>
        </div>

      </div>

      {/* 4. Assignment / Prochaine Séance Banner Card matching the reference image */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-800">Assignments</h2>

        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/30 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Illustrated 3D clipboard / lesson icon */}
            <div className="w-14 h-14 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
              <ClipboardCheck className="w-7 h-7 text-indigo-500" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Mathématiques & Sciences Physiques
              </h3>
              <p className="text-xs text-slate-500">
                Vendredi 24 Mai 2026, 16h30 • Kipé, Conakry
              </p>
            </div>
          </div>

          {/* Duration & Action Buttons matching the reference image */}
          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Duration
              </span>
              <span className="text-xs font-bold text-slate-800">02 h 15 m</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
              >
                Reprogrammer
              </button>
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold shadow-sm shadow-blue-500/25 transition-all cursor-pointer transform hover:-translate-y-0.5"
              >
                Rejoindre le cours
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. My Courses / Mes Cours List matching the reference image */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">My Courses</h2>
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">
              {courses.length}
            </span>
          </div>

          <Link
            href="#courses"
            className="text-xs text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-0.5"
          >
            <span>Voir tout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {courses.map((course) => (
            <div
              key={course.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                  <BookOpen className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{course.title}</h4>
                  <p className="text-[11px] text-slate-400">{course.lessonsCount} séances prévues</p>
                </div>
              </div>

              {/* Progress Bar & Continue Button */}
              <div className="flex items-center gap-4 sm:w-72 justify-between">
                <div className="flex-1 space-y-1">
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563eb] rounded-full transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-700 w-10 text-right">
                  {course.progressPercent}%
                </span>

                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Continuer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
