"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Filter,
  Loader2,
  ExternalLink,
  UserCheck,
  UserX,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { AuthenticatedUser } from "@/lib/auth/session";

interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  teacherProfile?: {
    id: string;
    city: string;
    verificationStatus: string;
    headline: string | null;
    subjects: Array<{ subject: { name: string } }>;
  } | null;
  parentProfile?: {
    id: string;
    city: string;
    address: string | null;
    children: Array<{ id: string; fullName: string; gradeLevel: string }>;
  } | null;
}

interface AdminUsersClientProps {
  user: AuthenticatedUser;
  initialUsers: UserItem[];
}

export function AdminUsersClient({ user, initialUsers }: AdminUsersClientProps) {
  const { t, locale } = useTranslation();

  const [usersList, setUsersList] = useState<UserItem[]>(initialUsers);
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filtered users
  const filteredUsers = usersList.filter((u) => {
    const matchesRole = selectedRole === "ALL" || u.role === selectedRole;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phoneNumber && u.phoneNumber.includes(q));
    return matchesRole && matchesSearch;
  });

  const handleToggleActive = async (targetUser: UserItem) => {
    if (targetUser.id === user.id) {
      alert(
        locale === "en"
          ? "You cannot deactivate your own admin account."
          : "Vous ne pouvez pas désactiver votre propre compte."
      );
      return;
    }

    setUpdatingId(targetUser.id);
    const newStatus = !targetUser.isActive;

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUser.id, isActive: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de mise à jour");
      }

      setUsersList((prev) =>
        prev.map((item) =>
          item.id === targetUser.id ? { ...item, isActive: newStatus } : item
        )
      );

      setNotification(
        locale === "en"
          ? `Status updated: ${targetUser.fullName} is now ${newStatus ? "ACTIVE" : "SUSPENDED"}.`
          : `Statut mis à jour : ${targetUser.fullName} est maintenant ${newStatus ? "ACTIF" : "SUSPENDU"}.`
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: locale === "en" ? "Administrator" : "Administrateur",
          cls: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "TEACHER":
        return {
          label: locale === "en" ? "Teacher / Tutor" : "Professeur / Tuteur",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "PARENT":
        return {
          label: locale === "en" ? "Parent" : "Parent d'Élève",
          cls: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "STUDENT":
        return {
          label: locale === "en" ? "Student" : "Élève",
          cls: "bg-amber-50 text-amber-700 border-amber-200",
        };
      default:
        return {
          label: role,
          cls: "bg-slate-50 text-slate-700 border-slate-200",
        };
    }
  };

  const roleCounts = {
    ALL: usersList.length,
    TEACHER: usersList.filter((u) => u.role === "TEACHER").length,
    PARENT: usersList.filter((u) => u.role === "PARENT").length,
    STUDENT: usersList.filter((u) => u.role === "STUDENT").length,
    ADMIN: usersList.filter((u) => u.role === "ADMIN").length,
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              {locale === "en" ? "Administration Console" : "Console d'Administration"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "User Management" : "Gestion Utilisateurs"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
            {locale === "en" ? "User Accounts & Access Control" : "Gestion des Comptes & Accès Plateforme"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {locale === "en"
              ? "Supervise all registered parents, teachers, students, and administrators across Guinea."
              : "Supervisez l'ensemble des parents, enseignants, élèves et administrateurs enregistrés en Guinée."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 transition-colors border border-slate-200/90 shadow-xs"
          >
            {locale === "en" ? "Back to Dashboard" : "Tableau de bord"}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* 2. Controls & Filter Tabs */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: "ALL", label: locale === "en" ? "All Users" : "Tous", count: roleCounts.ALL },
            { key: "TEACHER", label: locale === "en" ? "Teachers" : "Enseignants", count: roleCounts.TEACHER },
            { key: "PARENT", label: locale === "en" ? "Parents" : "Parents", count: roleCounts.PARENT },
            { key: "STUDENT", label: locale === "en" ? "Students" : "Élèves", count: roleCounts.STUDENT },
            { key: "ADMIN", label: locale === "en" ? "Admins" : "Admins", count: roleCounts.ADMIN },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedRole(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedRole === tab.key
                  ? "bg-[#16385c] text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedRole === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/80 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={locale === "en" ? "Search name, email, phone..." : "Rechercher nom, e-mail, tél..."}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16385c] transition-all"
          />
        </div>
      </div>

      {/* 3. Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 sm:px-6">{locale === "en" ? "User" : "Utilisateur"}</th>
                <th className="py-3.5 px-4">{locale === "en" ? "Role" : "Rôle"}</th>
                <th className="py-3.5 px-4">{locale === "en" ? "Phone / Contact" : "Téléphone"}</th>
                <th className="py-3.5 px-4">{locale === "en" ? "Profile Details" : "Détails Profil"}</th>
                <th className="py-3.5 px-4">{locale === "en" ? "Status" : "Statut"}</th>
                <th className="py-3.5 px-4">{locale === "en" ? "Registered" : "Date Inscription"}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{locale === "en" ? "Actions" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const isBusy = updatingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#16385c] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate">{u.fullName}</span>
                            <span className="text-[11px] text-slate-400 block truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleBadge.cls}`}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {u.phoneNumber || (
                          <span className="text-slate-300 font-sans italic text-[11px]">
                            {locale === "en" ? "Not set" : "Non renseigné"}
                          </span>
                        )}
                      </td>

                      {/* Profile Details */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.teacherProfile ? (
                          <div className="space-y-0.5">
                            <span className="inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {u.teacherProfile.verificationStatus}
                            </span>
                            <span className="block text-[11px] text-slate-500 truncate max-w-xs">
                              {u.teacherProfile.subjects.map((s) => s.subject.name).join(", ") ||
                                u.teacherProfile.city}
                            </span>
                          </div>
                        ) : u.parentProfile ? (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-700 block text-[11px]">
                              {u.parentProfile.children.length}{" "}
                              {u.parentProfile.children.length > 1
                                ? locale === "en" ? "children" : "enfants"
                                : locale === "en" ? "child" : "enfant"}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {u.parentProfile.city}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {locale === "en" ? "Active" : "Actif"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {locale === "en" ? "Suspended" : "Suspendu"}
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString(
                          locale === "en" ? "en-US" : "fr-FR",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {u.id === user.id ? (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                            {locale === "en" ? "Your Account" : "Votre compte"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            disabled={isBusy}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                              u.isActive
                                ? "border-rose-200 text-rose-700 hover:bg-rose-50 bg-white"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white"
                            }`}
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.isActive ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {u.isActive
                                ? locale === "en" ? "Suspend" : "Suspendre"
                                : locale === "en" ? "Activate" : "Activer"}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    {locale === "en"
                      ? "No user accounts found matching your criteria."
                      : "Aucun utilisateur trouvé pour ces critères."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
