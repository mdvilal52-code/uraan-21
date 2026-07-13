// Server-side coupon persistence (Supabase). Returns null / false when the DB
// is not configured (or the table is missing) so callers fall back to the
// in-browser store. Mirrors lib/leadsDb.ts.
import { getSupabase } from './supabase';
import type { Coupon, CouponType, CouponInput } from './coupons';

type Row = {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  usage_limit: number;
  used: number | null;
  valid_until: string | null;
  active: boolean;
  first_order_only: boolean | null;
  category: string | null;
};

function toCoupon(r: Row): Coupon {
  return {
    id: r.id,
    code: r.code,
    type: (r.type === 'flat' ? 'flat' : 'percent') as CouponType,
    value: r.value,
    minOrder: r.min_order,
    usageLimit: r.usage_limit,
    used: r.used ?? 0,
    validUntil: r.valid_until || '',
    active: r.active,
    firstOrderOnly: Boolean(r.first_order_only),
    category: r.category || undefined,
  };
}

export async function dbGetCoupons(): Promise<Coupon[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('coupons').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[couponsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toCoupon);
}

export async function dbInsertCoupon(input: CouponInput): Promise<Coupon | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const id = 'CP' + Date.now().toString(36).toUpperCase();
  const { data, error } = await sb
    .from('coupons')
    .insert({
      id,
      code: input.code.trim().toUpperCase(),
      type: input.type,
      value: Number(input.value) || 0,
      min_order: Number(input.minOrder) || 0,
      usage_limit: Number(input.usageLimit) || 0,
      used: 0,
      valid_until: input.validUntil.trim(),
      active: true,
      first_order_only: Boolean(input.firstOrderOnly),
      category: input.category?.trim() || null,
    })
    .select()
    .single();
  if (error) {
    console.error('[couponsDb] insert:', error.message);
    return null;
  }
  return toCoupon(data as Row);
}

export async function dbUpdateCoupon(id: string, patch: Partial<Coupon>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const row: Record<string, unknown> = {};
  if (patch.code !== undefined) row.code = patch.code.trim().toUpperCase();
  if (patch.type !== undefined) row.type = patch.type;
  if (patch.value !== undefined) row.value = patch.value;
  if (patch.minOrder !== undefined) row.min_order = patch.minOrder;
  if (patch.usageLimit !== undefined) row.usage_limit = patch.usageLimit;
  if (patch.used !== undefined) row.used = patch.used;
  if (patch.validUntil !== undefined) row.valid_until = patch.validUntil;
  if (patch.active !== undefined) row.active = patch.active;
  if (patch.firstOrderOnly !== undefined) row.first_order_only = patch.firstOrderOnly;
  if (patch.category !== undefined) row.category = patch.category || null;
  const { error } = await sb.from('coupons').update(row).eq('id', id);
  if (error) {
    console.error('[couponsDb] update:', error.message);
    return false;
  }
  return true;
}

// Atomic "used = used + 1, but only if still under the limit" — a plain
// read-then-write (fetch `used`, PATCH `used + 1`) loses updates when two
// checkouts apply the same coupon concurrently. Backed by the
// increment_coupon_usage() SQL function (supabase/schema.sql) so the
// check-and-increment happens in one statement. Returns false if the coupon
// was already at its usage limit (a genuine, if rare, race — the caller
// already decided to grant the discount for this request, so this is
// logged rather than retroactively rejected).
export async function dbIncrementCouponUsage(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data, error } = await sb.rpc('increment_coupon_usage', { p_id: id });
  if (error) {
    console.error('[couponsDb] incrementUsage:', error.message);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}

export async function dbDeleteCoupon(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('coupons').delete().eq('id', id);
  if (error) {
    console.error('[couponsDb] delete:', error.message);
    return false;
  }
  return true;
}
