"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";
import { formatGnf } from "@/lib/money/currency";
import {
  validateGuineaPhoneNumber,
  validateChannelCompatibility,
  getUssdPaymentInstructions,
} from "@/lib/finance/phone-validation";

export interface CheckoutClassroomData {
  classroomId: string;
  subjectName: string;
  studentName: string;
  teacherName: string;
  monthlyRateGnf: number;
  hourlyRateGnf?: number;
  packageDetails?: {
    packageId?: string;
    totalAmountGnf: number;
    sessionsCount: number;
    minutesPerSession: number;
    pricingType: string;
  } | null;
}

interface ParentCheckoutModalProps {
  data: CheckoutClassroomData;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ProviderFxQuote {
  chargedCurrency: string;
  chargedAmount: number;
  exchangeRate: number;
  providerFee?: number;
}

type PaymentMethodType = "ORANGE_MONEY" | "MTN_MOMO" | "CARD";
type CheckoutStep = "METHOD_SELECTION" | "PROCESSING" | "PENDING_CONFIRMATION" | "SUCCESS" | "FAILED";

export function ParentCheckoutModal({ data, onClose, onSuccess }: ParentCheckoutModalProps) {
  const isProduction = process.env.NODE_ENV === "production";

  const courseAmountGnf =
    data.packageDetails?.totalAmountGnf || data.monthlyRateGnf || 800000;
  const parentFeeGnf = Math.round(courseAmountGnf * 0.02);
  const totalAmountGnf = courseAmountGnf + parentFeeGnf;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>("ORANGE_MONEY");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneWarning, setPhoneWarning] = useState<string | null>(null);
  const [detectedCarrier, setDetectedCarrier] = useState<string | null>(null);

  const [step, setStep] = useState<CheckoutStep>("METHOD_SELECTION");
  const [intentReference, setIntentReference] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [providerFxQuote, setProviderFxQuote] = useState<ProviderFxQuote | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(0);

  // Validate phone number as user types
  useEffect(() => {
    if (selectedMethod === "CARD") {
      setPhoneError(null);
      setPhoneWarning(null);
      setDetectedCarrier(null);
      return;
    }

    if (!phoneNumber) {
      setPhoneError(null);
      setPhoneWarning(null);
      setDetectedCarrier(null);
      return;
    }

    const val = validateGuineaPhoneNumber(phoneNumber);
    if (val.isValid) {
      setDetectedCarrier(val.operatorName);
      const compat = validateChannelCompatibility(phoneNumber, selectedMethod);
      if (!compat.isCompatible) {
        setPhoneError(compat.errorMessage || null);
        setPhoneWarning(null);
      } else {
        setPhoneError(null);
        setPhoneWarning(compat.warningMessage || null);
      }
    } else {
      setDetectedCarrier(null);
      if (phoneNumber.replace(/[\s\-\+]/g, "").length >= 9) {
        setPhoneError(val.error || null);
      } else {
        setPhoneError(null);
      }
      setPhoneWarning(null);
    }
  }, [phoneNumber, selectedMethod]);

  // Poll for status confirmation when pending
  useEffect(() => {
    if (step !== "PENDING_CONFIRMATION" || !intentReference) return;

    const interval = setInterval(async () => {
      try {
        setPollCount((prev) => prev + 1);
        const res = await fetch(`/api/finance/payment-intents?ref=${intentReference}`);
        if (res.ok) {
          const json = await res.json();
          if (json.intent?.status === "SUCCEEDED") {
            setStep("SUCCESS");
            clearInterval(interval);
            if (onSuccess) onSuccess();
          } else if (json.intent?.status === "FAILED") {
            setStep("FAILED");
            setErrorMessage("Le paiement a été refusé ou a expiré auprès de l'opérateur.");
            clearInterval(interval);
          }
        }
      } catch {
        // Polling network issue
      }
    }, 4000);

    // Timeout after 3 minutes (45 polls)
    if (pollCount > 45) {
      clearInterval(interval);
      setStep("FAILED");
      setErrorMessage("Délai d'attente d'autorisation dépassé. Vous pouvez réessayer.");
    }

    return () => clearInterval(interval);
  }, [step, intentReference, pollCount, onSuccess]);

