import { describe, it, expect } from "vitest";
import {
  validateGuineaPhoneNumber,
  validateChannelCompatibility,
  getUssdPaymentInstructions,
} from "@/lib/finance/phone-validation";

describe("Guinea Phone Number Validation & Carrier Detection", () => {
  describe("validateGuineaPhoneNumber", () => {
    it("validates and normalizes Orange Guinée numbers (61x, 62x)", () => {
      // National format with spaces
      const res1 = validateGuineaPhoneNumber("622 12 34 56");
      expect(res1.isValid).toBe(true);
      expect(res1.operator).toBe("ORANGE_MONEY_GN");
      expect(res1.operatorName).toBe("Orange Guinée");
      expect(res1.e164).toBe("+224622123456");

      // International format with +224
      const res2 = validateGuineaPhoneNumber("+224 610 99 88 77");
      expect(res2.isValid).toBe(true);
      expect(res2.operator).toBe("ORANGE_MONEY_GN");
      expect(res2.e164).toBe("+224610998877");

      // International format with 00224
      const res3 = validateGuineaPhoneNumber("00224628112233");
      expect(res3.isValid).toBe(true);
      expect(res3.operator).toBe("ORANGE_MONEY_GN");
      expect(res3.e164).toBe("+224628112233");
    });

    it("validates and normalizes MTN Guinée numbers (65x, 66x)", () => {
      const res1 = validateGuineaPhoneNumber("664 12 34 56");
      expect(res1.isValid).toBe(true);
      expect(res1.operator).toBe("MTN_MOMO_GN");
      expect(res1.operatorName).toBe("MTN Guinée");
      expect(res1.e164).toBe("+224664123456");

      const res2 = validateGuineaPhoneNumber("+224 655 44 33 22");
      expect(res2.isValid).toBe(true);
      expect(res2.operator).toBe("MTN_MOMO_GN");
      expect(res2.e164).toBe("+224655443322");
    });

    it("rejects phone numbers with invalid length", () => {
      const short = validateGuineaPhoneNumber("622 12 34");
      expect(short.isValid).toBe(false);
      expect(short.error).toContain("exactement 9 chiffres");

      const long = validateGuineaPhoneNumber("622 12 34 56 78");
      expect(long.isValid).toBe(false);
      expect(long.error).toContain("exactement 9 chiffres");
    });

    it("rejects phone numbers not starting with 6", () => {
      const invalidStart = validateGuineaPhoneNumber("522 12 34 56");
      expect(invalidStart.isValid).toBe(false);
      expect(invalidStart.error).toContain("commencent obligatoirement par le chiffre 6");
    });

    it("rejects non-numeric characters", () => {
      const letters = validateGuineaPhoneNumber("622 12 AB CD");
      expect(letters.isValid).toBe(false);
      expect(letters.error).toContain("que des chiffres");
    });

    it("accepts all 9-digit 6xx numbers (e.g. 63x, 64x) and categorizes as OTHER_GN for gateway routing", () => {
      const unassigned = validateGuineaPhoneNumber("634 12 34 56");
      expect(unassigned.isValid).toBe(true);
      expect(unassigned.operator).toBe("OTHER_GN");
      expect(unassigned.warning).toContain("Opérateur non identifié");
    });
  });

  describe("validateChannelCompatibility", () => {
    it("approves compatible carrier-channel combinations", () => {
      const orangeOk = validateChannelCompatibility("622 00 11 22", "ORANGE_MONEY");
      expect(orangeOk.isCompatible).toBe(true);
      expect(orangeOk.validation.operator).toBe("ORANGE_MONEY_GN");

      const mtnOk = validateChannelCompatibility("664 00 11 22", "MTN_MOMO");
      expect(mtnOk.isCompatible).toBe(true);
      expect(mtnOk.validation.operator).toBe("MTN_MOMO_GN");
    });

    it("rejects incompatible carrier-channel combinations with clear explanation", () => {
      // User selected Orange Money but gave MTN number
      const orangeWithMtn = validateChannelCompatibility("664 00 11 22", "ORANGE_MONEY");
      expect(orangeWithMtn.isCompatible).toBe(false);
      expect(orangeWithMtn.errorMessage).toContain("MTN Guinée");
      expect(orangeWithMtn.errorMessage).toContain("veuillez saisir un numéro Orange Guinée");

      // User selected MTN MoMo but gave Orange number
      const mtnWithOrange = validateChannelCompatibility("622 00 11 22", "MTN_MOMO");
      expect(mtnWithOrange.isCompatible).toBe(false);
      expect(mtnWithOrange.errorMessage).toContain("Orange Guinée");
      expect(mtnWithOrange.errorMessage).toContain("veuillez saisir un numéro MTN Guinée");
    });
  });

  describe("getUssdPaymentInstructions", () => {
    it("generates clear French carrier prompt instructions for Orange Money without unverified USSD codes", () => {
      const instructions = getUssdPaymentInstructions("ORANGE_MONEY", 800000);
      expect(instructions.length).toBeGreaterThanOrEqual(4);
      expect(instructions.join(" ")).not.toContain("#144#");
      expect(instructions.join(" ")).toContain("Orange Money");
      expect(instructions.join(" ")).toContain("800");
    });

    it("generates clear French carrier prompt instructions for MTN MoMo without unverified USSD codes", () => {
      const instructions = getUssdPaymentInstructions("MTN_MOMO", 800000);
      expect(instructions.length).toBeGreaterThanOrEqual(4);
      expect(instructions.join(" ")).not.toContain("*440#");
      expect(instructions.join(" ")).toContain("MTN Mobile Money");
    });
  });
});

