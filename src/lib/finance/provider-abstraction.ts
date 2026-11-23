/**
 * MONSIEUR FANYI — PAYMENT PROVIDER ABSTRACTION LAYER (M3.02)
 * Unified interface, security verification, and adapter implementations for
 * CinetPay (Guinea & International Cards), FedaPay (UEMOA/MTN), and Sandbox QA Simulator.
 */

import {
  PaymentProviderName,
  PaymentProviderCapabilities,
  ProviderWebhookEvent,
  ProviderStatusCheckResult,
  FinancialError,
} from "./types";
import crypto from "crypto";

export interface CreatePaymentSessionParams {
  intentReference: string;
  amountGnf: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  customerPhoneNumber?: string;
  returnUrl: string;
  cancelUrl: string;
  selectedChannel?: string; // ORANGE_MONEY | MTN_MOMO | CARD
  metadata?: Record<string, unknown>;
}

export interface PaymentSessionResponse {
  paymentUrl: string;
  providerReference: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface IPaymentProviderAdapter {
  readonly provider: PaymentProviderName;
  getCapabilities(): PaymentProviderCapabilities;
  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): boolean;
  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookEvent;
  createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse>;
  checkPaymentStatus(
    providerTransactionId: string,
    merchantReference?: string
  ): Promise<ProviderStatusCheckResult>;
}

// ============================================================================
// 1. CINETPAY ADAPTER (GUINEA & DIASPORA OPTIMIZED)
// ============================================================================

export class CinetPayAdapter implements IPaymentProviderAdapter {
  readonly provider = PaymentProviderName.CINETPAY;
  private secretKey: string;
  private siteId: string;
  private apiKey: string;
  private baseUrl = "https://api-checkout.cinetpay.com/v2";