  const handleInitiatePayment = async () => {
    setErrorMessage(null);

    // Validate phone number for mobile money
    if (selectedMethod !== "CARD") {
      const compat = validateChannelCompatibility(phoneNumber, selectedMethod);
      if (!compat.isCompatible) {
        setPhoneError(compat.errorMessage || "Numéro de téléphone invalide.");
        return;
      }
    }

    setStep("PROCESSING");

    try {
      const provider = "DJOMY";

      const res = await fetch("/api/finance/payment-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: data.classroomId,
          packageId: data.packageDetails?.packageId,
          courseAmountGnf,
          parentFeeGnf,
          amountGnf: totalAmountGnf,
          customerCurrency: "GNF", // Authoritative currency is GNF
          provider,
          selectedMethod,
          metadata: {
            phoneNumber,
            subjectName: data.subjectName,
            studentName: data.studentName,
          },
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Impossible d'initialiser le paiement.");
      }

      setIntentReference(json.intent.intentReference);

      if (json.paymentSession?.paymentUrl) {
        setCheckoutUrl(json.paymentSession.paymentUrl);
      }

      // If provider returned a confirmed FX conversion quote, display it
      if (json.paymentSession?.metadata?.fxQuote) {
        setProviderFxQuote(json.paymentSession.metadata.fxQuote);
      } else {
        setProviderFxQuote(null);
      }

      // Transition to pending authorization
      setStep("PENDING_CONFIRMATION");
    } catch (err: any) {
      setStep("FAILED");
      setErrorMessage(err.message || "Une erreur est survenue lors de l'initialisation.");
    }
  };

