import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { isBodyTooLarge } from '@/lib/security/validate';

// Meta signs each webhook delivery with X-Hub-Signature-256 (HMAC-SHA256 of
// the raw body, keyed by the app secret). Verifying it stops attackers from
// posting forged "inbound messages" to the endpoint.
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

// Inbound WhatsApp deliveries POST here. The CRM / Leads feature has been
// removed, so inbound messages are simply acknowledged (the signature is still
// verified to reject forged payloads). Add handling here if inbound chats need
// to be processed again in the future.
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
  } catch (err) {
    console.error('[WhatsApp] webhook error:', err);
  }

  // Always 200 so Meta does not retry-storm the endpoint.
  return NextResponse.json({ received: true });
}
