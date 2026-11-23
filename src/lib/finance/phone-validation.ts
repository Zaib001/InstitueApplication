/**
 * MONSIEUR FANYI — GUINEA MOBILE MONEY PHONE VALIDATION & OPERATOR DETECTION (REVISED M3.02)
 * Conforms to Republic of Guinea ARPT numbering plan:
 * - Country Code: +224
 * - Mobile subscriber number: exactly 9 digits beginning with 6 (+224 6XX XX XX XX).
 * - Primary operator ranges:
 *   * Orange Guinée: 61x, 62x
 *   * MTN Guinée (Areeba): 65x, 66x
 *   * Other / Ported subscribers: 60x, 63x, etc. (syntactically valid, validated by provider gateway).
 */

export type GuineaTelecomOperator = "ORANGE_MONEY_GN" | "MTN_MOMO_GN" | "OTHER_GN" | "UNKNOWN";

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string;
  nationalNumber: string;
  formatted: string;
  operator: GuineaTelecomOperator;
  operatorName: string;
  error?: string;
  warning?: string;
}

/**
 * Normalizes input string by stripping all whitespace, hyphens, dots, and parens.
 */
function cleanPhoneDigits(raw: string): string {
  return raw.replace(/[\s\-\.\(\)]/g, "");
}

/**
 * Validates a Guinea (+224) phone number.
 * Conforms to requirement: Does not reject valid subscribers solely because of an incomplete prefix assumption.
 */