  const handleSimulateSandboxSuccess = async () => {
    if (!intentReference) return;
    try {
      setStep("PROCESSING");
      // Trigger confirmation route in development / test sandbox
      const res = await fetch(`/api/finance/payment-intents/${intentReference}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settledAmountGnf: totalAmountGnf,
          currency: "GNF",
          providerTransactionId: `sandbox_${Date.now()}`,
        }),
      });

      if (res.ok) {
        setStep("SUCCESS");
        if (onSuccess) onSuccess();
      } else {
        const json = await res.json();
        setStep("FAILED");
        setErrorMessage(json.error || "Échec de simulation sandbox.");
      }
    } catch (err: any) {
      setStep("FAILED");
      setErrorMessage(err.message || "Erreur de simulation.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[calc(100vh-2rem)] sm:max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-xs my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-[#16385c] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-xs sm:text-sm">
                Approvisionnement Sécurisé des Cours
              </h3>
              <p className="text-white/70 text-[10px] sm:text-xs">
                {data.subjectName} • Élève : {data.studentName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sandbox Notice Banner (Non-production) */}
        {!isProduction && (
          <div className="px-3.5 sm:px-4 py-1.5 bg-amber-50 border-b border-amber-200/80 text-amber-900 flex items-center justify-between text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Passerelle Djomy Sandbox (M3)</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-200/60 font-bold text-[9px] uppercase tracking-wider text-amber-900">
              Test Actif
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 min-h-0 [scrollbar-width:thin]">
          {/* Summary Box */}
          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Matière & Enseignant :</span>
              <span className="font-semibold text-slate-800">
                {data.subjectName} ({data.teacherName})
              </span>
            </div>
            {data.packageDetails && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Volume horaire :</span>
                <span className="font-medium text-slate-700">
                  {data.packageDetails.sessionsCount} séances de{" "}
                  {data.packageDetails.minutesPerSession / 60}h
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Montant des cours :</span>
                <span className="font-semibold text-slate-800">
                  {formatGnf(courseAmountGnf)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Frais de paiement opérateur (2 %) :</span>
                <span className="font-semibold text-slate-800">
                  +{formatGnf(parentFeeGnf)}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-900">Total à régler :</span>
                <div className="text-right">
                  <span className="font-extrabold text-[#16385c] text-sm sm:text-base">
                    {formatGnf(totalAmountGnf)}
                  </span>
                  {selectedMethod === "CARD" && (
                    <span className="block text-[10px] text-slate-500 italic mt-0.5">
                      Devise de référence : GNF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Provider Confirmed FX Quote if available */}
            {providerFxQuote && selectedMethod === "CARD" && (
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-900 text-[10.5px] space-y-0.5 border border-emerald-200">
                <span className="font-semibold block">Devis de change confirmé par la passerelle :</span>
                <span>
                  Montant facturé : <strong>{providerFxQuote.chargedAmount} {providerFxQuote.chargedCurrency}</strong> (Taux garanti : 1 {providerFxQuote.chargedCurrency} = {providerFxQuote.exchangeRate} GNF)
                </span>
              </div>
            )}
          </div>

          {/* STEP 1: Method Selection */}
          {step === "METHOD_SELECTION" && (
            <div className="space-y-2.5">
              <span className="font-semibold text-slate-800 block text-xs">
                Sélectionnez votre moyen de paiement sécurisé :
              </span>

              {/* Payment Methods Options */}
              <div className="space-y-1.5">
                {/* 1. Orange Money Guinée */}
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMethod === "ORANGE_MONEY"
                      ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                  onClick={() => setSelectedMethod("ORANGE_MONEY")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === "ORANGE_MONEY"}
                    onChange={() => setSelectedMethod("ORANGE_MONEY")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        🇬🇳 Orange Money Guinée
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-semibold">
                        Direct GNF
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10.5px] mt-0.5">
                      Paiement instantané par notification sur votre mobile Orange en Guinée via Djomy.
                    </p>
                  </div>
                </label>

                {/* 2. International Visa / Mastercard */}
                <label
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedMethod === "CARD"
                      ? "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                  onClick={() => setSelectedMethod("CARD")}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === "CARD"}
                    onChange={() => setSelectedMethod("CARD")}
                    className="mt-0.5 text-amber-600 focus:ring-amber-500 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <CreditCard className="w-3.5 h-3.5 text-[#16385c]" />
                        <span>Carte Bancaire Internationale</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">
                        Visa / Mastercard • Diaspora
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10.5px] mt-0.5">
                      Pour les parents résidant en France, Europe et à l'international (3D Secure via Djomy).
                    </p>
                  </div>
                </label>
              </div>

              {/* Mobile Phone Input for Mobile Money */}
              {selectedMethod !== "CARD" && (
                <div className="space-y-1 pt-1">
                  <label className="font-semibold text-slate-700 flex items-center justify-between text-xs">
                    <span>Numéro de téléphone mobile money :</span>
                    {detectedCarrier && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ✓ {detectedCarrier}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder={
                        selectedMethod === "ORANGE_MONEY"
                          ? "Ex: 622 12 34 56 ou +224 61x"
                          : "Ex: 664 12 34 56 ou +224 65x"
                      }
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                        phoneError
                          ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:ring-1 focus:ring-rose-400"
                          : "border-slate-300 focus:border-[#16385c] focus:ring-1 focus:ring-[#16385c]"
                      }`}
                    />
                  </div>
                  {phoneError ? (
                    <p className="text-rose-600 text-[10.5px] leading-tight flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{phoneError}</span>
                    </p>
                  ) : phoneWarning ? (
                    <p className="text-amber-700 text-[10px] leading-tight flex items-start gap-1">
                      <Info className="w-3 h-3 shrink-0 mt-0.5 text-amber-600" />
                      <span>{phoneWarning}</span>
                    </p>
                  ) : (
                    <p className="text-slate-400 text-[10px]">
                      Format guinéen : 9 chiffres débutant par 6 (Ex: +224 622 00 00 00).
                    </p>
                  )}
                </div>
              )}

