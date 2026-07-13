// Strong-password policy (#8) + Argon2id hashing (#7) used for the password
// history check (#9). Note: the *primary* auth password is hashed by Supabase
// Auth (bcrypt); we additionally store an Argon2id hash of each chosen password
// in password_history so a new password can be rejected if it matches a recent
// one. hash-wasm is pure WebAssembly, so it runs on Node and Vercel.
import { argon2id, argon2Verify } from 'hash-wasm';

export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireLower: true,
  requireUpper: true,
  requireNumber: true,
  requireSymbol: true,
  historyDepth: 5, // cannot reuse the last N passwords
  maxAgeDays: 90, // expiry option (#10)
};

const COMMON = new Set([
  'password', 'password1', '123456', '12345678', '123456789', 'qwerty', 'qwerty123',
  'admin', 'admin123', 'letmein', 'welcome', 'iloveyou', 'omgauri2024', 'changeme',
]);

export function validatePassword(pw: string, opts?: { email?: string }): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (pw.length < PASSWORD_POLICY.minLength) errors.push(`At least ${PASSWORD_POLICY.minLength} characters.`);
  if (pw.length > PASSWORD_POLICY.maxLength) errors.push(`At most ${PASSWORD_POLICY.maxLength} characters.`);
  if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(pw)) errors.push('A lowercase letter.');
  if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(pw)) errors.push('An uppercase letter.');
  if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(pw)) errors.push('A number.');
  if (PASSWORD_POLICY.requireSymbol && !/[^A-Za-z0-9]/.test(pw)) errors.push('A symbol (e.g. ! @ # $).');
  if (COMMON.has(pw.toLowerCase())) errors.push('Too common — choose something unique.');
  const local = (opts?.email || '').split('@')[0].toLowerCase();
  if (local.length >= 4 && pw.toLowerCase().includes(local)) errors.push('Must not contain your email name.');
  return { ok: errors.length === 0, errors };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 19456, // ~19 MiB (OWASP argon2id guidance)
    hashLength: 32,
    outputType: 'encoded',
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}
