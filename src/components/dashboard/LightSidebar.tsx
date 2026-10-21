"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Video,
  BarChart3,
  Settings,
  Headphones,
  LogOut,
  Loader2,
  Users,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import { AuthenticatedUser } from "@/lib/auth/session";

interface LightSidebarProps {
  user: AuthenticatedUser;
}

export function LightSidebar({ user }: LightSidebarProps) {
  const pathname = usePathname();
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

  // Nav items tailored to role
  const getNavItems = () => {
    if (user.role === "TEACHER") {
      return [
        { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
        { label: "Planning", href: "#planning", icon: Calendar },
        { label: "Mes Classes", href: "#classes", icon: BookOpen },
        { label: "Cours Vidéo", href: "#videos", icon: Video },
        { label: "Gains & Séances", href: "#earnings", icon: BarChart3 },
      ];
    }

    if (user.role === "ADMIN") {
      return [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { label: "Validations", href: "#validations", icon: FileCheck },
        { label: "Utilisateurs", href: "#users", icon: Users },
        { label: "Séquestre", href: "#escrow", icon: ShieldCheck },
        { label: "Analyses", href: "#analytics", icon: BarChart3 },
      ];
    }

    // Default Parent
    return [
      { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
      { label: "Planning", href: "#planning", icon: Calendar },
      { label: "Mes Cours", href: "#courses", icon: BookOpen },
      { label: "Visioconférences", href: "#videos", icon: Video },
      { label: "Suivi & Notes", href: "#analytics", icon: BarChart3 },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0 overflow-y-auto z-30 shadow-xs">
      {/* Top Logo */}
      <div className="space-y-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#16385c] to-[#1e4b7a] flex items-center justify-center text-white shadow-md shadow-blue-900/15 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6 text-[#e59a38]" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-[#16385c] tracking-tight flex items-center gap-1 font-heading">
              <span>Ed.Tech</span>
              <span className="text-[10px] text-[#e59a38] font-bold px-1.5 py-0.2 rounded-md bg-amber-50 border border-amber-200">
                Fanyi
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Guinée Éducation</div>
          </div>
        </Link>

        {/* Primary Nav Menu */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href.startsWith("/") && pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#16385c] text-white shadow-md shadow-blue-900/20"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-[#e59a38]" : "text-slate-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Menu */}
      <div className="space-y-1 pt-6 border-t border-slate-100">
        <Link
          href="/settings"
          className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
            pathname.startsWith("/settings")
              ? "bg-[#16385c] text-white shadow-md"
              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Paramètres</span>
        </Link>

        <a
          href="https://wa.me/224620000000"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <Headphones className="w-4 h-4 text-slate-400" />
          <span>Support & Aide</span>
        </a>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
          ) : (
            <LogOut className="w-4 h-4 text-rose-500" />
          )}
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