              {/* International Card Notice & PCI DSS Scope Limitation */}
              {selectedMethod === "CARD" && (
                <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/60 text-blue-900 space-y-1">
                  <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Redirection sécurisée (Périmètre PCI DSS SAQ A) :</span>
                  </span>
                  <p className="text-[10px] leading-relaxed text-blue-800">
                    La saisie des données de carte bancaire s'effectue sur l'interface chiffrée certifiée PCI DSS (niveau 1) avec vérification 3D Secure. Monsieur Fanyi ne stocke aucune coordonnée bancaire.
                  </p>
                  <p className="text-[9.5px] text-blue-700 italic">
                    Devise : Montant de référence <strong>{formatGnf(totalAmountGnf)}</strong>. Conversion garantie par la banque émettrice.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Processing */}
          {step === "PROCESSING" && (
            <div className="py-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#16385c] animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-sm block">
                  Initialisation de la session de paiement...
                </span>
                <p className="text-slate-500 text-[11px]">
                  Connexion sécurisée à la passerelle et génération de la référence d'intention.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Pending Authorization */}
          {step === "PENDING_CONFIRMATION" && (
            <div className="space-y-3 py-1">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1.5">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <span className="font-bold text-xs">
                    En attente de votre autorisation de débit...
                  </span>
                </div>
                <div className="space-y-1 text-[11px]">
                  {getUssdPaymentInstructions(selectedMethod, totalAmountGnf).map((line, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {checkoutUrl && (
                <div className="text-center pt-1">
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] text-white hover:bg-[#112d4a]"
                  >
                    <span>Ouvrir la page de paiement sécurisée</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Sandbox simulation quick-action for test environments */}
              {!isProduction && (
                <div className="p-2.5 bg-slate-100 rounded-xl border border-dashed border-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-[11px]">
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span>Mode Bac à Sable (Test) :</span>
                  </div>
                  <p className="text-slate-500 text-[10px]">
                    Pour tester le flux complet sans débiter de compte réel, déclenchez la validation simulée.
                  </p>
                  <button
                    type="button"
                    onClick={handleSimulateSandboxSuccess}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Simuler l'approbation du paiement (Sandbox)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Success */}
          {step === "SUCCESS" && (
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-base">
                  Approvisionnement Confirmé avec Succès !
                </h4>
                <p className="text-slate-600 text-xs">
                  La provision de {formatGnf(totalAmountGnf)} a été allouée à la classe de {data.studentName}. Les séances sont désormais financées et prêtes à être programmées.
                </p>
                <div className="pt-2">
                  <a
                    href="/parent/payments"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <span>Consulter le reçu officiel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Failed */}
          {step === "FAILED" && (
            <div className="py-4 space-y-3">
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Échec de la transaction :</span>
                </span>
                <p className="text-[11px] leading-relaxed text-rose-800">
                  {errorMessage || "Le paiement n'a pas pu être validé. Aucun débit n'a été effectué sur votre compte."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {step === "SUCCESS" ? "Fermer" : "Annuler"}
          </button>

          {step === "METHOD_SELECTION" && (
            <button
              type="button"
              onClick={handleInitiatePayment}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] text-white hover:bg-[#112d4a] transition-colors flex items-center gap-1.5"
            >
              <span>Valider et Payer ({formatGnf(totalAmountGnf)})</span>
            </button>
          )}

          {step === "FAILED" && (
            <button
              type="button"
              onClick={() => setStep("METHOD_SELECTION")}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#16385c] text-white hover:bg-[#112d4a] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer le paiement</span>
            </button>
          )}

          {step === "SUCCESS" && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Voir la classe activée
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
