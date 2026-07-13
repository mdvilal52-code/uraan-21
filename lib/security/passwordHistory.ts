// Password history (#9) + expiry (#10), backed by Supabase (service role).
// Stores Argon2id hashes only; the new password is checked against the most
// recent N hashes to block reuse. Fail-safe: any DB error degrades to "not
// reused / not expired" rather than blocking a legitimate change.
import { getSupabase } from '../supabase';
import { verifyPassword, PASSWORD_POLICY } from './password';

export async function recordPasswordHash(email: string, passwordHash: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('password_history').insert({ email: email.toLowerCase(), password_hash: passwordHash });
  } catch {
    /* ignore */
  }
}

export async function isPasswordReused(email: string, candidate: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { data } = await sb
      .from('password_history')
      .select('password_hash')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(PASSWORD_POLICY.historyDepth);
    const hashes = (data as { password_hash: string }[] | null) || [];
    for (const row of hashes) {
      if (await verifyPassword(candidate, row.password_hash)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function markPasswordChanged(email: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('admin_users').update({ password_changed_at: new Date().toISOString() }).ilike('email', email);
  } catch {
    /* ignore */
  }
}

/** Returns { changedAt, expired } for the account, or null when unknown. */
export async function passwordAge(email: string): Promise<{ changedAt: string | null; expired: boolean } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb.from('admin_users').select('password_changed_at').ilike('email', email).maybeSingle();
    const changedAt = (data?.password_changed_at as string | null) ?? null;
    if (!changedAt) return { changedAt: null, expired: false };
    const ageMs = Date.now() - new Date(changedAt).getTime();
    const expired = ageMs > PASSWORD_POLICY.maxAgeDays * 24 * 60 * 60 * 1000;
    return { changedAt, expired };
  } catch {
    return null;
  }
}
