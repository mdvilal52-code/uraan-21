import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { submitLead } from '@/lib/crm';
import { isBodyTooLarge, MAX_LEN, tooLong } from '@/lib/security/validate';

// Meta signs each webhook delivery with X-Hub-Signature-256 (HMAC-SHA256 of
// the raw body, keyed by the app secret). Verifying it stops attackers from
// posting forged "inbound messages" that would otherwise become CRM leads.
function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // not configured yet — degrade like the rest of this integration
  if (!signatureHeader) return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Meta verifies the webhook with a GET handshake: echo back hub.challenge
// when hub.verify_token matches WHATSAPP_VERIFY_TOKEN.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && expected && token === expected) {
    return new Response(challenge || '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// Inbound WhatsApp messages POST here. We turn the sender into a CRM lead so
// every chat lands in the pipeline alongside website enquiries.
export async function POST(request: Request) {
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ received: false }, { status: 413 });
  }
  try {
    const rawBody = await request.text();
    if (!isValidSignature(rawBody, request.headers.get('x-hub-signature-256'))) {
      console.warn('[WhatsApp] webhook signature mismatch — rejecting payload.');
      return NextResponse.json({ received: false }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const value = body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message) {
      const from = String(message.from || '').replace(/[^0-9]/g, '');
      const name = String(contact?.profile?.name || (from ? `WhatsApp ${from}` : 'WhatsApp Lead')).slice(
        0,
        MAX_LEN.short
      );
      let text = String(message.text?.body || message.button?.text || `[${message.type || 'message'}]`);
      if (tooLong(text, MAX_LEN.text)) text = text.slice(0, MAX_LEN.text);

      await submitLead({
        name,
        // Placeholder address keyed by number so the CRM de-dupes by sender;
        // map to the real contact email once you collect it.
        email: from ? `wa-${from}@whatsapp.lead` : 'unknown@whatsapp.lead',
        phone: from,
        message: text,
        source: 'WhatsApp',
      });
    }
  } catch (err) {
    console.error('[WhatsApp] webhook error:', err);
  }

  // Always 200 so Meta does not retry-storm the endpoint.
  return NextResponse.json({ received: true });
}
