"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import {
  GraduationCap,
  LogOut,
  Settings,
  User,
  ShieldAlert,
  ShieldCheck,
  Menu,
  X,
  Loader2,
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/session";

interface DashboardHeaderProps {
  user: AuthenticatedUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  const roleBadgeConfig = {
    PARENT: { label: "Parent d'Élève", bg: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
    TEACHER: { label: "Professeur", bg: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
    ADMIN: { label: "Administrateur", bg: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
    STUDENT: { label: "Élève", bg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  };

  const badge = roleBadgeConfig[user.role] || roleBadgeConfig.PARENT;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#122b49]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3 text-white">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5 text-[#e59a38]" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-base font-heading text-white">
                Monsieur <span className="text-[#e59a38]">Fanyi</span>
              </span>
              <span className="hidden sm:block text-[9px] text-slate-300 uppercase tracking-wider font-semibold">
                Guinée • Espace Numérique
              </span>
            </div>
          </Link>

          {/* Rôle Badge */}
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} tracking-wide ml-2`}
          >
            {badge.label}
          </span>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <div className="hidden md:flex items-center gap-2 text-right">
            <div>
              <div className="text-xs font-bold text-white">{user.fullName}</div>
              <div className="text-[10px] text-slate-400">{user.email}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1c436b] border border-white/20 flex items-center justify-center text-xs font-bold text-amber-300">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>

          <Link
            href="/settings"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            title="Paramètres du compte"
            aria-label="Paramètres du compte"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Déconnexion"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
