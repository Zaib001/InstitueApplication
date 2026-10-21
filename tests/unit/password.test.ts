import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/auth/password";

describe("Password Security & Hashing", () => {
  it("hashes password with bcrypt and never returns plaintext", async () => {
    const plain = "Securite2026!Guinee";
    const hashed = await hashPassword(plain);

    expect(hashed).not.toBe(plain);
    expect(hashed).toMatch(/^\$2[aby]\$\d+\$/); // Valid bcrypt hash signature
  });

  it("verifies correct password against hash", async () => {
    const plain = "ConakryExcellence2026!";
    const hashed = await hashPassword(plain);

    const isValid = await verifyPassword(plain, hashed);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect password against hash", async () => {
    const plain = "CorrectPassword123!";
    const wrong = "WrongPassword456!";
    const hashed = await hashPassword(plain);

    const isValid = await verifyPassword(wrong, hashed);
    expect(isValid).toBe(false);
  });

  it("validates enterprise password strength criteria", () => {
    // Too short
    expect(validatePasswordStrength("Short1!").isValid).toBe(false);

    // Missing uppercase
    expect(validatePasswordStrength("lowercase123!").isValid).toBe(false);

    // Missing lowercase
    expect(validatePasswordStrength("UPPERCASE123!").isValid).toBe(false);

    // Missing digit
    expect(validatePasswordStrength("NoDigitsHere!").isValid).toBe(false);

    // Strong password meeting all criteria
    const strong = validatePasswordStrength("MonsieurFanyi2026!Securise");
    expect(strong.isValid).toBe(true);
    expect(strong.score).toBe(5);
    expect(strong.errors.length).toBe(0);
  });
});
