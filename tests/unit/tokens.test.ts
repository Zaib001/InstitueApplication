import { describe, it, expect } from "vitest";
import { generateSecureResetToken, hashToken } from "@/lib/auth/tokens";

describe("Cryptographic Token Security", () => {
  it("generates distinct high-entropy tokens on each invocation", () => {
    const token1 = generateSecureResetToken();
    const token2 = generateSecureResetToken();

    expect(token1.plainToken).not.toBe(token2.plainToken);
    expect(token1.tokenHash).not.toBe(token2.tokenHash);
    expect(token1.plainToken.length).toBe(64); // 32 bytes hex = 64 chars
    expect(token1.tokenHash.length).toBe(64); // SHA-256 = 64 chars
  });

  it("produces deterministic SHA-256 hashes", () => {
    const plain = "static_test_token_entropy_guinea_2026";
    const hash1 = hashToken(plain);
    const hash2 = hashToken(plain);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(plain);
  });
});
