import { NextResponse } from 'next/server';
import { verifyRazorpaySignature, fetchRazorpayPayment } from '@/lib/razorpay';
import { dbInsertOrder, dbGetOrderByPaymentId } from '@/lib/ordersDb';
import { dbAdjustStock } from '@/lib/productsDb';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';
import { notifyAdminNewOrder, notifyCustomerOrderPlaced } from '@/lib/whatsappServer';
import { notify } from '@/lib/notify';
import { resolveCartLines, computeShipping } from '@/lib/orderPricing';
import { checkCoupon } from '@/lib/couponValidation';
import { generateOrderId } from '@/lib/orders';

// POST { razorpay_order_id, razorpay_payment_id, razorpay_signature, order }
// Verifies the payment signature AND cross-checks the actual captured amount
// against Razorpay's own records (never the browser's claim) before ever
// recording an order as paid. Idempotent: replaying the same payment id
// returns the original order instead of minting a duplicate.
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

  const razorpayOrderId = String(body.razorpay_order_id || '');
  const paymentId = String(body.razorpay_payment_id || '');
  const signature = String(body.razorpay_signature || '');

  if (!razorpayOrderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, valid: false, error: 'Missing fields.' }, { status: 400 });
  }

  const valid = verifyRazorpaySignature(razorpayOrderId, paymentId, signature);
  if (!valid) {
    return NextResponse.json({ ok: false, valid: false, error: 'Payment verification failed.' }, { status: 400 });
  }

  // Idempotency: a retried/duplicated client call with the same (already
  // valid) signature must resolve to the one order it already created, not
  // mint a second one.
  const existing = await dbGetOrderByPaymentId(paymentId);
  if (existing) {
    return NextResponse.json({ ok: true, valid: true, orderId: existing.id });
  }

  // Ground truth: ask Razorpay what was actually captured for this payment,
  // rather than trusting anything the browser sent about amount/items.
  const payment = await fetchRazorpayPayment(paymentId);
  if (!payment || payment.order_id !== razorpayOrderId || payment.status !== 'captured') {
    console.error('[verify] payment not captured or mismatched:', paymentId, payment?.status);
    return NextResponse.json({ ok: false, valid: false, error: 'Payment could not be confirmed.' }, { status: 400 });
  }
  const amount = payment.amount / 100;

  const o = (body.order || {}) as Record<string, unknown>;
  const customer = String(o.customer || '');
  const address = o.address ? String(o.address) : '';
  const lengthError = checkLengths({
    Customer: { value: customer, max: MAX_LEN.short },
    Address: { value: address, max: MAX_LEN.text },
  });
  if (lengthError) {
    // Payment is already captured at this point (signature verified above) —
    // a rejection here must still tell the customer their money went
    // through, so support can find the order by payment id.
    console.error('[verify] length validation failed for captured payment:', paymentId, lengthError);
    return NextResponse.json(
      { ok: false, valid: false, error: `${lengthError} Your payment was received — please contact support with payment id ${paymentId} to complete your order.` },
      { status: 400 }
    );
  }

  // Re-derive line items (name/price/image) from the real catalogue for an
  // honest order record — the client only gets to say WHICH products and
  // HOW MANY, never what they cost.
  const resolved = await resolveCartLines(o.items);
  let orderItems: { name: string; quantity: number; price: number; image?: string }[];
  if (resolved.ok) {
    orderItems = resolved.lines.map((l) => ({ name: l.name, price: l.price, quantity: l.quantity, image: l.image }));
    let discount = 0;
    const couponCode = typeof o.couponCode === 'string' ? o.couponCode : '';
    if (couponCode) {
      const categories = Array.from(new Set(resolved.lines.map((l) => l.category).filter(Boolean))) as string[];
      const couponResult = await checkCoupon({
        code: couponCode,
        orderTotal: resolved.subtotal,
        categories,
        phone: typeof o.phone === 'string' ? o.phone : undefined,
        email: typeof o.email === 'string' ? o.email : undefined,
        recordUsage: true,
      });
      if (couponResult.ok) discount = couponResult.discount;
    }
    const expected = Math.max(0, resolved.subtotal + computeShipping(resolved.subtotal) - discount);
    if (Math.abs(expected - amount) > 1) {
      // Doesn't block the order (Razorpay's captured amount is the ground
      // truth for what actually moved) — but this is worth an admin's eyes.
      console.warn('[verify] captured amount differs from recomputed cart total:', { paymentId, amount, expected });
    }
  } else {
    // Client didn't send a resolvable cart (e.g. legacy items shape) — fall
    // back to whatever display items it sent, since the money side of this
    // is already anchored to Razorpay's captured amount regardless.
    const rawItems = Array.isArray(o.items) ? o.items.slice(0, 100) : [];
    orderItems = (rawItems as { name?: unknown; quantity?: unknown; price?: unknown; image?: unknown }[]).map((i) => ({
      name: String(i.name || ''),
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
      image: i.image ? String(i.image) : undefined,
    }));
  }

  const id = generateOrderId();
  const paymentLabel = o.payment ? `${String(o.payment)} · Paid` : 'Paid';
  const phone = o.phone ? String(o.phone) : undefined;
  const saved = await dbInsertOrder({
    id,
    customer,
    email: o.email ? String(o.email) : undefined,
    phone,
    amount,
    items: orderItems,
    payment: paymentLabel,
    status: 'Processing',
    address: address || undefined,
    paid: true,
    paymentId,
  });
  if (!saved) {
    // Could be a genuine failure, or a concurrent request for the same
    // payment id that won the insert race first (the DB's unique index on
    // payment_id would reject this one) — check before reporting an error.
    const raced = await dbGetOrderByPaymentId(paymentId);
    if (raced) {
      return NextResponse.json({ ok: true, valid: true, orderId: raced.id });
    }
    console.error('[verify] save order failed for captured payment:', paymentId);
    return NextResponse.json(
      { ok: false, valid: false, error: 'Payment succeeded but the order could not be saved. Please contact support with your payment id.' },
      { status: 502 }
    );
  }

  // Best-effort stock decrement — never fails the payment response.
  if (resolved.ok) {
    for (const line of resolved.lines) {
      dbAdjustStock(line.id, -line.quantity, `Order ${id}`, 'system').catch(() => {});
    }
  }

  // Best-effort notifications — never fail the payment response.
  notifyAdminNewOrder({
    orderId: id,
    customer,
    amount,
    payment: paymentLabel,
    items: orderItems.map((i) => ({ name: i.name, quantity: i.quantity })),
  }).catch(() => {});
  if (phone) {
    notifyCustomerOrderPlaced(phone, id, amount).catch(() => {});
  }
  notify('new_order', `${customer} placed order ${id} for ₹${amount.toLocaleString('en-IN')}.`, {
    link: `/admin/orders/${id}`,
  }).catch(() => {});
  notify('payment_received', `Payment received for order ${id} (₹${amount.toLocaleString('en-IN')}, online).`, {
    link: `/admin/orders/${id}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, valid: true, orderId: id });
}
