// Rate limiting + brute-force protection + account lockout, backed by Supabase
// (login_attempts + account_locks). Designed FAIL-OPEN: any DB error allows the
// login to proceed, so a database hiccup can never lock a legitimate admin out.
// Thresholds are deliberately conservative and easy to tune here.
import { getSupabase } from '../supabase';

const WINDOW_MS = 15 * 60 * 1000;   // sliding window for counting failures
const MAX_FAILS = 5;                // failures in window -> temporary lock
const TEMP_LOCK_MS = 15 * 60 * 1000; // temporary lock duration
const PERMA_FAILS = 20;             // total failures -> permanent lock (manual unlock)

export type LockState = { locked: boolean; until?: Date; permanent?: boolean };

export async function checkLockout(email: string): Promise<LockState> {
  const sb = getSupabase();
  const key = (email || '').toLowerCase();
  if (!sb || !key) return { locked: false };
  try {
    const { data } = await sb.from('account_locks').select('*').eq('email', key).maybeSingle();
    if (!data) return { locked: false };
    if (data.permanent) return { locked: true, permanent: true };
    if (data.locked_until && new Date(data.locked_until) > new Date()) {
      return { locked: true, until: new Date(data.locked_until) };
    }
    return { locked: false };
  } catch {
    return { locked: false }; // fail-open
  }
}

export async function recordAttempt(a: {
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  reason?: string;
}): Promise<{ lockedNow: boolean; permanent: boolean }> {
  const sb = getSupabase();
  const key = (a.email || '').toLowerCase();
  if (!sb) return { lockedNow: false, permanent: false };
  try {
    await sb.from('login_attempts').insert({
      email: key,
      ip: a.ip,
      user_agent: a.userAgent,
      success: a.success,
      reason: a.reason || null,
    });

    if (a.success) {
      // Successful login clears any temporary lock for this account.
      await sb.from('account_locks').delete().eq('email', key).eq('permanent', false);
      return { lockedNow: false, permanent: false };
    }

    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    // Permanent lock is based on failures since the last *successful* login, so
    // a forgetful admin who eventually logs in never accumulates toward it.
    const { data: lastOk } = await sb
      .from('login_attempts')
      .select('created_at')
      .eq('email', key)
      .eq('success', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sinceSuccess = lastOk?.created_at || new Date(0).toISOString();

    const [{ count: recent }, { count: sinceOk }] = await Promise.all([
      sb.from('login_attempts').select('*', { count: 'exact', head: true }).eq('email', key).eq('success', false).gte('created_at', since),
      sb.from('login_attempts').select('*', { count: 'exact', head: true }).eq('email', key).eq('success', false).gt('created_at', sinceSuccess),
    ]);

    if ((sinceOk ?? 0) >= PERMA_FAILS) {
      await sb.from('account_locks').upsert({
        email: key,
        permanent: true,
        reason: 'too_many_total_failures',
        updated_at: new Date().toISOString(),
      });
      return { lockedNow: true, permanent: true };
    }
    if ((recent ?? 0) >= MAX_FAILS) {
      await sb.from('account_locks').upsert({
        email: key,
        locked_until: new Date(Date.now() + TEMP_LOCK_MS).toISOString(),
        permanent: false,
        reason: 'too_many_failures',
        updated_at: new Date().toISOString(),
      });
      return { lockedNow: true, permanent: false };
    }
    return { lockedNow: false, permanent: false };
  } catch {
    return { lockedNow: false, permanent: false }; // fail-open
  }
}

export const RATE_LIMIT_CONFIG = { WINDOW_MS, MAX_FAILS, TEMP_LOCK_MS, PERMA_FAILS };