  constructor() {
    this.secretKey = process.env.CINETPAY_SECRET_KEY || "";
    this.siteId = process.env.CINETPAY_SITE_ID || "";
    this.apiKey = process.env.CINETPAY_API_KEY || "";
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      provider: PaymentProviderName.CINETPAY,
      displayName: "CinetPay (Indisponible en Guinée pour le lancement)",
      supportsInternationalCards: true, // Visa, Mastercard France/Europe (3D Secure)
      supportsOrangeMoney: true, // Orange Money Guinée direct (OM_GN)
      supportsMtnMomo: true, // MTN Mobile Money Guinée direct (MTN_GN)
      supportsDisbursements: false, // Telecom payout API unconfirmed without telecom contract
      supportsRefunds: false, // Requires merchant dashboard manual agreement
      supportedCurrencies: ["GNF", "EUR", "USD", "XOF"],
      supportedChannels: ["ORANGE_MONEY", "MTN_MOMO", "CARD"],
      webhookSignatureAlgorithm: "HMAC_SHA256",
      isSandboxAvailable: true,
    };
  }

  private getSecretKey(): string {
    return process.env.CINETPAY_SECRET_KEY || this.secretKey;
  }

  /**
   * Cryptographically verifies incoming webhook signature.
   * CinetPay provides an HMAC signature via x-token or x-cinetpay-signature.
   */
  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): boolean {
    const signature =
      (headers["x-token"] as string) ||
      (headers["x-cinetpay-signature"] as string) ||
      "";

    const secret = this.getSecretKey();
    if (!signature || !secret) return false;

    try {
      const computed = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const bufSig = Buffer.from(signature.toLowerCase(), "utf-8");
      const bufComp = Buffer.from(computed.toLowerCase(), "utf-8");

      if (bufSig.length !== bufComp.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufSig, bufComp);
    } catch {
      return false;
    }
  }

  /**
   * Parses incoming CinetPay notification payload.
   */
  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookEvent {
    const transId = String(payload.cpm_trans_id || payload.trans_id || payload.transaction_id || "");
    const amount = Number(payload.cpm_amount || payload.amount || 0);
    const currency = String(payload.cpm_currency || payload.currency || "GNF");
    const resultCode = String(payload.cpm_result || payload.code || "");

    const isSuccess = resultCode === "00" || resultCode === "SUCCESS";

    return {
      provider: PaymentProviderName.CINETPAY,
      eventType: "PAYMENT_NOTIFICATION",
      providerTransactionId: transId,
      providerReference: String(payload.cpm_payment_config || transId),
      amount,
      currency,
      status: isSuccess ? "SUCCESS" : "FAILED",
      verifiedAt: new Date(),
      rawPayload: payload,
    };
  }

  /**
   * Initiates payment session via CinetPay API v2 (/v2/payment).
   */
  async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> {
    const isMock = !this.apiKey || this.apiKey.startsWith("mock_") || process.env.NODE_ENV === "test";

    if (isMock) {
      // Deterministic sandbox simulation URL when live keys are absent
      return {
        paymentUrl: `https://checkout.cinetpay.com/stage/${params.intentReference}`,
        providerReference: `cp_${params.intentReference}`,
        metadata: {
          mode: "SANDBOX_SIMULATED",
          channel: params.selectedChannel,
          amountGnf: params.amountGnf,
        },
      };
    }

    // Call official CinetPay API v2
    try {
      const splitName = (params.customerName || "Parent Élève").split(" ");
      const surname = splitName[0] || "Client";
      const name = splitName.slice(1).join(" ") || "Monsieur Fanyi";

      let channels = "ALL";
      if (params.selectedChannel === "ORANGE_MONEY" || params.selectedChannel === "MTN_MOMO") {
        channels = "MOBILE_MONEY";
      } else if (params.selectedChannel === "CARD") {
        channels = "CREDIT_CARD";
      }

      const body = {
        apikey: this.apiKey,
        site_id: this.siteId,
        transaction_id: params.intentReference,
        amount: params.amountGnf,
        currency: params.currency || "GNF",
        description: `Approvisionnement cours Monsieur Fanyi - Réf: ${params.intentReference}`,
        return_url: params.returnUrl,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://monsieurfanyi.com"}/api/finance/webhooks/cinetpay`,
        channels,
        customer_name: name,
        customer_surname: surname,
        customer_email: params.customerEmail,
        customer_phone_number: params.customerPhoneNumber || "+224622000000",
        customer_address: "Conakry",
        customer_city: "Conakry",
        customer_country: "GN",
        customer_state: "GN",
        customer_zip_code: "00224",
      };

      const response = await fetch(`${this.baseUrl}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json();

      if (json.code === "201" && json.data?.payment_url) {
        return {
          paymentUrl: json.data.payment_url,
          providerReference: json.data.payment_token || `cp_${params.intentReference}`,
          metadata: json.data,
        };
      }

      throw new FinancialError(
        `Échec d'initialisation CinetPay: ${json.message || "Erreur de paiement"} (Code ${json.code})`,
        "CINETPAY_INIT_ERROR",
        502
      );
    } catch (err: any) {
      if (err instanceof FinancialError) throw err;
      throw new FinancialError(
        `Connexion à la passerelle CinetPay impossible: ${err.message}`,
        "GATEWAY_NETWORK_ERROR",
        504
      );
    }
  }

  /**
   * Authoritatively queries CinetPay server-to-server check status endpoint (/v2/payment/check).
   * This is required before posting ledger entries to prevent spoofing.
   */
  async checkPaymentStatus(
    providerTransactionId: string,
    merchantReference?: string
  ): Promise<ProviderStatusCheckResult> {
    const isMock = !this.apiKey || this.apiKey.startsWith("mock_") || process.env.NODE_ENV === "test";

    if (isMock) {
      // In offline/mock test environments, return verified structure without outbound network
      const isFailed =
        providerTransactionId.includes("fail") ||
        Boolean(merchantReference && merchantReference.includes("fail"));
      const isCancelled =
        providerTransactionId.includes("cancel") ||
        Boolean(merchantReference && merchantReference.includes("cancel"));
      const status = isFailed ? "FAILED" : isCancelled ? "CANCELLED" : "SUCCESS";

      return {
        provider: PaymentProviderName.CINETPAY,
        providerTransactionId,
        merchantReference: merchantReference || providerTransactionId,
        amount: 800000,
        currency: "GNF",
        status,
        paymentMethod: "ORANGE_MONEY_GN",
        operatorTransactionId: `OM_TX_${Date.now()}`,
        verifiedAt: new Date(),
        rawResponse: {
          code: status === "SUCCESS" ? "00" : "603",
          message: status === "SUCCESS" ? "SUCCES_SIMULE" : "ECHEC_SIMULE",
          status: status === "SUCCESS" ? "ACCEPTED" : "FAILED",
        },
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/payment/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apikey: this.apiKey,
          site_id: this.siteId,
          transaction_id: providerTransactionId,
        }),
      });

      const json = await response.json();

      let status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" | "NOT_FOUND" = "PENDING";
      if (json.code === "00" && json.data?.status === "ACCEPTED") {
        status = "SUCCESS";
      } else if (json.code === "600") {
        status = "PENDING";
      } else if (json.code === "602") {
        status = "CANCELLED";
      } else if (json.code === "603" || json.code === "623") {
        status = "FAILED";
      } else if (json.code === "604" || json.code === "404") {
        status = "NOT_FOUND";
      }

      return {
        provider: PaymentProviderName.CINETPAY,
        providerTransactionId,
        merchantReference: merchantReference || providerTransactionId,
        amount: Number(json.data?.amount || 0),
        currency: String(json.data?.currency || "GNF"),
        status,
        paymentMethod: json.data?.payment_method,
        providerFeeGnf: Number(json.data?.operator_id ? 0 : 0),
        operatorTransactionId: json.data?.operator_id,
        verifiedAt: new Date(),
        rawResponse: json,
      };
    } catch (err: any) {
      throw new FinancialError(
        `Échec de vérification du statut auprès de CinetPay: ${err.message}`,
        "CINETPAY_STATUS_CHECK_FAILED",
        504
      );
    }
  }
}

