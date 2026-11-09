"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  ShieldAlert,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface NotificationItem {
  id: string;
  eventType: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  variant?: "dark" | "light";
}

export function NotificationBell({ variant = "light" }: NotificationBellProps) {
  const router = useRouter();
  const { locale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
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
        setUnreadCount(count);
      }
    } catch {
      // Ignore background fetch failures
    }
  }, []);

  // Fetch recent notifications
  const fetchRecentNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=8");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.notifications)
          ? data.notifications
          : Array.isArray(data.items)
          ? data.items
          : [];
        setNotifications(list);
      }
    } catch {
      // Ignore fetch failures
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll unread count with visibility awareness (every 30s)
  useEffect(() => {
    fetchUnreadCount();

    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  // Handle dropdown open
  const toggleDropdown = () => {
    if (!isOpen) {
      fetchRecentNotifications();
      fetchUnreadCount();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mark single notification as read
  const handleMarkAsRead = async (id: string, linkUrl: string | null) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (linkUrl) {
        setIsOpen(false);
        router.push(linkUrl);
      }
    } catch {
      fetchUnreadCount();
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    setIsMarkingAll(true);
    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // Ignore
    } finally {
      setIsMarkingAll(false);
    }
  };

  // Format relative time in French / English
  const formatTimeAgo = (dateStr: string) => {
    const now = Date.now();
    const past = new Date(dateStr).getTime();
    const diffMs = now - past;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (locale === "en") {
      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      return `${diffDays}d ago`;
    }

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return "Hier";
    return `Il y a ${diffDays} j`;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "URGENT") {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
          {locale === "en" ? "Urgent" : "Urgent"}
        </span>
      );
    }
    if (priority === "HIGH") {
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
          {locale === "en" ? "Important" : "Important"}
        </span>
      );
    }
    return null;
  };

  const buttonStyle =
    variant === "dark"
      ? "w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
      : "w-9 h-9 rounded-full bg-white border border-slate-200/90 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className={`flex items-center justify-center relative ${buttonStyle}`}
        aria-label={locale === "en" ? "Notifications" : "Centre de notifications"}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-75 duration-150"
            aria-live="polite"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-0 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 font-heading">
                {locale === "en" ? "Notifications" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  {unreadCount} {locale === "en" ? "new" : "non lues"}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-[#1c436b] hover:text-[#0f243a] flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>{locale === "en" ? "Mark all read" : "Tout marquer lu"}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {isLoading && notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <span className="text-xs">
                  {locale === "en" ? "Loading notifications..." : "Chargement des notifications..."}
                </span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600">
                  {locale === "en" ? "You're all caught up!" : "Aucune notification pour le moment."}
                </p>
                <p className="text-[11px] text-slate-400">
                  {locale === "en"
                    ? "Important reminders and updates will appear here."
                    : "Vos alertes pédagogiques et rappels s'afficheront ici."}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleMarkAsRead(notif.id, notif.linkUrl)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    notif.isRead
                      ? "bg-white hover:bg-slate-50/80"
                      : "bg-blue-50/40 hover:bg-blue-50/70"
                  }`}
                >
                  {/* Status dot or icon */}
                  <div className="mt-1 flex-shrink-0">
                    <span
                      className={`block w-2 h-2 rounded-full ${
                        notif.isRead ? "bg-transparent" : "bg-[#1c436b]"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          notif.isRead ? "font-semibold text-slate-700" : "font-bold text-slate-900"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {getPriorityBadge(notif.priority)}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                      {notif.linkUrl && (
                        <span className="text-[#1c436b] font-medium flex items-center gap-0.5 hover:underline">
                          <span>{locale === "en" ? "Open" : "Consulter"}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-[#1c436b] hover:text-[#0f243a] inline-flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-200/50 transition-colors"
            >
              <span>{locale === "en" ? "View all notifications" : "Voir tout le centre d'alertes"}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
