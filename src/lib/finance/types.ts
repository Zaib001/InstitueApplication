/**
 * MONSIEUR FANYI — MILESTONE 3: ENTERPRISE FINANCIAL ARCHITECTURE
 * Core Financial Domain Types, Interfaces & Enumerations
 */

import {
  PaymentProviderName,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  ClassroomFundingStatus,
  SessionEarningsStatus,
  PayoutStatus,
  LedgerAccountType,
  LedgerEntryDirection,
  JournalReferenceType,
} from "@prisma/client";

export {
  PaymentProviderName,
  PaymentIntentStatus,
  PaymentTransactionStatus,
  ClassroomFundingStatus,
  SessionEarningsStatus,
  PayoutStatus,
  LedgerAccountType,
  LedgerEntryDirection,
  JournalReferenceType,
};

// ============================================================================
// 1. STANDARD CHART OF ACCOUNTS CODES
// ============================================================================

export const STANDARD_ACCOUNTS = {
  // 1000 - Assets / Clearing
  PARENT_CLEARING: "1010_PARENT_CLEARING",
  REFUND_CLEARING: "1020_REFUND_CLEARING",
  DISBURSEMENT_CLEARING: "1030_DISBURSEMENT_CLEARING",

  // 2000 - Liabilities / Escrow & Payables
  UNALLOCATED_ESCROW: "2010_UNALLOCATED_ESCROW",
  CLASSROOM_FUNDS: "2020_CLASSROOM_FUNDS",
  TEACHER_PAYABLE: "2030_TEACHER_PAYABLE",
  PAYOUT_LIABILITY: "2040_PAYOUT_LIABILITY",

  // 4000 - Revenue
  PLATFORM_COMMISSION: "4010_PLATFORM_COMMISSION",
  PARENT_FEE_CONTRIBUTIONS: "4020_PARENT_FEE_CONTRIBUTIONS",

  // 5000 - Expenses
  PROVIDER_FEES: "5010_PROVIDER_FEES",
} as const;

export type StandardAccountCode =
  (typeof STANDARD_ACCOUNTS)[keyof typeof STANDARD_ACCOUNTS];

// ============================================================================
// 2. PAYMENT PROVIDER CAPABILITIES
// ============================================================================

export interface PaymentProviderCapabilities {
  provider: PaymentProviderName;
  displayName: string;
  supportsInternationalCards: boolean;
  supportsOrangeMoney: boolean;
  supportsMtnMomo: boolean;
  supportsDisbursements: boolean;
  supportsRefunds: boolean;
  supportedCurrencies: string[];
  supportedChannels: string[];
  webhookSignatureAlgorithm?: "HMAC_SHA256" | "BASIC_TOKEN" | "CUSTOM";
  isSandboxAvailable: boolean;
}

export interface ProviderWebhookEvent {
  provider: PaymentProviderName;
  eventType: string;
  providerTransactionId: string;
  providerReference?: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "FAILED" | "PENDING";
  verifiedAt: Date;
  rawPayload: Record<string, unknown>;
  feeAmount?: number;
  exchangeRate?: number;
}

export interface ProviderStatusCheckResult {
  provider: PaymentProviderName;
  providerTransactionId: string;
  merchantReference: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" | "NOT_FOUND";
  paymentMethod?: string;
  providerFeeGnf?: number;
  operatorTransactionId?: string;
  verifiedAt: Date;
  rawResponse: Record<string, unknown>;
}

export type PayoutDisbursementMode = "MANUAL_ADMIN_RECORDED" | "PROVIDER_AUTOMATED";

// ============================================================================
// 3. PAYMENT INTENT & PREPAYMENT
// ============================================================================