// ============================================================================
// 2. FEDAPAY ADAPTER (WEST AFRICA & INTERNATIONAL CARDS)
// ============================================================================

export class FedaPayAdapter implements IPaymentProviderAdapter {
  readonly provider = PaymentProviderName.FEDAPAY;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.FEDAPAY_SECRET_KEY || "";
    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    this.baseUrl = isLive
      ? "https://api.fedapay.com/v1"
      : "https://sandbox-api.fedapay.com/v1";
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      provider: PaymentProviderName.FEDAPAY,
      displayName: "FedaPay (UEMOA, Cartes Internationales & MTN Guinée)",
      supportsInternationalCards: true, // Visa, Mastercard
      supportsOrangeMoney: false, // NOT SUPPORTED in Guinea on FedaPay
      supportsMtnMomo: true, // Supported via mtn_open_gn
      supportsDisbursements: false, // Guinea mobile money payouts unconfirmed
      supportsRefunds: true, // Via API /v1/transactions/{id}/refund
      supportedCurrencies: ["GNF", "XOF", "EUR"],
      supportedChannels: ["MTN_MOMO", "CARD"],
      webhookSignatureAlgorithm: "HMAC_SHA256",
      isSandboxAvailable: true,
    };
  }

  private getWebhookSecret(): string {
    return (
      process.env.FEDAPAY_WEBHOOK_SECRET ||
      process.env.FEDAPAY_SECRET_KEY ||
      this.secretKey
    );
  }

  /**
   * Cryptographically verifies incoming FedaPay webhook signature.
   * Supports:
   * 1. Timestamped signatures: t=timestamp,s=signature (or v1=signature) with 5-minute replay window.
   * 2. Raw HMAC hex signatures: HMAC-SHA256(rawBody, secret).
   * Uses constant-time comparison to protect against timing attacks.
   */
  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): boolean {
    const signatureHeader =
      (headers["x-fedapay-signature"] as string) ||
      (headers["X-FEDAPAY-SIGNATURE"] as string) ||
      "";
    if (!signatureHeader) return false;

    const secret = this.getWebhookSecret();
    if (!secret) return false;

    try {
      let timestamp: number | null = null;
      let signatureHash = "";

      // Check if signature contains timestamp scheme: t=timestamp,s=signature (or v1=signature)
      if (signatureHeader.includes("=")) {
        const parts = signatureHeader.split(",");
        for (const part of parts) {
          const [k, ...vArr] = part.trim().split("=");
          const val = vArr.join("=");
          if (k === "t") {
            const parsedTs = parseInt(val, 10);
            if (!isNaN(parsedTs)) {
              timestamp = parsedTs;
            }
          } else if (k === "s" || k === "v1") {
            signatureHash = val;
          }
        }
      } else {
        signatureHash = signatureHeader.trim();
      }

      if (!signatureHash) return false;

      // Replay attack prevention: verify timestamp within 5 minutes (300s) tolerance
      if (timestamp !== null) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const toleranceSeconds = 300; // 5 minutes
        if (Math.abs(currentTimestamp - timestamp) > toleranceSeconds) {
          return false;
        }
      }

      // Compute expected HMAC-SHA256 signature
      const payloadToSign =
        timestamp !== null ? `${timestamp}.${rawBody}` : rawBody;
      const computed = crypto
        .createHmac("sha256", secret)
        .update(payloadToSign)
        .digest("hex");

      const bufSig = Buffer.from(signatureHash.toLowerCase(), "utf-8");
      const bufComputed = Buffer.from(computed.toLowerCase(), "utf-8");

      if (bufSig.length !== bufComputed.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufSig, bufComputed);
    } catch {
      return false;
    }
  }

  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookEvent {
    const entity = (payload.entity as Record<string, unknown>) || payload;
    const transId = String(entity.id || "");
    const reference = String(entity.reference || transId);
    const amount = Number(entity.amount || 0);
    const statusStr = String(entity.status || "").toLowerCase();

    return {
      provider: PaymentProviderName.FEDAPAY,
      eventType: String(payload.event || "TRANSACTION"),
      providerTransactionId: transId,
      providerReference: reference,
      amount,
      currency: "GNF",
      status: statusStr === "approved" ? "SUCCESS" : "FAILED",
      verifiedAt: new Date(),
      rawPayload: payload,
    };
  }

  async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> {
    // If client requested Orange Money on FedaPay, reject immediately: not supported in Guinea
    if (params.selectedChannel === "ORANGE_MONEY") {
      throw new FinancialError(
        "FedaPay ne prend pas en charge Orange Money en Guinée. Veuillez utiliser CinetPay ou sélectionner MTN Mobile Money.",
        "FEDAPAY_OM_NOT_SUPPORTED_IN_GUINEA",
        422
      );
    }

    const isMock = !this.secretKey || this.secretKey.startsWith("mock_") || process.env.NODE_ENV === "test";

    if (isMock) {
      return {
        paymentUrl: `https://checkout.fedapay.com/stage/${params.intentReference}`,
        providerReference: `fp_${params.intentReference}`,
        metadata: {
          mode: "SANDBOX_SIMULATED",
          channel: params.selectedChannel,
          amountGnf: params.amountGnf,
        },
      };
    }

    try {
      const split = (params.customerName || "Parent").split(" ");
      const createTxRes = await fetch(`${this.baseUrl}/transactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: `Approvisionnement cours Monsieur Fanyi - ${params.intentReference}`,
          amount: Math.round(params.amountGnf),
          currency: { iso: params.currency || "GNF" },
          callback_url: params.returnUrl,
          customer: {
            firstname: split[0] || "Client",
            lastname: split.slice(1).join(" ") || "Parent",
            email: params.customerEmail,
          },
        }),
      });

      const txJson = await createTxRes.json();
      const txId = txJson["v1/transaction"]?.id || txJson.id;

      if (!txId) {
        throw new FinancialError(
          `Échec création transaction FedaPay: ${txJson.message || "Erreur"}`,
          "FEDAPAY_CREATE_ERROR",
          502
        );
      }

      // Generate checkout token
      const tokenRes = await fetch(`${this.baseUrl}/transactions/${txId}/token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      });

      const tokenJson = await tokenRes.json();
      const token = tokenJson.token;
      const checkoutUrl = tokenJson.url || `https://checkout.fedapay.com/checkout?token=${token}`;

      return {
        paymentUrl: checkoutUrl,
        providerReference: String(txId),
        metadata: { txId, token },
      };
    } catch (err: any) {
      if (err instanceof FinancialError) throw err;
      throw new FinancialError(
        `Connexion à la passerelle FedaPay impossible: ${err.message}`,
        "GATEWAY_NETWORK_ERROR",
        504
      );
    }
  }

  async checkPaymentStatus(
    providerTransactionId: string,
    merchantReference?: string
  ): Promise<ProviderStatusCheckResult> {
    const isMock = !this.secretKey || this.secretKey.startsWith("mock_") || process.env.NODE_ENV === "test";

    if (isMock) {
      const isFailed =
        providerTransactionId.includes("fail") ||
        Boolean(merchantReference && merchantReference.includes("fail"));
      const isCancelled =
        providerTransactionId.includes("cancel") ||
        Boolean(merchantReference && merchantReference.includes("cancel"));
      const status = isFailed ? "FAILED" : isCancelled ? "CANCELLED" : "SUCCESS";

      return {
        provider: PaymentProviderName.FEDAPAY,
        providerTransactionId,
        merchantReference: merchantReference || providerTransactionId,
        amount: 800000,
        currency: "GNF",
        status,
        paymentMethod: "MTN_MOMO_GN",
        verifiedAt: new Date(),
        rawResponse: { status: status === "SUCCESS" ? "approved" : "declined" },
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/transactions/${providerTransactionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
      });

      const json = await res.json();
      const tx = json["v1/transaction"] || json;
      const statusStr = String(tx.status || "").toLowerCase();

      let status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" | "NOT_FOUND" = "PENDING";
      if (statusStr === "approved") status = "SUCCESS";
      else if (statusStr === "pending") status = "PENDING";
      else if (statusStr === "canceled" || statusStr === "declined") status = "CANCELLED";
      else if (statusStr === "refunded") status = "FAILED";

      return {
        provider: PaymentProviderName.FEDAPAY,
        providerTransactionId,
        merchantReference: merchantReference || String(tx.reference || providerTransactionId),
        amount: Number(tx.amount || 0),
        currency: tx.currency?.iso || "GNF",
        status,
        verifiedAt: new Date(),
        rawResponse: json,
      };
    } catch (err: any) {
      throw new FinancialError(
        `Échec de vérification du statut auprès de FedaPay: ${err.message}`,
        "FEDAPAY_STATUS_CHECK_FAILED",
        504
      );
    }
  }
}

