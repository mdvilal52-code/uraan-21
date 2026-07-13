// Trusted-device tracking for device verification (#5) + new-device approval
// (#6). Fail-safe: DB errors degrade to "unknown device" without throwing.
import { getSupabase } from '../supabase';

export type DeviceInput = {
  email: string;
  fingerprint: string;
  browser?: string;
  os?: string;
  ip?: string;
  approved?: boolean;
};

export async function findDevice(email: string, fingerprint: string): Promise<{ approved: boolean } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from('trusted_devices')
      .select('approved')
      .eq('email', email.toLowerCase())
      .eq('fingerprint', fingerprint)
      .maybeSingle();
    return data ? { approved: Boolean(data.approved) } : null;
  } catch {
    return null;
  }
}

export async function upsertDevice(input: DeviceInput): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const row: Record<string, unknown> = {
      email: input.email.toLowerCase(),
      fingerprint: input.fingerprint,
      browser: input.browser ?? null,
      os: input.os ?? null,
      ip: input.ip ?? null,
      last_seen_at: new Date().toISOString(),
    };
    if (input.approved !== undefined) row.approved = input.approved;
    await sb.from('trusted_devices').upsert(row, { onConflict: 'email,fingerprint' });
  } catch {
    /* ignore */
  }
}

export async function approveDevice(email: string, fingerprint: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb
      .from('trusted_devices')
      .update({ approved: true })
      .eq('email', email.toLowerCase())
      .eq('fingerprint', fingerprint);
  } catch {
    /* ignore */
  }
}
