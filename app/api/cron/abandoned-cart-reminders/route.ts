import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetAbandonedCarts, dbMarkReminded } from '@/lib/abandonedCartsDb';
import { sendWhatsAppText } from '@/lib/whatsappServer';

// GET → automatic WhatsApp recovery reminders for abandoned carts.
// Trigger this route every 2 hours via any external scheduler (GitHub Actions,
// a hosted cron, a VPS crontab, Coolify task, Railway cron, etc.) with:
//   GET /api/cron/abandoned-cart-reminders
//   Authorization: Bearer <CRON_SECRET>
//
// The Authorization header is required so the route can't be triggered by an
// arbitrary public GET request, which would spam customers or run up WhatsApp
// send volume. Set CRON_SECRET to any long random string in your .env.
//
// Only reminds carts that are: unrecovered, have a phone number, are older
// than REMIND_AFTER_MS, and have never been reminded before — one automatic
// nudge per cart. A second/manual follow-up is still available from
// /admin/abandoned-carts ("Send Reminder"), which is unaffected by this.
//
// Requires (see .env.example): CRON_SECRET, plus the same WHATSAPP_TOKEN /
// WHATSAPP_PHONE_NUMBER_ID this app already needs for any WhatsApp send.

const REMIND_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured — refusing to run.' },
      { status: 401 }
    );
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, reminded: 0, checked: 0 });
  }

  const carts = await dbGetAbandonedCarts();
  if (!carts) {
    return NextResponse.json({ ok: false, error: 'Could not load abandoned carts.' }, { status: 502 });
  }

  const cutoff = Date.now() - REMIND_AFTER_MS;
  const due = carts.filter(
    (c) => !c.recovered && c.phone && !c.remindedAt && new Date(c.createdAt).getTime() < cutoff
  );

  let reminded = 0;
  let failed = 0;
  for (const cart of due) {
    const itemCount = cart.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    const message =
      `Namaste ${cart.name || 'there'}, you left ${itemCount} item(s) worth ₹${cart.total.toLocaleString('en-IN')} ` +
      `in your cart at Om Gauri Pooja Gems Jewellery & Rudraksh. Complete your order now before it's gone — we're here if you have any questions!`;
    const result = await sendWhatsAppText(cart.phone!, message);
    if (result.configured && result.ok) {
      await dbMarkReminded(cart.id);
      reminded++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({ ok: true, configured: true, checked: due.length, reminded, failed });
}