export function validateGuineaPhoneNumber(raw: string): PhoneValidationResult {
  if (!raw || typeof raw !== "string") {
    return {
      isValid: false,
      e164: "",
      nationalNumber: "",
      formatted: "",
      operator: "UNKNOWN",
      operatorName: "Inconnu",
      error: "Veuillez saisir un numéro de téléphone guinéen valide.",
    };
  }

  let cleaned = cleanPhoneDigits(raw);

  // Strip international prefix if present (00224, +224, or 224 prefix on 12-digit numbers)
  if (cleaned.startsWith("+224")) {
    cleaned = cleaned.substring(4);
  } else if (cleaned.startsWith("00224")) {
    cleaned = cleaned.substring(5);
  } else if (cleaned.startsWith("224") && cleaned.length === 12) {
    cleaned = cleaned.substring(3);
  }

  // Must only contain digits
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      e164: "",
      nationalNumber: "",
      formatted: "",
      operator: "UNKNOWN",
      operatorName: "Inconnu",
      error: "Le numéro de téléphone ne doit comporter que des chiffres.",
    };
  }

  // Must be exactly 9 digits
  if (cleaned.length !== 9) {
    return {
      isValid: false,
      e164: "",
      nationalNumber: "",
      formatted: "",
      operator: "UNKNOWN",
      operatorName: "Inconnu",
      error: `Le numéro guinéen doit comporter exactement 9 chiffres (reçu : ${cleaned.length} chiffres). Exemple : 622 12 34 56`,
    };
  }

  // Must begin with 6 under ARPT national numbering plan
  if (!cleaned.startsWith("6")) {
    return {
      isValid: false,
      e164: "",
      nationalNumber: "",
      formatted: "",
      operator: "UNKNOWN",
      operatorName: "Inconnu",
      error: "Les numéros mobiles en Guinée commencent obligatoirement par le chiffre 6.",
    };
  }

  const prefix2 = cleaned.substring(0, 2); // 61, 62, 65, 66, etc.

  let operator: GuineaTelecomOperator = "OTHER_GN";
  let operatorName = "Opérateur Guinéen";
  let warning: string | undefined;

  if (prefix2 === "61" || prefix2 === "62") {
    operator = "ORANGE_MONEY_GN";
    operatorName = "Orange Guinée";
  } else if (prefix2 === "65" || prefix2 === "66") {
    operator = "MTN_MOMO_GN";
    operatorName = "MTN Guinée";
  } else {
    // Other valid 9-digit 6xx range (e.g. 60x, 63x, ported numbers)
    // Conforms to requirement: DO NOT reject!
    operator = "OTHER_GN";
    operatorName = "Opérateur Guinéen (Plage 6" + prefix2[1] + "x)";
    warning = "Opérateur non identifié automatiquement. La compatibilité mobile money sera validée par la passerelle.";
  }

  const e164 = `+224${cleaned}`;
  const formatted = `+224 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;

  return {
    isValid: true,
    e164,
    nationalNumber: cleaned,
    formatted,
    operator,
    operatorName,
    warning,
  };
}

/**
 * Validates that the provided phone number is compatible with the chosen mobile money payment method.
 * If operator detection is uncertain, permits submission so provider gateway handles routing.
 */
export function validateChannelCompatibility(
  phoneNumber: string,
  selectedChannel: "ORANGE_MONEY" | "MTN_MOMO" | string
): { isCompatible: boolean; validation: PhoneValidationResult; errorMessage?: string; warningMessage?: string } {
  const validation = validateGuineaPhoneNumber(phoneNumber);

  if (!validation.isValid) {
    return {
      isCompatible: false,
      validation,
      errorMessage: validation.error,
    };
  }

  // Definite mismatch check when carrier is known with certainty
  if (selectedChannel === "ORANGE_MONEY" && validation.operator === "MTN_MOMO_GN") {
    return {
      isCompatible: false,
      validation,
      errorMessage: `Le numéro ${validation.formatted} correspond à ${validation.operatorName} (65x/66x). Pour payer avec Orange Money, veuillez saisir un numéro Orange Guinée (61x ou 62x).`,
    };
  }

  if (selectedChannel === "MTN_MOMO" && validation.operator === "ORANGE_MONEY_GN") {
    return {
      isCompatible: false,
      validation,
      errorMessage: `Le numéro ${validation.formatted} correspond à ${validation.operatorName} (61x/62x). Pour payer avec MTN Mobile Money, veuillez saisir un numéro MTN Guinée (65x ou 66x).`,
    };
  }

  return {
    isCompatible: true,
    validation,
    warningMessage: validation.warning,
  };
}

/**
 * Returns accurate, provider-neutral payment instructions for customer authorization in Guinea.
 * Omits unverified USSD dial codes that may vary by telecom aggregator integration.
 */
export function getUssdPaymentInstructions(channel: string, amountGnf: number): string[] {
  const formattedAmount = `${amountGnf.toLocaleString("fr-FR")} GNF`;

  if (channel === "ORANGE_MONEY") {
    return [
      `Montant à débiter : ${formattedAmount}`,
      "1. Une invite d'autorisation de paiement est transmise à votre numéro Orange Money.",
      "2. Vérifiez le montant sur votre téléphone et validez la transaction (via la notification écran ou l'application Orange Money).",
      "3. Saisissez votre code secret Orange Money pour approuver le débit.",
      "4. Vous recevrez un SMS de confirmation de l'opérateur dès la validation de votre provision.",
    ];
  }

  if (channel === "MTN_MOMO") {
    return [
      `Montant à débiter : ${formattedAmount}`,
      "1. Une invite de débit MTN Mobile Money apparaît directement sur l'écran de votre téléphone.",
      "2. Vérifiez l'intitulé et le montant de la provision de cours Monsieur Fanyi.",
      "3. Saisissez votre code PIN secret MTN MoMo pour approuver le règlement.",
      "4. La classe sera approvisionnée instantanément dès la confirmation opérateur reçue.",
    ];
  }

  return [
    `Montant à régler : ${formattedAmount}`,
    "Suivez les instructions sécurisées affichées par la passerelle de paiement certifiée.",
  ];
}

/**
 * Masks a phone number for secure display in UI and notifications (e.g. "+224 62* *** *78").
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "—";
  const cleaned = phone.trim();
  if (cleaned.length < 8) return cleaned;
  if (cleaned.startsWith("+224") && cleaned.length >= 12) {
    const prefix = cleaned.slice(0, 7);
    const suffix = cleaned.slice(-2);
    return `${prefix}* *** *${suffix}`;
  }
  const prefix = cleaned.slice(0, 3);
  const suffix = cleaned.slice(-2);
  return `${prefix}*****${suffix}`;
}