export interface CreatePaymentIntentParams {
  intentReference?: string;
  parentUserId: string;
  classroomId?: string;
  packageId?: string;
  amountGnf?: number; // Total charged amount (courseAmountGnf + parentFeeGnf)
  courseAmountGnf?: number; // Pure course tutoring principal
  parentFeeGnf?: number; // Minimum 2% parent payment fee
  customerCurrency?: string;
  customerAmount?: number;
  provider: PaymentProviderName;
  selectedMethod?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  expirationMinutes?: number;
}

export interface ParentFeeCalculation {
  courseAmountGnf: number;
  parentFeeGnf: number;
  totalAmountGnf: number;
  feePercent: number;
}

export interface ConfirmPaymentTransactionParams {
  intentReference: string;
  providerTransactionId: string;
  settledAmountGnf: number;
  providerFeeGnf?: number;
  currency: string;
  rawPayload?: Record<string, unknown>;
  actorId?: string;
  idempotencyKey: string;
  verifiedAt?: Date;
  allowLateReconciliation?: boolean;
}

// ============================================================================
// 4. DOUBLE-ENTRY LEDGER
// ============================================================================

export interface LedgerPostingLine {
  accountCode: StandardAccountCode | string;
  direction: LedgerEntryDirection;
  amountGnf: number;
}

export interface PostJournalParams {
  referenceType: JournalReferenceType;
  referenceId: string;
  description: string;
  postedBy: string;
  currency?: string;
  lines: LedgerPostingLine[];
}

export interface AccountBalanceSummary {
  accountCode: string;
  accountName: string;
  type: LedgerAccountType;
  totalDebitsGnf: number;
  totalCreditsGnf: number;
  netBalanceGnf: number; // For Assets/Expenses: Debits - Credits; For Liab/Rev: Credits - Debits
}

// ============================================================================
// 5. SESSION EARNINGS & PAYOUT
// ============================================================================

export interface SessionEarningsEvaluation {
  sessionId: string;
  classroomId: string;
  teacherProfileId: string;
  isEligible: boolean;
  reasons: string[];
  grossAmountGnf: number;
  platformCommissionGnf: number;
  teacherNetGnf: number;
  commissionRatePercent: number;
  fundingStatus: ClassroomFundingStatus;
}

export interface RequestTeacherPayoutParams {
  teacherProfileId: string;
  amountGnf: number;
  channel: "ORANGE_MONEY" | "MTN_MOMO" | "BANK_TRANSFER" | string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  destinationId?: string;
  requestedByUserId: string;
  idempotencyKey?: string;
  disbursementMode?: PayoutDisbursementMode;
}

// ============================================================================
// 6. COMMISSION POLICY
// ============================================================================

export interface CommissionPolicySnapshot {
  policyVersion: string;
  platformPercent: number;
  teacherPercent: number;
  isConfirmedByClient: boolean;
}

// ============================================================================
// 7. FINANCIAL ERRORS
// ============================================================================

export class FinancialError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, code = "FINANCIAL_ERROR", statusCode = 400) {
    super(message);
    this.name = "FinancialError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class LedgerImbalanceError extends FinancialError {
  constructor(debits: number, credits: number) {
    super(
      `Échec d'équilibre comptable en partie double: Total Débits (${debits} GNF) != Total Crédits (${credits} GNF).`,
      "LEDGER_IMBALANCE",
      500
    );
  }
}

export class DuplicatePaymentError extends FinancialError {
  constructor(ref: string) {
    super(
      `Paiement dupliqué ou idempotence déjà consommée pour la référence: ${ref}`,
      "DUPLICATE_PAYMENT",
      409
    );
  }
}

export class IneligibleEarningsError extends FinancialError {
  constructor(sessionId: string, reasons: string[]) {
    super(
      `Séance ${sessionId} inéligible au versement: ${reasons.join(", ")}`,
      "INELIGIBLE_EARNINGS",
      422
    );
  }
}

export class UnauthorizedFinancialOperationError extends FinancialError {
  constructor(message = "Opération financière non autorisée") {
    super(message, "UNAUTHORIZED_FINANCIAL_OP", 403);
  }
}

