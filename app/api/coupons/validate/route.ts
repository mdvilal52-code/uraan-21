import { NextResponse } from 'next/server';
import { MAX_LEN, checkLengths } from '@/lib/security/validate';
import { checkCoupon } from '@/lib/couponValidation';

// POST → public coupon lookup for checkout ("Apply Coupon"). Unlike GET
// /api/coupons (admin-only — the full discount config isn't public), this
// only reveals whether ONE specific code the customer already typed is
// valid, and by how much it discounts their current order total.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const code = String(body.code || '').trim().toUpperCase();
  const orderTotal = Number(body.orderTotal || 0);

  if (!code) {
    return NextResponse.json({ ok: false, error: 'Please enter a coupon code.' }, { status: 400 });
  }
  const lengthError = checkLengths({ Code: { value: code, max: MAX_LEN.short } });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  const categories: string[] = Array.isArray(body.categories)
    ? (body.categories as unknown[]).map((c) => String(c).toLowerCase())
    : typeof body.category === 'string' && body.category
    ? [String(body.category).toLowerCase()]
    : [];

  const result = await checkCoupon({
    code,
    orderTotal,
    categories,
    phone: typeof body.phone === 'string' ? body.phone : undefined,
    email: typeof body.email === 'string' ? body.email : undefined,
    recordUsage: true,
  });

  if (!result.ok) {
    const status = result.error === 'Invalid coupon code.' ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({
    ok: true,
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    discount: result.discount,
  });
}
