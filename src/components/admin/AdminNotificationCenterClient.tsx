"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  Send,
  Loader2,
  Filter,
  Check,
  ShieldCheck,
  XCircle,
  Inbox,
  AlertTriangle,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AuthenticatedUser } from "@/lib/auth/session";

interface OutboxItem {
  id: string;
  eventType: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  templateName: string;
  status: "PENDING" | "PROCESSING" | "SENT" | "DELIVERED" | "FAILED" | "RETRY_SCHEDULED" | "PERMANENT_FAILURE";
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  providerMessageId: string | null;
  createdAt: string;
  sentAt: string | null;
}

interface OutboxStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  delivered: number;
  failed: number;
  permanentFailure: number;
}

interface AdminNotificationCenterProps {
  user: AuthenticatedUser;
}

export function AdminNotificationCenterClient({ user }: AdminNotificationCenterProps) {
  const { locale } = useTranslation();

  const [items, setItems] = useState<OutboxItem[]>([]);
  const [stats, setStats] = useState<OutboxStats>({
    total: 0,
    pending: 0,
    processing: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    permanentFailure: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState<string>(user.email || "");
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient || !testEmailRecipient.includes("@")) return;

    setIsSendingTest(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/notifications/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: testEmailRecipient }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: data.message || `E-mail de test expédié avec succès à ${testEmailRecipient} via Resend.`,
        });
        setShowTestModal(false);
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "Échec de l'envoi de l'e-mail de test via Resend.",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Erreur réseau lors de la requête de test email.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const loadOutboxData = useCallback(async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", targetPage.toString());
      params.set("limit", "20");
      if (selectedStatus !== "ALL") params.set("status", selectedStatus);

      const res = await fetch(`/api/admin/notifications/outbox?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setStats((prev) => data.stats || prev);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch admin outbox items:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    setPage(1);
    loadOutboxData(1);
  }, [loadOutboxData]);

  // Flush Outbox queue immediately
  const handleFlushOutbox = async () => {
    setIsFlushing(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/cron/outbox-flush", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: `File traitée avec succès (${data.result?.processedCount ?? 0} éléments traités, ${data.result?.successCount ?? 0} délivrés).`,
        });
        loadOutboxData(page);
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "Erreur lors du déclenchement du worker.",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Erreur réseau lors de la purge de la file.",
      });
    } finally {
      setIsFlushing(false);
    }
  };

  // Trigger manual retry for a failed outbox record
  const handleRetryItem = async (outboxId: string) => {
    setRetryingId(outboxId);
    setActionMessage(null);
    try {
      const res = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outboxId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({
          type: "success",
          text: "Nouvelle tentative d'envoi déclenchée avec succès.",
        });
        loadOutboxData(page);
      } else {
        setActionMessage({
          type: "error",
          text: data.error || "Erreur lors de la relance de l'envoi.",
        });
      }
    } catch {
      setActionMessage({
        type: "error",
        text: "Erreur réseau lors de la tentative.",
      });
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: OutboxItem["status"]) => {
    switch (status) {
      case "DELIVERED":
      case "SENT":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {status}
          </span>
        );
      case "PENDING":
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#1c436b] border border-blue-200">
            <Clock className="w-3 h-3 text-[#1c436b]" />
            {status}
          </span>
        );
      case "RETRY_SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            RETRY
          </span>
        );
      case "FAILED":
      case "PERMANENT_FAILURE":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            {status === "PERMANENT_FAILURE" ? "ÉCHEC DÉFINITIF" : "ÉCHEC"}
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1c436b]">
              <Mail className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 font-heading tracking-tight">
              {locale === "en" ? "Notification & Outbox Center" : "Centre de Notifications & Outbox"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "en"
              ? "Supervise transactional email deliveries, queue states, and scheduled automated reminders."
              : "Supervision en direct de la délivrabilité des emails transactionnels Resend, de la file d'attente PostgreSQL et des rappels automatiques."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTestModal(true)}
            className="px-3.5 py-2.5 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title={locale === "en" ? "Send Live Test Email" : "Tester la délivrabilité Resend"}
          >
            <Mail className="w-4 h-4 text-amber-600" />
            <span>{locale === "en" ? "Live Email Test" : "Tester l'envoi email"}</span>
          </button>

          <button
            type="button"
            onClick={() => loadOutboxData(page)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            title={locale === "en" ? "Refresh list" : "Actualiser la liste"}
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleFlushOutbox}
            disabled={isFlushing}
            className="px-4 py-2.5 text-xs font-bold text-white bg-[#1c436b] hover:bg-[#122b49] rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isFlushing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>{locale === "en" ? "Flush Outbox Queue" : "Traiter la file Outbox"}</span>
          </button>
        </div>
      </div>

      {/* Action alerts */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 ${actionMessage.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
        >
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {locale === "en" ? "Total Queued" : "Total File Outbox"}
          </div>
          <div className="text-2xl font-black text-slate-800 font-heading">{stats.total}</div>
          <div className="text-[10px] text-slate-400">Tous statuts confondus</div>
        </div>

        {/* Pending / Retrying */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
            {locale === "en" ? "Pending / Retrying" : "En attente / Relances"}
          </div>
          <div className="text-2xl font-black text-blue-900 font-heading">
            {stats.pending + stats.processing}
          </div>
          <div className="text-[10px] text-slate-400">Prêt pour envoi worker</div>
        </div>

        {/* Delivered */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            {locale === "en" ? "Delivered" : "Livrés avec succès"}
          </div>
          <div className="text-2xl font-black text-emerald-900 font-heading">
            {stats.delivered + stats.sent}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">Validés ou en transit</div>
        </div>

        {/* Failed */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            {locale === "en" ? "Failed / Dead Letter" : "Échecs"}
          </div>
          <div className="text-2xl font-black text-rose-900 font-heading">
            {stats.failed + stats.permanentFailure}
          </div>
          <div className="text-[10px] text-rose-700 font-medium">Relance manuelle requise</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl">
          {[
            { key: "ALL", label: locale === "en" ? "All" : "Tous" },
            { key: "PENDING", label: locale === "en" ? "Pending" : "En attente" },
            { key: "DELIVERED", label: locale === "en" ? "Delivered" : "Livrés" },
            { key: "FAILED", label: locale === "en" ? "Failed" : "Échecs" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedStatus === tab.key
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Affichage des 20 éléments les plus récents
        </span>
      </div>

      {/* Outbox Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#1c436b]" />
            <p className="text-xs font-medium text-slate-600">
              {locale === "en" ? "Loading outbox logs..." : "Chargement du journal Outbox..."}
            </p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm text-slate-700">
              {locale === "en" ? "No outbox records found" : "Aucun enregistrement trouvé"}
            </h3>
            <p className="text-xs text-slate-400">
              {locale === "en"
                ? "Outbox entries are created whenever a transactional notification is published."
                : "Les messages apparaissent ici dès qu'un événement du domaine est publié."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Destinataire</th>
                  <th className="py-3 px-4">Objet & Événement</th>
                  <th className="py-3 px-4">Statut</th>
                  <th className="py-3 px-4">Essais</th>
                  <th className="py-3 px-4">Créé / Envoyé</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isRetrying = retryingId === item.id;
                  const canRetry =
                    item.status === "FAILED" ||
                    item.status === "PERMANENT_FAILURE" ||
                    item.status === "RETRY_SCHEDULED" ||
                    item.status === "PENDING";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{item.recipientName}</div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px]">
                          {item.recipientEmail}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={item.subject}>
                          {item.subject}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {item.eventType}
                          </span>
                          <span>•</span>
                          <span className="text-slate-500 font-mono">{item.templateName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                        {item.lastError && (
                          <div
                            className="text-[10px] text-rose-600 truncate max-w-[160px] mt-1"
                            title={item.lastError}
                          >
                            {item.lastError}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <span className="font-bold text-slate-700">{item.attempts}</span>
                        <span className="text-slate-400">/{item.maxAttempts}</span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
                        <div>{new Date(item.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {canRetry ? (
                          <button
                            type="button"
                            onClick={() => handleRetryItem(item.id)}
                            disabled={isRetrying}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#1c436b] hover:text-white hover:bg-[#1c436b] border border-[#1c436b]/30 rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            {isRetrying ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span>{locale === "en" ? "Retry" : "Relancer"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const nextP = Math.max(1, page - 1);
                setPage(nextP);
                loadOutboxData(nextP);
              }}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs font-semibold"
            >
              Précédent
            </button>
            <button
              type="button"
              onClick={() => {
                const nextP = Math.min(totalPages, page + 1);
                setPage(nextP);
                loadOutboxData(nextP);
              }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs font-semibold"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
                  <Mail className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-slate-800 text-base">
                  {locale === "en" ? "Live Resend Email Test" : "Test de délivrabilité Resend"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {locale === "en"
                ? "Send an immediate test email from notifications@monsieurfanyi.com via Resend to verify DNS, SPF, DKIM and real inbox reception."
                : "Envoyez un e-mail de test immédiat depuis notifications@monsieurfanyi.com via Resend pour vérifier la délivrabilité réelle, SPF et DKIM dans votre boîte de réception."}
            </p>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {locale === "en" ? "Recipient Email" : "Adresse email de réception"}
                </label>
                <input
                  type="email"
                  required
                  value={testEmailRecipient}
                  onChange={(e) => setTestEmailRecipient(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1c436b] focus:bg-white transition-all text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  {locale === "en" ? "Cancel" : "Annuler"}
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-[#1c436b] hover:bg-[#122b49] rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSendingTest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{locale === "en" ? "Send Now" : "Envoyer le test"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
