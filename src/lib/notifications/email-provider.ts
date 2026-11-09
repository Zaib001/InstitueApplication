import { Resend } from "resend";
import { EmailRenderResult } from "./email-templates";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  from?: string;
  idempotencyKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  error?: string;
  isBlocked?: boolean;
}

export class EmailProvider {
  private static resendClient: Resend | null = null;

  private static getClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "mock" || apiKey.startsWith("mock_")) {
      return null;
    }
    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
  }

  /**
   * Checks whether real email deliverability is actively enabled and configured
   */
  static isLiveConfigured(): boolean {
    // In automated test suite, use safe deterministic simulation unless explicitly requested
    if (process.env.VITEST === "true" || process.env.NODE_ENV === "test") {
      return process.env.TEST_LIVE_EMAIL === "true";
    }

    const apiKey = process.env.RESEND_API_KEY;
    return Boolean(
      apiKey &&
      apiKey.trim().length > 10 &&
      !apiKey.startsWith("mock_") &&
      process.env.EMAIL_ENABLED !== "false"
    );
  }

  /**
   * Sends an email via Resend if live configured, or safely simulates in test/mock mode
   */
  static async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    const client = this.getClient();
    const from = params.from || process.env.EMAIL_FROM || "Monsieur Fanyi <notifications@monsieurfanyi.com>";
    const replyTo = params.replyTo || process.env.EMAIL_REPLY_TO || "support@monsieurfanyi.com";

    // 1. Live Resend Delivery
    if (client && this.isLiveConfigured()) {
      try {
        const response = await client.emails.send(
          {
            from,
            to: params.to,
            subject: params.subject,
            html: params.html,
            text: params.text,
            replyTo,
          },
          params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined
        );

        if (response.error) {
          console.error("[EMAIL_PROVIDER_ERROR]", response.error);
          return {
            success: false,
            error: response.error.message,
          };
        }

        return {
          success: true,
          providerMessageId: response.data?.id || `resend_${Date.now()}`,
        };
      } catch (err: any) {
        console.error("[EMAIL_PROVIDER_EXCEPTION]", err);
        return {
          success: false,
          error: err.message || "Failed to dispatch email via Resend",
        };
      }
    }

    // 2. Safe Sandbox / Mock Mode
    // When credentials or domain DNS are not yet activated by the merchant:
    // Process safely, record simulated provider ID, and log for developer inspection.
    if (!params.to.includes("@") || params.to.includes("failure") || params.to.includes("simulate-error")) {
      return {
        success: false,
        error: "Simulated delivery failure for invalid or simulated failure recipient address.",
      };
    }

    const mockMessageId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    console.log(`[EMAIL_MOCK_DISPATCH] To: ${params.to} | Subject: "${params.subject}" | MessageId: ${mockMessageId}`);

    return {
      success: true,
      providerMessageId: mockMessageId,
      isBlocked: !this.isLiveConfigured(),
    };
  }
}