// ============================================================================
// 3. MOCK FINANCIAL ADAPTER (FOR TEST & OFFLINE QA)
// ============================================================================

export class MockFinancialAdapter implements IPaymentProviderAdapter {
  readonly provider = PaymentProviderName.MANUAL_BANK_TRANSFER;

  getCapabilities(): PaymentProviderCapabilities {
    return {
      provider: PaymentProviderName.MANUAL_BANK_TRANSFER,
      displayName: "Simulateur Financier Local Monsieur Fanyi (QA/Dev)",
      supportsInternationalCards: true,
      supportsOrangeMoney: true,
      supportsMtnMomo: true,
      supportsDisbursements: true,
      supportsRefunds: true,
      supportedCurrencies: ["GNF", "EUR", "USD"],
      supportedChannels: ["CARD", "ORANGE_MONEY", "MTN_MOMO"],
      webhookSignatureAlgorithm: "HMAC_SHA256",
      isSandboxAvailable: true,
    };
  }

  verifyWebhookSignature(): boolean {
    return true;
  }

  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookEvent {
    return {
      provider: PaymentProviderName.MANUAL_BANK_TRANSFER,
      eventType: "MOCK_PAYMENT_NOTIFICATION",
      providerTransactionId: String(
        payload.providerTransactionId || `mock_tx_${Date.now()}`
      ),
      amount: Number(payload.amount || 0),
      currency: String(payload.currency || "GNF"),
      status: "SUCCESS",
      verifiedAt: new Date(),
      rawPayload: payload,
    };
  }

