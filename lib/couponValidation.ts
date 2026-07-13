// Shared server-side coupon validation + discount computation. Used by both
// POST /api/coupons/validate (the checkout "Apply Coupon" button) and
// /api/payment/create-order (which must recompute the authoritative order
// total server-side and cannot trust a client-supplied discount amount).
// Keeping this in one place means both call sites can never disagree about
// whether a coupon is valid or how much it's worth.
import { isSupabaseConfigured, getSupabase } from './supabase';
import { dbGetCoupons, dbIncrementCouponUsage } from './couponsDb';
import { getCoupons as getSeedCoupons } from './coupons';
import type { Coupon } from './coupons';

export type CouponCheckInput = {
  code: string;
  orderTotal: number;
  categories?: string[];
  phone?: string;
  email?: string;
  // The "Apply Coupon" button records a usage on every successful apply
  // (a pre-existing, documented limitation — see app/api/coupons/validate).
  // The payment/create-order recompute must NOT record a second usage for
  // the same checkout, so it passes false here.
  recordUsage: boolean;
};

export type CouponCheckResult =
  | { ok: true; coupon: Coupon; discount: number }
  | { ok: false; error: string };

async function hasPriorOrder(phone: string, email: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  if (!phone && !email) return false;
  const query = sb.from('orders').select('id', { count: 'exact', head: true });
  const { count, error } = phone
    ? await query.eq('phone', phone)
    : await query.ilike('email', email);
  if (error) {
    console.error('[couponValidation] priorOrder check:', error.message);
    return false;
  }
  return (count || 0) > 0;
}

function isExpired(validUntil: string): boolean {
  if (!validUntil) return false;
  const d = new Date(validUntil);
  if (Number.isNaN(d.getTime())) return false;
  d.setHours(23, 59, 59, 999);
  return d.getTime() < Date.now();
}

export async function checkCoupon(input: CouponCheckInput): Promise<CouponCheckResult> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: 'Please enter a coupon code.' };

  const configured = isSupabaseConfigured();
  const list = configured ? (await dbGetCoupons()) || [] : getSeedCoupons();
  const coupon = list.find((c) => c.code.toUpperCase() === code);

  if (!coupon) return { ok: false, error: 'Invalid coupon code.' };
  if (!coupon.active) return { ok: false, error: 'This coupon is no longer active.' };
  if (isExpired(coupon.validUntil)) return { ok: false, error: 'This coupon has expired.' };
  if (coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit) {
    return { ok: false, error: 'This coupon has reached its usage limit.' };
  }
  if (input.orderTotal < coupon.minOrder) {
    return {
      ok: false,
      error: `Add ₹${(coupon.minOrder - input.orderTotal).toLocaleString('en-IN')} more to your cart to use this coupon (minimum order ₹${coupon.minOrder.toLocaleString('en-IN')}).`,
    };
  }

  if (coupon.category) {
    const categories = (input.categories || []).map((c) => c.toLowerCase());
    if (categories.length > 0 && !categories.includes(coupon.category.toLowerCase())) {
      return { ok: false, error: `This coupon only applies to ${coupon.category} products.` };
    }
  }

  if (coupon.firstOrderOnly) {
    const phone = (input.phone || '').trim();
    const email = (input.email || '').trim().toLowerCase();
    if (!phone && !email) {
      return { ok: false, error: 'Please enter your phone or email to use this coupon.' };
    }
    if (configured) {
      const alreadyOrdered = await hasPriorOrder(phone, email);
      if (alreadyOrdered) {
        return { ok: false, error: 'This coupon is valid for first-time customers only.' };
      }
    }
  }

  const discount =
    coupon.type === 'percent'
      ? Math.round((input.orderTotal * coupon.value) / 100)
      : Math.min(coupon.value, input.orderTotal);

  // Best-effort usage counter — tracks applications, not confirmed orders
  // (a customer who applies then abandons checkout still counts here).
  if (configured && input.recordUsage) {
    dbIncrementCouponUsage(coupon.id).then((incremented) => {
      if (!incremented) console.warn('[couponValidation] usage limit race for', coupon.id);
    }).catch(() => {});
  }

  return { ok: true, coupon, discount };
}
