import { NextResponse } from 'next/server';
import { isRazorpayConfigured, createRazorpayOrder, razorpayKeyId } from '@/lib/razorpay';
import { isBodyTooLarge } from '@/lib/security/validate';
import { resolveCartLines, computeShipping } from '@/lib/orderPricing';
import { checkCoupon } from '@/lib/couponValidation';

// POST { items: [{ id, quantity }], couponCode? } → creates a Razorpay order
// for the AUTHORITATIVE total computed here from the real product catalogue
// (+ a re-validated coupon), never from a client-supplied amount. This is
// what actually gets charged, so it can't be manipulated from the browser.
export async function POST(request: Request) {
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const resolved = await resolveCartLines(body.items);
  if (!resolved.ok) {
    return NextResponse.json({ ok: false, error: resolved.error }, { status: 400 });
  }

  const shipping = computeShipping(resolved.subtotal);
  let discount = 0;
  const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim() : '';
  if (couponCode) {
    const categories = Array.from(new Set(resolved.lines.map((l) => l.category).filter(Boolean))) as string[];
    const couponResult = await checkCoupon({
      code: couponCode,
      orderTotal: resolved.subtotal,
      categories,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
      email: typeof body.email === 'string' ? body.email : undefined,
      recordUsage: false,
    });
    if (!couponResult.ok) {
      // Reject rather than silently dropping the discount — the customer
      // already saw this coupon applied on the checkout page (from the
      // earlier /api/coupons/validate call); charging them the full amount
      // without a word would be a silent bait-and-switch. Rare in practice
      // (requires the coupon to become invalid in the few seconds between
      // "Apply" and "Place Order" — e.g. another customer just hit its
      // usage limit) but worth a clear error over a surprise charge.
      return NextResponse.json({ ok: false, error: couponResult.error }, { status: 400 });
    }
    discount = couponResult.discount;
  }

  const amount = Math.max(0, resolved.subtotal + shipping - discount);
  if (amount < 1) {
    return NextResponse.json({ ok: false, error: 'Invalid amount.' }, { status: 400 });
  }

  // No keys yet: tell the client to fall back to a direct (demo) order.
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const order = await createRazorpayOrder(Math.round(amount * 100), 'rcpt_' + Date.now());
  if (!order) {
    return NextResponse.json({ ok: false, error: 'Could not start payment.' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: razorpayKeyId(),
  });
}