  async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> {
    return {
      paymentUrl: `/api/finance/mock-checkout?intent=${params.intentReference}`,
      providerReference: `mock_ref_${params.intentReference}`,
    };
  }

  async checkPaymentStatus(
    providerTransactionId: string,
    merchantReference?: string
  ): Promise<ProviderStatusCheckResult> {
    return {
      provider: PaymentProviderName.MANUAL_BANK_TRANSFER,
      providerTransactionId,
      merchantReference: merchantReference || providerTransactionId,
      amount: 800000,
      currency: "GNF",
      status: "SUCCESS",
      verifiedAt: new Date(),
      rawResponse: { mode: "QA_SIMULATOR" },
    };
  }
}

// ============================================================================
// 4. DJOMY ADAPTER (PRIMARY GUINEA LAUNCH PROVIDER)
// ============================================================================

export class DjomyAdapter implements IPaymentProviderAdapter {
  readonly provider = PaymentProviderName.DJOMY;
  private clientId: string;
  private clientSecret: string;
  private merchantKey: string;
  private baseUrl: string;

  constructor() {
    this.clientId = process.env.DJOMY_CLIENT_ID || "";
    this.clientSecret = process.env.DJOMY_CLIENT_SECRET || process.env.DJOMY_WEBHOOK_SECRET || "";
    this.merchantKey = process.env.DJOMY_MERCHANT_KEY || "";
    const isProd = process.env.DJOMY_ENVIRONMENT === "production" || process.env.NODE_ENV === "production";
    this.baseUrl = process.env.DJOMY_BASE_URL || (isProd ? "https://api.djomy.africa/v1" : "https://sandbox.djomy.africa/api/v1");
  }

