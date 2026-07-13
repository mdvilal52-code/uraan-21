import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetOrders, dbInsertOrder } from '@/lib/ordersDb';
import { dbAdjustStock } from '@/lib/productsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';
import { notifyAdminNewOrder, notifyCustomerOrderPlaced } from '@/lib/whatsappServer';
import { normalizePhone } from '@/lib/phone';
import { notify } from '@/lib/notify';
import { resolveCartLines, computeShipping } from '@/lib/orderPricing';
import { checkCoupon } from '@/lib/couponValidation';

// GET → list orders from the database (admin only — contains customer PII).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, orders: [] });
  }
  const orders = await dbGetOrders();
  return NextResponse.json({ ok: true, configured: true, orders: orders || [] });
}

// POST → record a placed order (from checkout). This is the COD / no-gateway
// path — it can NEVER be used to record an order as paid. A "paid" order can
// only ever be created by /api/payment/verify after a real signature check,
// so `paid` and `paymentId` here are always forced, regardless of what the
// request body claims.
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

  const id = String(body.id || '').trim();
  const customer = String(body.customer || '').trim();

  if (!id || !customer) {
    return NextResponse.json({ ok: false, error: 'Incomplete order.' }, { status: 400 });
  }

  const email = String(body.email || '').trim();
  const rawPhone = String(body.phone || '').trim();
  const phone = normalizePhone(rawPhone) || rawPhone;
  const payment = String(body.payment || '').trim();
  const status = String(body.status || 'Processing').trim();
  const address = String(body.address || '').trim();
  const lengthError = checkLengths({
    'Order id': { value: id, max: MAX_LEN.short },
    Customer: { value: customer, max: MAX_LEN.short },
    Email: { value: email, max: MAX_LEN.short },
    Address: { value: address, max: MAX_LEN.text },
    Status: { value: status, max: MAX_LEN.short },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  // No DB yet: accept silently so checkout still succeeds (nothing to price
  // against either — the same demo fallback the rest of the app uses).
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const resolved = await resolveCartLines(body.items);
  if (!resolved.ok) {
    return NextResponse.json({ ok: false, error: resolved.error }, { status: 400 });
  }
  if (resolved.lines.length > 100) {
    return NextResponse.json({ ok: false, error: 'Orders are limited to 100 items.' }, { status: 400 });
  }

  let discount = 0;
  const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim() : '';
  if (couponCode) {
    const categories = Array.from(new Set(resolved.lines.map((l) => l.category).filter(Boolean))) as string[];
    const couponResult = await checkCoupon({
      code: couponCode,
      orderTotal: resolved.subtotal,
      categories,
      phone,
      email,
      recordUsage: true,
    });
    if (!couponResult.ok) {
      // Reject rather than silently dropping the discount — see the same
      // reasoning in /api/payment/create-order.
      return NextResponse.json({ ok: false, error: couponResult.error }, { status: 400 });
    }
    discount = couponResult.discount;
  }
  const amount = Math.max(0, resolved.subtotal + computeShipping(resolved.subtotal) - discount);

  const saved = await dbInsertOrder({
    id,
    customer,
    email: email || undefined,
    phone: phone || undefined,
    amount,
    items: resolved.lines.map((l) => ({ name: l.name, quantity: l.quantity, price: l.price, image: l.image })),
    payment: payment || undefined,
    status,
    address: address || undefined,
    paid: false,
    paymentId: undefined,
  });

  if (!saved) {
    return NextResponse.json({ ok: false, error: 'Could not save order.' }, { status: 502 });
  }

  // Best-effort stock decrement — never fails the order response.
  for (const line of resolved.lines) {
    dbAdjustStock(line.id, -line.quantity, `Order ${id}`, 'system').catch(() => {});
  }

  // Best-effort notifications — never fail the order response.
  notifyAdminNewOrder({
    orderId: id,
    customer,
    amount,
    payment: payment || 'COD',
    items: resolved.lines.map((l) => ({ name: l.name, quantity: l.quantity })),
  }).catch(() => {});
  if (phone) {
    notifyCustomerOrderPlaced(phone, id, amount).catch(() => {});
  }

  notify('new_order', `${customer} placed order ${id} for ₹${amount.toLocaleString('en-IN')}.`, {
    link: `/admin/orders/${id}`,
  }).catch(() => {});

  return NextResponse.json({ ok: true, configured: true });
}
