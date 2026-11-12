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
  Award,
  Wallet,
  Clock,
  Sparkles,
  AlertTriangle,
  Send,
  FileText,
  Gavel,
  Bell,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AuthenticatedUser } from "@/lib/auth/session";

interface LightSidebarProps {
  user: AuthenticatedUser;
}

export function LightSidebar({ user }: LightSidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/notifications/unread-count");
        if (res.ok) {
          const data = await res.json();
          const count =
            typeof data.count === "number"
              ? data.count
              : typeof data.unreadCount === "number"
              ? data.unreadCount
              : 0;
          if (isMounted) setUnreadCount(count);
        }
      } catch {
        // Ignore background polling failure
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  // Nav items strictly tailored to role with vibrant colored icons and light active states
  const getNavItems = () => {
    if (user.role === "TEACHER") {
      return [
        {
          label: t("dashboard.nav.dashboard", "Tableau de bord"),
          href: "/teacher/dashboard",
          icon: LayoutDashboard,
          iconColor: "text-blue-600",
          iconBg: "bg-blue-50",
          activeBg: "bg-blue-50/80",
          activeBorder: "border-blue-200",
          activeText: "text-blue-900",
        },
        {
          label: t("dashboard.nav.teacherVerification", "Dossier & Diplômes"),
          href: "/teacher/onboarding",
          icon: FileCheck,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50",
          activeBg: "bg-emerald-50/80",
          activeBorder: "border-emerald-200",
          activeText: "text-emerald-900",
        },
        {
          label: t("dashboard.nav.teacherSubjects", "Matières & Tarifs"),
          href: "/teacher/pricing",
          icon: BookOpen,
          iconColor: "text-purple-600",
          iconBg: "bg-purple-50",
          activeBg: "bg-purple-50/80",
          activeBorder: "border-purple-200",
          activeText: "text-purple-900",
        },
        {
          label: t("dashboard.nav.teacherAvailability", "Disponibilités"),
          href: "/teacher/availability",
          icon: Clock,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
          activeBg: "bg-amber-50/80",
          activeBorder: "border-amber-200",
          activeText: "text-amber-900",
        },
        {
          label: t("dashboard.nav.teacherOpportunities", "Opportunités"),
          href: "/teacher/opportunities",
          icon: Sparkles,
          iconColor: "text-rose-500",
          iconBg: "bg-rose-50",
          activeBg: "bg-rose-50/80",
          activeBorder: "border-rose-200",
          activeText: "text-rose-900",
        },
        {
          label: t("dashboard.nav.teacherApplications", "Mes Candidatures"),
          href: "/teacher/applications",
          icon: Send,
          iconColor: "text-blue-600",
          iconBg: "bg-blue-50",
          activeBg: "bg-blue-50/80",
          activeBorder: "border-blue-200",
          activeText: "text-blue-900",
        },
        {
          label: t("dashboard.nav.teacherClasses", "Mes Classes"),
          href: "/teacher/classes",
          icon: Users,
          iconColor: "text-indigo-600",
          iconBg: "bg-indigo-50",
          activeBg: "bg-indigo-50/80",
          activeBorder: "border-indigo-200",
          activeText: "text-indigo-900",
        },
        {
          label: t("dashboard.nav.calendar", "Emploi du temps"),
          href: "/teacher/calendar",
          icon: Calendar,
          iconColor: "text-sky-600",
          iconBg: "bg-sky-50",
          activeBg: "bg-sky-50/80",
          activeBorder: "border-sky-200",
          activeText: "text-sky-900",
        },
        {
          label: t("dashboard.nav.teacherReports", "Comptes Rendus"),
          href: "/teacher/reports",
          icon: FileText,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50",
          activeBg: "bg-emerald-50/80",
          activeBorder: "border-emerald-200",
          activeText: "text-emerald-900",
        },
        {
          label: t("dashboard.nav.teacherProgress", "Carnet de Progression"),
          href: "/teacher/progress",
          icon: BarChart3,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
          activeBg: "bg-amber-50/80",
          activeBorder: "border-amber-200",
          activeText: "text-amber-900",
        },
        {
          label: t("dashboard.nav.teacherEarnings", "Gains (Part 85%)"),
          href: "/teacher/dashboard#earnings",
          icon: Wallet,
          iconColor: "text-teal-600",
          iconBg: "bg-teal-50",
          activeBg: "bg-teal-50/80",
          activeBorder: "border-teal-200",
          activeText: "text-teal-900",
        },
        {
          label: t("dashboard.nav.notifications", "Notifications"),
          href: "/notifications",
          icon: Bell,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
          activeBg: "bg-amber-50/80",
          activeBorder: "border-amber-200",
          activeText: "text-amber-900",
        },
      ];
    }

    if (user.role === "ADMIN") {
      return [
        {
          label: t("dashboard.nav.dashboard", "Console Admin"),
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          iconColor: "text-blue-600",
          iconBg: "bg-blue-50",
          activeBg: "bg-blue-50/80",
          activeBorder: "border-blue-200",
          activeText: "text-blue-900",
        },
        {
          label: t("dashboard.nav.adminVerification", "Vérification Enseignants"),
          href: "/admin/verifications",
          icon: FileCheck,
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-50",
          activeBg: "bg-emerald-50/80",
          activeBorder: "border-emerald-200",
          activeText: "text-emerald-900",
        },
        {
          label: t("dashboard.nav.adminUsers", "Gestion Utilisateurs"),
          href: "/admin/users",
          icon: Users,
          iconColor: "text-purple-600",
          iconBg: "bg-purple-50",
          activeBg: "bg-purple-50/80",
          activeBorder: "border-purple-200",
          activeText: "text-purple-900",
        },
        {
          label: t("dashboard.nav.adminRequests", "Demandes de soutien"),
          href: "/admin/requests",
          icon: BookOpen,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
          activeBg: "bg-amber-50/80",
          activeBorder: "border-amber-200",
          activeText: "text-amber-900",
        },
        {
          label: t("dashboard.nav.adminAssignments", "Attributions & Classes"),
          href: "/admin/assignments",
          icon: Award,
          iconColor: "text-indigo-600",
          iconBg: "bg-indigo-50",
          activeBg: "bg-indigo-50/80",
          activeBorder: "border-indigo-200",
          activeText: "text-indigo-900",
        },
        {
          label: t("dashboard.nav.calendar", "Calendrier Général"),
          href: "/admin/calendar",
          icon: Calendar,
          iconColor: "text-sky-600",
          iconBg: "bg-sky-50",
          activeBg: "bg-sky-50/80",
          activeBorder: "border-sky-200",
          activeText: "text-sky-900",
        },
        {
          label: t("dashboard.nav.adminAcademicProgress", "Suivi Académique"),
          href: "/admin/academic-progress",
          icon: BarChart3,
          iconColor: "text-purple-600",
          iconBg: "bg-purple-50",
          activeBg: "bg-purple-50/80",
          activeBorder: "border-purple-200",
          activeText: "text-purple-900",
        },
        {
          label: t("dashboard.nav.adminFinances", "Séquestre & 15% Comm."),
          href: "/admin/dashboard#finances",
          icon: ShieldCheck,
          iconColor: "text-teal-600",
          iconBg: "bg-teal-50",
          activeBg: "bg-teal-50/80",
          activeBorder: "border-teal-200",
          activeText: "text-teal-900",
        },
        {
          label: t("dashboard.nav.adminDisputes", "Litiges de Séances"),
          href: "/admin/session-disputes",
          icon: Gavel,
          iconColor: "text-rose-600",
          iconBg: "bg-rose-50",
          activeBg: "bg-rose-50/80",
          activeBorder: "border-rose-200",
          activeText: "text-rose-900",
        },
        {
          label: t("dashboard.nav.adminNotifications", "Centre Notifications & Outbox"),
          href: "/admin/notification-center",
          icon: Bell,
          iconColor: "text-amber-600",
          iconBg: "bg-amber-50",
          activeBg: "bg-amber-50/80",
          activeBorder: "border-amber-200",
          activeText: "text-amber-900",
        },
      ];
    }

    // Default Parent
    return [
      {
        label: t("dashboard.nav.dashboard", "Tableau de bord"),
        href: "/parent/dashboard",
        icon: LayoutDashboard,
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
        activeBg: "bg-blue-50/80",
        activeBorder: "border-blue-200",
        activeText: "text-blue-900",
      },
      {
        label: t("dashboard.nav.parentChildren", "Mes Enfants"),
        href: "/parent/children",
        icon: Users,
        iconColor: "text-purple-600",
        iconBg: "bg-purple-50",
        activeBg: "bg-purple-50/80",
        activeBorder: "border-purple-200",
        activeText: "text-purple-900",
      },
      {
        label: t("dashboard.nav.parentRequests", "Demandes de cours"),
        href: "/parent/requests",
        icon: BookOpen,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-50",
        activeBg: "bg-amber-50/80",
        activeBorder: "border-amber-200",
        activeText: "text-amber-900",
      },
      {
        label: t("dashboard.nav.parentClasses", "Classes & Tuteurs"),
        href: "/parent/classes",
        icon: GraduationCap,
        iconColor: "text-indigo-600",
        iconBg: "bg-indigo-50",
        activeBg: "bg-indigo-50/80",
        activeBorder: "border-indigo-200",
        activeText: "text-indigo-900",
      },
      {
        label: t("dashboard.nav.calendar", "Calendrier & Séances"),
        href: "/parent/calendar",
        icon: Calendar,
        iconColor: "text-sky-600",
        iconBg: "bg-sky-50",
        activeBg: "bg-sky-50/80",
        activeBorder: "border-sky-200",
        activeText: "text-sky-900",
      },
      {
        label: t("dashboard.nav.parentReports", "Comptes Rendus & Devoirs"),
        href: "/parent/reports",
        icon: FileText,
        iconColor: "text-purple-600",
        iconBg: "bg-purple-50",
        activeBg: "bg-purple-50/80",
        activeBorder: "border-purple-200",
        activeText: "text-purple-900",
      },
      {
        label: t("dashboard.nav.parentPayments", "Paiements & Séquestre"),
        href: "/parent/dashboard#payments",
        icon: ShieldCheck,
        iconColor: "text-teal-600",
        iconBg: "bg-teal-50",
        activeBg: "bg-teal-50/80",
        activeBorder: "border-teal-200",
        activeText: "text-teal-900",
      },
      {
        label: t("dashboard.nav.parentProgress", "Carnet de Progression"),
        href: "/parent/progress",
        icon: BarChart3,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-50",
        activeBg: "bg-emerald-50/80",
        activeBorder: "border-emerald-200",
        activeText: "text-emerald-900",
      },
      {
        label: t("dashboard.nav.notifications", "Notifications"),
        href: "/notifications",
        icon: Bell,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-50",
        activeBg: "bg-amber-50/80",
        activeBorder: "border-amber-200",
        activeText: "text-amber-900",
      },
    ];
  };

  const [currentHash, setCurrentHash] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const onHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener("hashchange", onHashChange);
      return () => window.removeEventListener("hashchange", onHashChange);
    }
  }, []);

  const navItems = getNavItems();

  const isItemActive = (itemHref: string) => {
    const [itemPath, itemHash] = itemHref.split("#");

    if (itemHash) {
      return pathname === itemPath && currentHash === `#${itemHash}`;
    }

    // Exact dashboard matches (so dashboard doesn't stay active on sub-routes)
    if (
      itemHref === "/parent/dashboard" ||
      itemHref === "/teacher/dashboard" ||
      itemHref === "/admin/dashboard"
    ) {
      return pathname === itemHref && !currentHash;
    }

    // Progress book routes: match both the index page and student-specific progress books
    if (itemHref === "/parent/progress") {
      return (
        pathname === "/parent/progress" ||
        pathname.startsWith("/parent/progress/") ||
        (pathname.startsWith("/parent/students/") && pathname.includes("/progress"))
      );
    }

    if (itemHref === "/teacher/progress") {
      return (
        pathname === "/teacher/progress" ||
        pathname.startsWith("/teacher/progress/") ||
        (pathname.startsWith("/teacher/students/") && pathname.includes("/progress"))
      );
    }

    if (itemHref === "/admin/academic-progress") {
      return (
        pathname === "/admin/academic-progress" ||
        pathname.startsWith("/admin/academic-progress/") ||
        (pathname.startsWith("/admin/students/") && pathname.includes("/progress"))
      );
    }

    // Children dossiers (when not on progress book)
    if (itemHref === "/parent/children") {
      return (
        pathname === "/parent/children" ||
        pathname.startsWith("/parent/children/") ||
        (pathname.startsWith("/parent/students/") && !pathname.includes("/progress"))
      );
    }

    // General prefix match
    return pathname === itemHref || pathname.startsWith(itemHref + "/");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-6 shrink-0 h-screen sticky top-0 overflow-y-auto z-30 shadow-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Top Application Logo */}
      <div className="space-y-7">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#16385c] flex items-center justify-center text-white shadow-md shadow-blue-900/15 group-hover:bg-[#e59a38] transition-colors">
            <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-[#16385c] tracking-tight flex items-center font-heading">
              Monsieur<span className="text-[#e59a38] ml-1">Fanyi</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              Guinée • Éducation
            </div>
          </div>
        </Link>

        {/* Primary Nav Menu with Color Icons and Light Active State */}
        <nav className="space-y-1.5" aria-label="Navigation secondaire">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer border ${
                  isActive
                    ? `${item.activeBg} ${item.activeBorder} ${item.activeText} font-bold shadow-xs`
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {/* Colorful Icon Container */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                    isActive ? "bg-white shadow-xs scale-105" : item.iconBg
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.iconColor}`} />
                </div>
                <span className="truncate">{item.label}</span>
                {item.href.includes("notification") && unreadCount > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-black rounded-full bg-[#e59a38] text-white shadow-xs">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Menu with Color Icons and Light State */}
      <div className="space-y-1 pt-5 border-t border-slate-100">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer border ${
            pathname.startsWith("/settings")
              ? "bg-slate-100 border-slate-200 text-slate-900 font-bold shadow-xs"
              : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Settings className="w-3.5 h-3.5 text-slate-600" />
          </div>
          <span>{t("dashboard.nav.settings", "Paramètres")}</span>
        </Link>

        <a
          href="mailto:contact@monsieurfanyi.com"
          className="flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold border border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
        >
          <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span>{t("dashboard.nav.support", "Support & Aide")}</span>
        </a>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold border border-transparent text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
        >
          <div className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
          <span>{t("dashboard.nav.logout", "Déconnexion")}</span>
        </button>
      </div>
    </aside>
  );
}