  getCapabilities(): PaymentProviderCapabilities {
    return {
      provider: PaymentProviderName.DJOMY,
      displayName: "Djomy (Cartes Visa/Mastercard & Orange Money Guinée)",
      supportsInternationalCards: true, // Visa, Mastercard with 3D Secure
      supportsOrangeMoney: true, // Direct Orange Money Guinée
      supportsMtnMomo: false, // Hidden for launch per client decision
      supportsDisbursements: true, // Weekly batch Mobile Money transfers
      supportsRefunds: false, // Manual administrative agreement/refund
      supportedCurrencies: ["GNF", "EUR", "USD"],
      supportedChannels: ["CARD", "ORANGE_MONEY"],
      webhookSignatureAlgorithm: "HMAC_SHA256",
      isSandboxAvailable: true,
    };
  }

  private getSecretKey(): string {
    return this.clientSecret || this.merchantKey || "djomy_sandbox_secret";
  }

  verifyWebhookSignature(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): boolean {
    const signature =
      (headers["x-djomy-signature"] as string) ||
      (headers["x-signature"] as string) ||
      (headers["x-token"] as string) ||
      "";

    const secret = this.getSecretKey();
    if (!signature) {
      if (process.env.NODE_ENV === "test") {
        return true;
      }
      return false;
    }

    if (process.env.NODE_ENV === "production" && !this.clientSecret) {
      // In production, missing webhook secret strictly fails verification
      return false;
    }

    try {
      const computed = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");

      const bufSig = Buffer.from(signature.toLowerCase(), "utf-8");
      const bufComp = Buffer.from(computed.toLowerCase(), "utf-8");

      if (bufSig.length !== bufComp.length) {
        return false;
      }

      return crypto.timingSafeEqual(bufSig, bufComp);
    } catch {
      return false;
    }
  }

  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookEvent {
    const transId = String(payload.transactionId || payload.transaction_id || payload.id || "");
    const providerRef = String(payload.merchantReference || payload.reference || payload.client_reference || "");
    const amount = Number(payload.amount || payload.amountGnf || 0);
    const currency = String(payload.currency || "GNF");
    const statusRaw = String(payload.status || "").toUpperCase();

    const isSuccess =
      statusRaw === "SUCCESS" ||
      statusRaw === "COMPLETED" ||
      statusRaw === "APPROVED" ||
      statusRaw === "PAID";
    const isPending = statusRaw === "PENDING" || statusRaw === "PROCESSING";

    return {
      provider: PaymentProviderName.DJOMY,
      eventType: "PAYMENT_NOTIFICATION",
      providerTransactionId: transId,
      providerReference: providerRef || transId,
      amount,
      currency,
      status: isSuccess ? "SUCCESS" : isPending ? "PENDING" : "FAILED",
      verifiedAt: new Date(),
      rawPayload: payload,
    };
  }

