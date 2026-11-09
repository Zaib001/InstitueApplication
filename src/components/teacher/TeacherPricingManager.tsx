"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
  Clock,
  Coins,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ShieldAlert,
  Info,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";
import { PricingOfferType } from "@prisma/client";
import { formatGnf } from "@/lib/money/currency";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export interface PricingOfferItem {
  id: string;
  type: PricingOfferType;
  title: string;
  totalPriceGnf: number;
  sessionsCount: number;
  minutesPerSession: number;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

interface TeacherPricingManagerProps {
  initialOffers: PricingOfferItem[];
  isTeacherApproved: boolean;
}

export function TeacherPricingManager({
  initialOffers,
  isTeacherApproved,
}: TeacherPricingManagerProps) {
  const { t, locale } = useTranslation();

  const [offers, setOffers] = useState<PricingOfferItem[]>(initialOffers);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Calculator State
  const [calcType, setCalcType] = useState<PricingOfferType>(PricingOfferType.MONTHLY_PACKAGE);
  const [calcAmount, setCalcAmount] = useState<number>(800000);
  const [calcSessions, setCalcSessions] = useState<number>(8);
  const [calcDuration, setCalcDuration] = useState<number>(90);
  const [calculationResult, setCalculationResult] = useState<any | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Create Form State
  const [offerTitle, setOfferTitle] = useState("");
  const [offerType, setOfferType] = useState<PricingOfferType>(PricingOfferType.MONTHLY_PACKAGE);
  const [offerPrice, setOfferPrice] = useState<number>(800000);
  const [offerSessions, setOfferSessions] = useState<number>(8);
  const [offerDuration, setOfferDuration] = useState<number>(90);
  const [offerDescription, setOfferDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Auto-calculate simulation
  useEffect(() => {
    let active = true;
    const runCalculation = async () => {
      setIsCalculating(true);
      try {
        const res = await fetch("/api/pricing/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pricingType: calcType,
            amountGnf: calcAmount,
            sessionsCount: calcSessions,
            minutesPerSession: calcDuration,
          }),
        });
        const data = await res.json();
        if (active && data.pricing) {
          setCalculationResult(data.pricing);
        }
      } catch {
        // silent
      } finally {
        if (active) setIsCalculating(false);
      }
    };

    const timer = setTimeout(runCalculation, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [calcType, calcAmount, calcSessions, calcDuration]);

  // Handle Toggle Active
  const handleToggleActive = async (offer: PricingOfferItem) => {
    try {
      const res = await fetch(`/api/teacher/pricing-offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      if (res.ok) {
        setOffers((prev) =>
          prev.map((o) => (o.id === offer.id ? { ...o, isActive: !o.isActive } : o))
        );
      }
    } catch {
      // silent
    }
  };

  // Handle Create Offer
  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/teacher/pricing-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: offerTitle.trim(),
          type: offerType,
          totalPriceGnf: offerPrice,
          sessionsCount: offerType === PricingOfferType.HOURLY ? 1 : offerSessions,
          minutesPerSession: offerDuration,
          description: offerDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: data.error || (locale === "en" ? "Unable to create offer" : "Impossible de créer la formule"),
        });
        setIsSubmitting(false);
        return;
      }

      setOffers((prev) => [data.offer, ...prev]);
      setShowCreateModal(false);
      setOfferTitle("");
      setOfferDescription("");
      setFeedback({
        type: "success",
        message: locale === "en" ? "Pricing package published successfully!" : "Formule tarifaire publiée avec succès !",
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch {
      setFeedback({
        type: "error",
        message: locale === "en" ? "Server communication error" : "Erreur de communication avec le serveur",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              {locale === "en" ? "Teacher Space" : "Espace Enseignant"}
            </span>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-500 font-medium">
              {locale === "en" ? "Rates & Pricing Engine" : "Matières & Tarification"}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 font-heading tracking-tight">
              {t("pricingManager.title", "Matières, Tarifs & Forfaits")}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#16385c]/10 text-[#16385c]">
              {t("pricingManager.teacherShareBadge", "Part 85% Enseignant")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t(
              "pricingManager.subtitle",
              "Définissez vos forfaits mensuels et taux horaires avec répartition exacte en Francs Guinéens (GNF)."
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isTeacherApproved ? (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#16385c] hover:bg-[#1f4a7a] transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#e59a38]" />
              <span>{t("pricingManager.createOfferBtn", "Ajouter une formule")}</span>
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>{t("pricingManager.approvalRequired", "Approbation du dossier requise")}</span>
            </span>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      {/* Section 1: Interactive Real-Time Pricing Simulator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {t("pricingManager.simulatorTitle", "Simulateur Financier GNF en Temps Réel")}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t(
                  "pricingManager.simulatorSubtitle",
                  "Calcul strict en entiers sans virgule flottante • Réconciliation déterministe du reste"
                )}
              </p>
            </div>
          </div>

          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
            {t("pricingManager.commissionRuleBadge", "Commission : 15% Plateforme / 85% Enseignant")}
          </span>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Type */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {t("pricingManager.rateModel", "Modèle tarifaire")}
            </label>
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setCalcType(PricingOfferType.MONTHLY_PACKAGE)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  calcType === PricingOfferType.MONTHLY_PACKAGE
                    ? "bg-white text-slate-800 shadow-xs font-bold"
                    : "text-slate-600"
                }`}
              >
                {t("pricingManager.monthlyPackage", "Forfait")}
              </button>
              <button
                type="button"
                onClick={() => setCalcType(PricingOfferType.HOURLY)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  calcType === PricingOfferType.HOURLY
                    ? "bg-white text-slate-800 shadow-xs font-bold"
                    : "text-slate-600"
                }`}
              >
                {t("pricingManager.hourlyRate", "Horaire")}
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {calcType === PricingOfferType.MONTHLY_PACKAGE
                ? t("pricingManager.packageTotalLabel", "Total Forfait (GNF)")
                : t("pricingManager.hourlyRateLabel", "Taux horaire (GNF/h)")}
            </label>
            <input
              type="number"
              min="1000"
              step="10000"
              value={calcAmount}
              onChange={(e) => setCalcAmount(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden bg-white focus:ring-2 focus:ring-[#16385c]"
            />
          </div>

          {/* Sessions Count */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {t("pricingManager.sessionsCountLabel", "Nombre de séances")}
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={calcSessions}
              onChange={(e) => setCalcSessions(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden bg-white focus:ring-2 focus:ring-[#16385c]"
            />
          </div>

          {/* Duration Minutes */}
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              {t("pricingManager.durationLabel", "Durée par séance")}
            </label>
            <select
              value={calcDuration}
              onChange={(e) => setCalcDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white outline-hidden focus:ring-2 focus:ring-[#16385c]"
            >
              <option value={45}>45 {t("pricingManager.minutesWord", "minutes")}</option>
              <option value={60}>60 {t("pricingManager.minutesWord", "minutes (1h)")}</option>
              <option value={90}>90 {t("pricingManager.minutesWord", "minutes (1h30)")}</option>
              <option value={120}>120 {t("pricingManager.minutesWord", "minutes (2h)")}</option>
              <option value={180}>180 {t("pricingManager.minutesWord", "minutes (3h)")}</option>
            </select>
          </div>
        </div>

        {/* Calculation Summary KPIs */}
        {calculationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {t("pricingManager.totalPackageAmount", "Montant Total Forfait")}
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {formatGnf(calculationResult.totalAmountGnf)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {calculationResult.sessionsCount} {t("classes.sessionsUnit", "séances")} • {calculationResult.totalPlannedMinutes / 60} {t("pricingManager.hoursTeaching", "h d'enseignement")}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
                  {t("pricingManager.tutorShare85", "Part Enseignant (85%)")}
                </span>
                <span className="text-base font-extrabold text-emerald-800 mt-0.5 block">
                  {formatGnf(calculationResult.totalTeacherShareGnf)}
                </span>
                <span className="text-[10px] text-emerald-600">
                  {t("pricingManager.tutorShareDesc", "Estimation nette projetée")}
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
                  {t("pricingManager.platformCommission15", "Commission Plateforme (15%)")}
                </span>
                <span className="text-base font-extrabold text-blue-900 mt-0.5 block">
                  {formatGnf(calculationResult.totalPlatformCommissionGnf)}
                </span>
                <span className="text-[10px] text-blue-600">
                  {t("pricingManager.platformCommissionDesc", "Séquestre, modération & suivi")}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  {t("pricingManager.avgCostPerSession", "Coût Moyen / Séance")}
                </span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {formatGnf(calculationResult.effectiveCostPerSessionGnf)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {calculationResult.minutesPerSession} {t("pricingManager.minutesWord", "min / séance")}
                </span>
              </div>
            </div>

            {/* Per-Session Allocation Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-slate-700">
                <span>{t("pricingManager.tableTitle", "Détail d'allocation exacte par séance (sans aucun centime perdu)")}</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {t("pricingManager.remainderAbsorbed", "Reste absorbé : +{amount} GNF sur les 1ères séances").replace("{amount}", calculationResult.remainderGnf.toString())}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/40 text-[10px] text-slate-400 uppercase font-semibold border-b border-slate-100">
                      <th className="py-2 px-3">{t("pricingManager.colSession", "Séance")}</th>
                      <th className="py-2 px-3">{t("pricingManager.colGross", "Montant Brut")}</th>
                      <th className="py-2 px-3">{t("pricingManager.colCommission", "Com. 15%")}</th>
                      <th className="py-2 px-3">{t("pricingManager.colTeacherNet", "Part Prof 85%")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculationResult.allocations.map((alloc: any) => (
                      <tr key={alloc.sessionIndex} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-3 font-semibold text-slate-700">
                          {t("pricingManager.sessionWord", "Séance")} #{alloc.sessionIndex}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">
                          {formatGnf(alloc.allocatedAmountGnf)}
                        </td>
                        <td className="py-1.5 px-3 text-blue-700">
                          {formatGnf(alloc.platformCommissionGnf)}
                        </td>
                        <td className="py-1.5 px-3 text-emerald-700 font-semibold">
                          {formatGnf(alloc.teacherNetGnf)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invariant Note */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-amber-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>{t("pricingManager.invariantNoticeTitle", "Règle contractuelle d'invariance :")}</strong>{" "}
                {t(
                  "pricingManager.invariantNoticeDesc",
                  "Les montants présentés sont des projections prévisionnelles. Aucun gain n'est acquis ou reversable avant que la famille n'ait effectué le prépaiement et validé chaque séance dispensée."
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Published Pricing Offers */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              {t("pricingManager.publishedOffersTitle", "Mes Formules Tarifaires Publiées")}
            </h3>
            <p className="text-[11px] text-slate-500">
              {t(
                "pricingManager.publishedOffersSubtitle",
                "Ces formules sont proposées aux familles lors de vos candidatures sur le marketplace."
              )}
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {offers.length} {t("pricingManager.offersCount", "formule(s)")}
          </span>
        </div>

        {offers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 space-y-2">
            <Coins className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">
              {t("pricingManager.emptyOffersTitle", "Aucune formule tarifaire configurée")}
            </p>
            <p className="text-slate-400">
              {t(
                "pricingManager.emptyOffersDesc",
                "Créez votre première formule forfaitaire ou horaire pour faciliter vos candidatures."
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className={`p-4 rounded-xl border transition-all ${
                  offer.isActive
                    ? "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                    : "bg-slate-50/80 border-slate-200/60 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{offer.title}</h4>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {offer.type === PricingOfferType.MONTHLY_PACKAGE
                        ? `${t("pricingManager.monthlyPackage", "Forfait Mensuel")} • ${offer.sessionsCount} ${t("classes.sessionsUnit", "séances")} (${offer.minutesPerSession} min)`
                        : `${t("pricingManager.hourlyRate", "Tarif Horaire")} • ${offer.minutesPerSession} min / ${t("classes.sessionsUnit", "séance")}`}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      offer.isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {offer.isActive
                      ? t("pricingManager.activeStatus", "Active")
                      : t("pricingManager.inactiveStatus", "Inactive")}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">
                      {t("classes.agreedRate", "Tarif")}
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatGnf(offer.totalPriceGnf)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">
                      {t("pricingManager.tutorShare85", "Part 85% estimée")}
                    </span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatGnf(Math.round((offer.totalPriceGnf * 85) / 100))}
                    </span>
                  </div>
                </div>

                {offer.description && (
                  <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                    {offer.description}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    {new Date(offer.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "fr-FR")}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleActive(offer)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    {offer.isActive ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-600" />
                        <span>{locale === "en" ? "Deactivate" : "Désactiver"}</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-400" />
                        <span>{locale === "en" ? "Activate" : "Activer"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create Pricing Offer */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                {t("pricingManager.modalCreateTitle", "Ajouter une Formule Tarifaire")}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {t("pricingManager.offerTitleLabel", "Titre de la formule *")}
                </label>
                <input
                  type="text"
                  required
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  placeholder={t("pricingManager.offerTitlePlaceholder", "Ex: Forfait Mensuel Réussite Bac SM — 8 séances de 2h")}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-[#16385c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {t("pricingManager.rateModel", "Modèle")}
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as PricingOfferType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden focus:ring-2 focus:ring-[#16385c]"
                  >
                    <option value={PricingOfferType.MONTHLY_PACKAGE}>
                      {t("pricingManager.monthlyPackage", "Forfait mensuel")}
                    </option>
                    <option value={PricingOfferType.HOURLY}>
                      {t("pricingManager.hourlyRate", "Tarif horaire")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {t("pricingManager.packageTotalLabel", "Prix (en GNF) *")}
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="50000"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 outline-hidden focus:ring-2 focus:ring-[#16385c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {offerType === PricingOfferType.MONTHLY_PACKAGE && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {t("pricingManager.sessionsCountLabel", "Nombre de séances")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={offerSessions}
                      onChange={(e) => setOfferSessions(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-[#16385c]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    {t("pricingManager.durationLabel", "Durée par séance")}
                  </label>
                  <select
                    value={offerDuration}
                    onChange={(e) => setOfferDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-hidden focus:ring-2 focus:ring-[#16385c]"
                  >
                    <option value={45}>45 {t("pricingManager.minutesWord", "minutes")}</option>
                    <option value={60}>60 {t("pricingManager.minutesWord", "minutes (1h)")}</option>
                    <option value={90}>90 {t("pricingManager.minutesWord", "minutes (1h30)")}</option>
                    <option value={120}>120 {t("pricingManager.minutesWord", "minutes (2h)")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  {t("pricingManager.descriptionLabel", "Description / Précisions (optionnel)")}
                </label>
                <textarea
                  rows={2}
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder={t(
                    "pricingManager.descriptionPlaceholder",
                    "Ex: Idéal pour préparation intensive et devoirs surveillés..."
                  )}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-hidden focus:ring-2 focus:ring-[#16385c]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  {t("pricingManager.cancelBtn", "Annuler")}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#16385c] hover:bg-[#204e7d] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{t("pricingManager.saveOfferBtn", "Publier la formule")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
