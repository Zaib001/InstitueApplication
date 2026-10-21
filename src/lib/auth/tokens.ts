import crypto from "crypto";

/**
 * Generates a high-entropy random token and its SHA-256 hash.
 * The plain token is sent to the user (e.g. via email link), while only the hash is stored in the database.
 */
export function generateSecureResetToken(): { plainToken: string; tokenHash: string } {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(plainToken);
  return { plainToken, tokenHash };
}

/**
 * Computes the SHA-256 hash of a plain token string.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