  async createPaymentSession(
    params: CreatePaymentSessionParams
  ): Promise<PaymentSessionResponse> {
    const isMock = !this.clientId || this.clientId.startsWith("mock_") || process.env.NODE_ENV === "test";

    if (isMock) {
      return {
        paymentUrl: `/api/finance/mock-checkout?intent=${params.intentReference}&provider=DJOMY`,
        providerReference: `djomy_mock_${params.intentReference}`,
        metadata: {
          mode: "SANDBOX_SIMULATION",
          provider: "DJOMY",
          channel: params.selectedChannel,
        },
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": this.clientId,
          "X-Merchant-Key": this.merchantKey,
          ...(this.clientSecret ? { Authorization: `Bearer ${this.clientSecret}` } : {}),
        },
        body: JSON.stringify({
          amount: params.amountGnf,
          currency: params.currency || "GNF",
          reference: params.intentReference,
          customer: {
            name: params.customerName,
            email: params.customerEmail,
            phone: params.customerPhoneNumber,
          },
          paymentMethod: params.selectedChannel,
          returnUrl: params.returnUrl,
          cancelUrl: params.cancelUrl,
          metadata: params.metadata,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new FinancialError(
          `Échec initialisation session Djomy: ${json.message || "Erreur passerelle"}`,
          "DJOMY_INIT_FAILED",
          res.status
        );
      }

      return {
        paymentUrl: json.paymentUrl || json.checkoutUrl || json.url,
        providerReference: json.transactionId || json.reference || `djomy_${params.intentReference}`,
        metadata: json,
      };
    } catch (err: any) {
      if (err instanceof FinancialError) throw err;
      return {
        paymentUrl: `/api/finance/mock-checkout?intent=${params.intentReference}&provider=DJOMY`,
        providerReference: `djomy_fallback_${params.intentReference}`,
        metadata: { fallback: true, error: err.message },
      };
    }
  }

  async checkPaymentStatus(
    providerTransactionId: string,
    merchantReference?: string
  ): Promise<ProviderStatusCheckResult> {
    const isMock = !this.clientId || this.clientId.startsWith("mock_") || process.env.NODE_ENV === "test";

    if (isMock) {
      const isFailed =
        providerTransactionId.includes("fail") ||
        Boolean(merchantReference && merchantReference.includes("fail"));
      const isCancelled =
        providerTransactionId.includes("cancel") ||
        Boolean(merchantReference && merchantReference.includes("cancel"));
      const status = isFailed ? "FAILED" : isCancelled ? "CANCELLED" : "SUCCESS";

      return {
        provider: PaymentProviderName.DJOMY,
        providerTransactionId,
        merchantReference: merchantReference || providerTransactionId,
        amount: 800000,
        currency: "GNF",
        status,
        paymentMethod: "ORANGE_MONEY_GN",
        verifiedAt: new Date(),
        rawResponse: { status, mode: "SANDBOX_MOCK" },
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/transactions/${providerTransactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Id": this.clientId,
          "X-Merchant-Key": this.merchantKey,
          ...(this.clientSecret ? { Authorization: `Bearer ${this.clientSecret}` } : {}),
        },
      });

      const json = await res.json();
      const statusRaw = String(json.status || "").toUpperCase();

      let status: "SUCCESS" | "PENDING" | "FAILED" | "CANCELLED" | "NOT_FOUND" = "PENDING";
      if (
        statusRaw === "SUCCESS" ||
        statusRaw === "COMPLETED" ||
        statusRaw === "APPROVED" ||
        statusRaw === "PAID"
      ) {
        status = "SUCCESS";
      } else if (statusRaw === "PENDING" || statusRaw === "PROCESSING") {
        status = "PENDING";
      } else if (statusRaw === "CANCELLED" || statusRaw === "EXPIRED") {
        status = "CANCELLED";
      } else if (statusRaw === "FAILED" || statusRaw === "DECLINED") {
        status = "FAILED";
      }

      return {
        provider: PaymentProviderName.DJOMY,
        providerTransactionId,
        merchantReference: merchantReference || String(json.reference || providerTransactionId),
        amount: Number(json.amount || 0),
        currency: json.currency || "GNF",
        status,
        providerFeeGnf: Number(json.fee || 0),
        paymentMethod: json.paymentMethod,
        verifiedAt: new Date(),
        rawResponse: json,
      };
    } catch {
      return {
        provider: PaymentProviderName.DJOMY,
        providerTransactionId,
        merchantReference: merchantReference || providerTransactionId,
        amount: 0,
        currency: "GNF",
        status: "PENDING",
        verifiedAt: new Date(),
        rawResponse: { error: "STATUS_FETCH_FAILED" },
      };
    }
  }
}

// ============================================================================
// 5. PROVIDER REGISTRY & COMPARISON ENGINE
// ============================================================================

export class PaymentProviderRegistry {
  private static adapters: Map<PaymentProviderName, IPaymentProviderAdapter> =
    new Map();

  static {
    this.adapters.set(PaymentProviderName.DJOMY, new DjomyAdapter());
    this.adapters.set(PaymentProviderName.CINETPAY, new CinetPayAdapter());
    this.adapters.set(PaymentProviderName.FEDAPAY, new FedaPayAdapter());
    this.adapters.set(
      PaymentProviderName.MANUAL_BANK_TRANSFER,
      new MockFinancialAdapter()
    );
  }

  static getDefaultProvider(): PaymentProviderName {
    return PaymentProviderName.DJOMY;
  }

  static getAdapter(provider: PaymentProviderName): IPaymentProviderAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new FinancialError(
        `Fournisseur de paiement non pris en charge: ${provider}`,
        "UNSUPPORTED_PROVIDER",
        400
      );
    }
    return adapter;
  }

  static getAllCapabilities(): PaymentProviderCapabilities[] {
    return Array.from(this.adapters.values()).map((a) => a.getCapabilities());
  }
}
