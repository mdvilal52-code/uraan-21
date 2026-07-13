// Email OTP codes (#4), stored only as Argon2id hashes with a 10-minute expiry.
// Used for new-device approval and email verification. Fail-safe.
import { getSupabase } from '../supabase';
import { hashPassword, verifyPassword } from './password';

const TTL_MS = 10 * 60 * 1000;

/** Creates a 6-digit code, stores its hash, and returns the plaintext to email. */
export async function createOtp(email: string, purpose: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  try {
    const codeHash = await hashPassword(code);
    await sb.from('email_otps').insert({
      email: email.toLowerCase(),
      purpose,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    });
    return code;
  } catch {
    return null;
  }
}

/** Verifies the latest unexpired code for (email, purpose); consumes it on success. */
export async function verifyOtp(email: string, purpose: string, code: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data } = await sb
      .from('email_otps')
      .select('id,code_hash,expires_at')
      .eq('email', email.toLowerCase())
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return false;
    if (new Date(data.expires_at as string) < new Date()) return false;
    const ok = await verifyPassword(code.trim(), data.code_hash as string);
    if (ok) await sb.from('email_otps').delete().eq('id', data.id);
    return ok;
  } catch {
    return false;
  }
}
