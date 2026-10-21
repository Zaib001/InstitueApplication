"use client";

import React, { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { SectionContainer } from "./SectionContainer";
import { SectionHeading } from "./SectionHeading";
import {
  allocatePackageSessions,
  calculateSessionCommission,
  reconcilePackageProgress,
} from "@/lib/money/currency";
import {
  Calculator,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function PricingExplainer() {
  const { t, formatCurrencyGNF } = useTranslation();

  // État du simulateur interactif
  const [packageAmountGnf, setPackageAmountGnf] = useState(400000);
  const [sessionsCount, setSessionsCount] = useState(8);
  const [approvedCount, setApprovedCount] = useState(3);

  const allocation = allocatePackageSessions(packageAmountGnf, sessionsCount);
  const reconciliation = reconcilePackageProgress(
    packageAmountGnf,
    sessionsCount,
    approvedCount,
    15
  );

  return (
    <SectionContainer id="tarifs" className="bg-white">
      <SectionHeading
        badge={t("pricing.badge", "Tarification & Modèle 15/85")}
        badgeIcon={<Calculator className="w-3.5 h-3.5 text-brand-blue" />}
        title={t("pricing.title", "Une clarté financière absolue : Aucun frais caché")}
        subtitle={t(
          "pricing.subtitle",
          "Conformément au SRD V2.0, la commission Monsieur Fanyi est de 15 % et la part du professeur de 85 %. Le professeur n'est payé qu'au fur et à mesure des cours confirmés par le parent."
        )}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* Colonne Gauche : Explication des deux formules */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100/70 text-brand-blue flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-navy">
                  {t("pricing.hourlyTitle", "Cours à l'Heure (À la carte)")}
                </h3>
                <p className="text-xs text-brand-muted">
                  {t("pricing.hourlySubtitle", "Pour une révision ponctuelle ou un renforcement ciblé")}
                </p>
              </div>
            </div>
            <p className="text-xs text-brand-charcoal leading-relaxed pl-13">
              {t(
                "pricing.hourlyDesc",
                "Tarif fixé librement par le professeur en GNF entier. Durée standard de 60, 90 ou 120 minutes avec calcul au prorata exact."
              )}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-brand-blue-surface/70 border border-blue-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-blue text-white flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-navy">
                  {t("pricing.packageTitle", "Forfait Mensuel (Recommandé)")}
                </h3>
                <p className="text-xs text-brand-muted">
                  {t("pricing.packageSubtitle", "Pour une progression continue tout au long de l'année")}
                </p>
              </div>
            </div>
            <p className="text-xs text-brand-charcoal leading-relaxed pl-13">
              {t(
                "pricing.packageDesc",
                "Précise le montant total, le nombre de séances et leur durée. La valeur unitaire est allouée sans perte arithmétique."
              )}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/60 text-xs text-teal-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>{t("pricing.escrowTitle", "Séquestre Interne Protecteur :")}</strong>
              <p className="mt-0.5 text-[11px] leading-relaxed">
                {t(
                  "pricing.escrowDesc",
                  "Tant que vous ne cliquez pas sur « Confirmer » après la séance, les fonds restent conservés sur le compte de la classe. En cas de contestation, l'administrateur arbitre."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Simulateur Interactif en Direct */}
        <div className="lg:col-span-7 bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-brand-gold" />
                {t("pricing.simTitle", "Simulateur Financier en Francs Guinéens (GNF)")}
              </h3>
              <p className="text-xs text-slate-400">
                {t("pricing.simSubtitle", "Règle contractuelle 15 % plateforme / 85 % enseignant")}
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {t("pricing.simStrictBadge", "Arithmétique Entière Stricte")}
            </span>
          </div>

          {/* Contrôles du simulateur */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label htmlFor="package-total-amount" className="block text-slate-400 mb-1">
                {t("pricing.labelPackageAmount", "Montant Forfait (GNF)")}
              </label>
              <select
                id="package-total-amount"
                value={packageAmountGnf}
                onChange={(e) => setPackageAmountGnf(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value={200000}>200 000 GNF</option>
                <option value={300000}>300 000 GNF</option>
                <option value={400000}>400 000 GNF</option>
                <option value={600000}>600 000 GNF</option>
                <option value={800000}>800 000 GNF</option>
              </select>
            </div>

            <div>
              <label htmlFor="package-sessions-count" className="block text-slate-400 mb-1">
                {t("pricing.labelSessionsCount", "Nombre de Séances")}
              </label>
              <select
                id="package-sessions-count"
                value={sessionsCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSessionsCount(val);
                  if (approvedCount > val) setApprovedCount(val);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                <option value={4}>4 {t("pricing.sessionsWord", "séances")}</option>
                <option value={8}>8 {t("pricing.sessionsWord", "séances")}</option>
                <option value={12}>12 {t("pricing.sessionsWord", "séances")}</option>
                <option value={16}>16 {t("pricing.sessionsWord", "séances")}</option>
              </select>
            </div>

            <div>
              <label htmlFor="approved-sessions-count" className="block text-slate-400 mb-1">
                {t("pricing.labelApprovedCount", "Séances Validées")}
              </label>
              <select
                id="approved-sessions-count"
                value={approvedCount}
                onChange={(e) => setApprovedCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {Array.from({ length: sessionsCount + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {i} {i > 1 ? t("pricing.validatedPlural", "validées") : t("pricing.validatedWord", "validée")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grille de répartition des résultats */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">{t("pricing.unitPerSession", "Valeur unitaire par séance :")}</span>
              <span className="font-bold text-white">
                {formatCurrencyGNF(allocation.baseUnitAmountGnf)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-slate-700/40">
              <span className="text-slate-400">
                {t("pricing.grossEarned", "Montant brut acquis :")} ({approvedCount}/{sessionsCount} {t("pricing.sessionsWord", "séances")})
              </span>
              <span className="font-bold text-brand-gold">
                {formatCurrencyGNF(reconciliation.grossEarnedGnf)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">{t("pricing.commissionPlatform", "Commission Monsieur Fanyi (15 %) :")}</span>
              <span className="font-semibold text-blue-400">
                {formatCurrencyGNF(reconciliation.totalPlatformCommissionGnf)}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">{t("pricing.netTeacher", "Net dû au professeur (85 %) :")}</span>
              <span className="font-bold text-emerald-400">
                {formatCurrencyGNF(reconciliation.totalTeacherPayableGnf)}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <span>{sessionsCount - approvedCount} {t("pricing.remainingUnearned", "séances restantes non acquises :")}</span>
              <span className="font-bold">{formatCurrencyGNF(reconciliation.unearnedGnf)}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Réconciliation arithmétique : {formatCurrencyGNF(reconciliation.grossEarnedGnf)} acquis + {formatCurrencyGNF(reconciliation.unearnedGnf)} conservés = {formatCurrencyGNF(packageAmountGnf)} au Franc près.
          </p>
        </div>

      </div>
    </SectionContainer>
  );
}
