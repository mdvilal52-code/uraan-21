import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetAbandonedCarts, dbInsertAbandonedCart } from '@/lib/abandonedCartsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';
import { normalizePhone } from '@/lib/phone';

const MAX_ITEMS = 100;

// GET → list abandoned carts (admin only — contains customer PII).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, carts: [] });
  }
  const carts = await dbGetAbandonedCarts();
  return NextResponse.json({ ok: true, configured: true, carts: carts || [] });
}

type CartItem = { name?: unknown; quantity?: unknown; price?: unknown };

// POST → best-effort capture of an in-progress checkout (public — called from
// the checkout page once the customer has entered contact info). Never blocks
// or alters checkout: silently accepts even when the DB isn't configured.
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

  const name = String(body.name || '').trim();
  const rawPhone = String(body.phone || '').trim();
  const phone = rawPhone ? normalizePhone(rawPhone) || rawPhone : '';
  const email = String(body.email || '').trim();
  const items = Array.isArray(body.items) ? (body.items as CartItem[]) : [];
  const total = Number(body.total || 0);

  if ((!phone && !email) || !items.length) {
    return NextResponse.json({ ok: false, error: 'Incomplete cart.' }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json({ ok: false, error: `Carts are limited to ${MAX_ITEMS} items.` }, { status: 400 });
  }

  const lengthError =
    checkLengths({
      Name: { value: name, max: MAX_LEN.short },
      Phone: { value: phone, max: MAX_LEN.short },
      Email: { value: email, max: MAX_LEN.short },
    }) || items.map((i) => checkLengths({ 'Item name': { value: String(i.name || ''), max: MAX_LEN.short } })).find(Boolean);
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const saved = await dbInsertAbandonedCart({
    name: name || undefined,
    phone: phone || undefined,
    email: email || undefined,
    items: items.map((i) => ({
      name: String(i.name || ''),
      quantity: Number(i.quantity || 1),
      price: Number(i.price || 0),
    })),
    total,
  });

  if (!saved) {
    return NextResponse.json({ ok: false, error: 'Could not save cart.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, configured: true, cart: saved });
}
