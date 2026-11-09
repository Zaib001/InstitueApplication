"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Clock,
  AlertCircle,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Calendar,
  ShieldAlert,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedUser } from "@/lib/auth/session";

interface NotificationItem {
  id: string;
  eventType: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  linkUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationCenterClientProps {
  user: AuthenticatedUser;
}

export function NotificationCenterClient({ user }: NotificationCenterClientProps) {
  const router = useRouter();
  const { locale } = useTranslation();

  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD" | "READ">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Fetch notifications
  const loadNotifications = useCallback(
    async (currentPage = 1, showRefreshSpinner = false) => {
      if (showRefreshSpinner) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const params = new URLSearchParams();
        params.set("page", currentPage.toString());
        params.set("limit", "15");

        if (activeTab === "UNREAD") params.set("isRead", "false");
        if (activeTab === "READ") params.set("isRead", "true");
        if (priorityFilter !== "ALL") params.set("priority", priorityFilter);

        const res = await fetch(`/api/notifications?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.notifications)
            ? data.notifications
            : Array.isArray(data.items)
            ? data.items
            : [];
          setNotifications(list);
          setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
          setTotalCount(data.pagination?.totalCount || data.totalCount || 0);
        }

        // Also refresh unread counter
        const countRes = await fetch("/api/notifications/unread-count");
        if (countRes.ok) {
          const countData = await countRes.json();
          const count =
            typeof countData.count === "number"
              ? countData.count
              : typeof countData.unreadCount === "number"
              ? countData.unreadCount
              : 0;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeTab, priorityFilter]
  );

  useEffect(() => {
    setPage(1);
    loadNotifications(1);
  }, [loadNotifications]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadNotifications(newPage);
  };

  const handleMarkAsRead = async (id: string, linkUrl: string | null) => {
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });

      if (linkUrl) {
        router.push(linkUrl);
      }
    } catch {
      loadNotifications(page);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (locale === "en") {
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin} min ago`;
      if (diffHours < 24) return `${diffHours} h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays} days ago`;
    }

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} jours`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              {user.role === "PARENT"
                ? locale === "en"
                  ? "Parent Space"
                  : "Espace Famille"
                : user.role === "TEACHER"
                ? locale === "en"
                  ? "Teacher Space"
                  : "Espace Enseignant"
                : locale === "en"
                ? "Administration"
                : "Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Notifications" : "Notifications"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
              {locale === "en" ? "Notification Center" : "Centre de Notifications"}
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1c436b]">
                {unreadCount} {locale === "en" ? "unread" : "non lues"}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "en"
              ? "Follow real-time platform updates, lesson schedules, progress digest & administrative alerts."
              : "Suivez en direct l'activité de vos cours, les plannings pédagogiques, le carnet de progression et les alertes administratives."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadNotifications(page, true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title={locale === "en" ? "Refresh" : "Actualiser"}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={isRefreshing}
              className="px-3 py-2 text-xs font-bold text-white bg-[#1c436b] hover:bg-[#122b49] rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{locale === "en" ? "Mark all as read" : "Tout marquer comme lu"}</span>
            </button>
          )}

          <Link
            href="/settings"
            className="px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>{locale === "en" ? "Preferences" : "Préférences"}</span>
          </Link>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Filter and Tab Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {locale === "en" ? "All" : "Toutes"}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("UNREAD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === "UNREAD"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>{locale === "en" ? "Unread" : "Non lues"}</span>
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("READ")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "READ"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {locale === "en" ? "Read" : "Lues"}
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {locale === "en" ? "Priority:" : "Priorité :"}
          </span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#16385c]"
          >
            <option value="ALL">{locale === "en" ? "All Priorities" : "Tous niveaux"}</option>
            <option value="URGENT">{locale === "en" ? "Urgent Only" : "Urgent uniquement"}</option>
            <option value="HIGH">{locale === "en" ? "High Only" : "Important uniquement"}</option>
            <option value="NORMAL">{locale === "en" ? "Normal" : "Normal"}</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1c436b]" />
            <p className="text-xs font-medium text-slate-600">
              {locale === "en"
                ? "Loading your notifications..."
                : "Chargement de vos notifications..."}
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm text-slate-700">
              {locale === "en" ? "No notifications found" : "Aucune notification à afficher"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {activeTab === "UNREAD"
                ? locale === "en"
                  ? "You have marked all your notifications as read."
                  : "Vous avez lu toutes vos alertes. Rien en attente !"
                : locale === "en"
                ? "Platform activity, session validations, and academic updates will appear here."
                : "Vos confirmations de cours, rapports de séance et alertes apparaîtront ici."}
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const isUrgent = notif.priority === "URGENT";
            const isHigh = notif.priority === "HIGH";

            return (
              <div
                key={notif.id}
                onClick={() => handleMarkAsRead(notif.id, notif.linkUrl)}
                className={`p-4 sm:p-5 transition-colors cursor-pointer flex items-start gap-4 ${
                  notif.isRead
                    ? "bg-white hover:bg-slate-50/70"
                    : "bg-blue-50/30 hover:bg-blue-50/60"
                }`}
              >
                {/* Indicator icon / status */}
                <div className="mt-1 flex-shrink-0">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                      isUrgent
                        ? "bg-rose-100 text-rose-600 border border-rose-200"
                        : isHigh
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : notif.isRead
                        ? "bg-slate-100 text-slate-400 border border-slate-200"
                        : "bg-blue-100 text-[#1c436b] border border-blue-200"
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-sm ${
                          notif.isRead ? "font-semibold text-slate-800" : "font-bold text-slate-900"
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#1c436b] inline-block" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isUrgent && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          {locale === "en" ? "URGENT" : "URGENT"}
                        </span>
                      )}
                      {isHigh && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          {locale === "en" ? "IMPORTANT" : "IMPORTANT"}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pr-2">
                    {notif.message}
                  </p>

                  <div className="flex flex-wrap items-center justify-between pt-2 text-xs">
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(notif.createdAt)}
                    </span>

                    {notif.linkUrl && (
                      <span className="text-xs font-bold text-[#1c436b] hover:text-[#0f243a] inline-flex items-center gap-1 group">
                        <span>{locale === "en" ? "View Details" : "Accéder à l'élément"}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            {locale === "en" ? "Total items:" : "Total des notifications :"} {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs font-semibold"
            >
              {locale === "en" ? "Previous" : "Précédent"}
            </button>
            <span className="px-3 py-1 font-bold text-slate-800">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs font-semibold"
            >
              {locale === "en" ? "Next" : "Suivant"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
