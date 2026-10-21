import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt with 12 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number; // 0 to 4
  errors: string[];
}

/**
 * Validates password strength according to enterprise security standards:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special symbol
 */
export function validatePasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else errors.push("Le mot de passe doit comporter au moins 8 caractères.");

  if (/[A-Z]/.test(password)) score++;
  else errors.push("Le mot de passe doit contenir au moins une lettre majuscule.");

  if (/[a-z]/.test(password)) score++;
  else errors.push("Le mot de passe doit contenir au moins une lettre minuscule.");

  if (/[0-9]/.test(password)) score++;
  else errors.push("Le mot de passe doit contenir au moins un chiffre.");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else errors.push("Le mot de passe doit contenir au moins un caractère spécial.");

  return {
    isValid: errors.length === 0,
    score,
    errors,
  };
}
