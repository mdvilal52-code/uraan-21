import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetAbandonedCartById, dbMarkReminded } from '@/lib/abandonedCartsDb';
import { sendWhatsAppText } from '@/lib/whatsappServer';

// POST → send a WhatsApp recovery reminder for one abandoned cart (admin only).
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Database not configured.' }, { status: 400 });
  }
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ ok: false, error: 'Invalid cart id.' }, { status: 400 });
  }
  const cart = await dbGetAbandonedCartById(id);
  if (!cart) {
    return NextResponse.json({ ok: false, error: 'Cart not found.' }, { status: 404 });
  }
  if (!cart.phone) {
    return NextResponse.json({ ok: false, error: 'This cart has no phone number to message.' }, { status: 400 });
  }
  if (cart.recovered) {
    return NextResponse.json({ ok: false, error: 'This cart has already been recovered.' }, { status: 400 });
  }

  const itemCount = cart.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const message =
    `Namaste ${cart.name || 'there'}, you left ${itemCount} item(s) worth ₹${cart.total.toLocaleString('en-IN')} ` +
    `in your cart at Om Gauri Putra. Complete your order now before it's gone — we're here if you have any questions!`;

  const result = await sendWhatsAppText(cart.phone, message);
  // `sendWhatsAppText` reports ok:true even when WhatsApp isn't configured
  // (a graceful no-op for callers that can degrade silently) — but here that
  // would mark the reminder as sent and tell the admin it went out when
  // nothing was actually delivered. Require both flags before treating this
  // as a real success.
  if (!result.configured) {
    return NextResponse.json(
      {
        ok: false,
        error: "WhatsApp isn't connected — set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to send reminders.",
      },
      { status: 400 }
    );
  }
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || 'Could not send reminder.' }, { status: 502 });
  }
  await dbMarkReminded(id);
  return NextResponse.json({ ok: true, configured: result.configured });
}
