import { describe, it, expect } from "vitest";
import {
  CommissionPolicyService,
} from "@/lib/finance/commission-policy-service";
import {
  DoubleEntryLedger,
} from "@/lib/finance/double-entry-ledger";
import {
  sanitizeFinancialData,
} from "@/lib/finance/audit-service";
import {
  LedgerEntryDirection,
  STANDARD_ACCOUNTS,
  LedgerImbalanceError,
  FinancialError,
} from "@/lib/finance/types";

describe("Milestone 3 Unit Tests: Financial Calculations & Ledger Invariants", () => {
  describe("Commission Calculation & Integer Split Invariants", () => {
    it("preserves exact integer amounts with 15% platform / 85% teacher split", () => {
      const grossAmount = 800000; // 800,000 GNF monthly package
      const split = CommissionPolicyService.calculateSplit(grossAmount, 15);

      expect(split.platformCommissionGnf).toBe(120000);
      expect(split.teacherNetGnf).toBe(680000);
      expect(split.platformCommissionGnf + split.teacherNetGnf).toBe(grossAmount);
    });

    it("preserves exact integer amounts with 20% platform / 80% teacher split", () => {
      const grossAmount = 800000;
      const split = CommissionPolicyService.calculateSplit(grossAmount, 20);

      expect(split.platformCommissionGnf).toBe(160000);
      expect(split.teacherNetGnf).toBe(640000);
      expect(split.platformCommissionGnf + split.teacherNetGnf).toBe(grossAmount);
    });

    it("handles uneven division without losing a single franc (rounding remainder)", () => {
      // 123,457 GNF at 15% -> 18,518.55 -> rounds to 18,519
      const grossAmount = 123457;
      const split = CommissionPolicyService.calculateSplit(grossAmount, 15);

      expect(split.platformCommissionGnf).toBe(18519);
      expect(split.teacherNetGnf).toBe(104938);
      // Mathematical invariant: platform + teacher net must STRICTLY EQUAL gross
      expect(split.platformCommissionGnf + split.teacherNetGnf).toBe(grossAmount);
    });

    it("rejects negative amounts", () => {
      expect(() => CommissionPolicyService.calculateSplit(-50000, 15)).toThrow(
        FinancialError
      );
    });

    it("rejects invalid commission percentages", () => {
      expect(() => CommissionPolicyService.calculateSplit(100000, 105)).toThrow(
        FinancialError
      );
      expect(() => CommissionPolicyService.calculateSplit(100000, -5)).toThrow(
        FinancialError
      );
    });
  });

  describe("Double-Entry Ledger Balancing", () => {
    it("rejects unbalanced journal entries (Debits != Credits)", async () => {
      const unbalancedLines = [
        {
          accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
          direction: LedgerEntryDirection.DEBIT,
          amountGnf: 500000,
        },
        {
          accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
          direction: LedgerEntryDirection.CREDIT,
          amountGnf: 450000, // 50,000 discrepancy!
        },
      ];

      await expect(
        DoubleEntryLedger.postJournalEntry({
          referenceType: "PARENT_PAYMENT_CLEARING" as any,
          referenceId: "test_ref",
          description: "Unbalanced test",
          postedBy: "TEST",
          lines: unbalancedLines,
        })
      ).rejects.toThrow(LedgerImbalanceError);
    });

    it("rejects journal entries with non-integer or non-positive amounts", async () => {
      const invalidLines = [
        {
          accountCode: STANDARD_ACCOUNTS.PARENT_CLEARING,
          direction: LedgerEntryDirection.DEBIT,
          amountGnf: 0,
        },
        {
          accountCode: STANDARD_ACCOUNTS.CLASSROOM_FUNDS,
          direction: LedgerEntryDirection.CREDIT,
          amountGnf: 0,
        },
      ];

      await expect(
        DoubleEntryLedger.postJournalEntry({
          referenceType: "PARENT_PAYMENT_CLEARING" as any,
          referenceId: "test_ref",
          description: "Zero amount test",
          postedBy: "TEST",
          lines: invalidLines,
        })
      ).rejects.toThrow(FinancialError);
    });
  });

  describe("Financial Audit Data Sanitization", () => {
    it("redacts sensitive credit card and credential keys deeply", () => {
      const payload = {
        transactionId: "tx_12345",
        amountGnf: 500000,
        paymentDetails: {
          cardNumber: "4111111111111111",
          cvv: "123",
          cardHolder: "Ousman Diallo",
          nestedSecret: {
            apiKey: "sk_live_very_secret_998877",
            token: "jwt_bearer_token",
          },
        },
        safeInfo: "Regular description",
      };

      const sanitized = sanitizeFinancialData(payload);

      expect(sanitized.transactionId).toBe("tx_12345");
      expect(sanitized.safeInfo).toBe("Regular description");
      expect(sanitized.paymentDetails.cardNumber).toBe("[REDACTED]");
      expect(sanitized.paymentDetails.cvv).toBe("[REDACTED]");
      expect(sanitized.paymentDetails.cardHolder).toBe("Ousman Diallo");
      expect(sanitized.paymentDetails.nestedSecret.apiKey).toBe("[REDACTED]");
      expect(sanitized.paymentDetails.nestedSecret.token).toBe("[REDACTED]");
    });
  });
});

