import { NextResponse } from 'next/server';
import { sendWhatsAppText } from '@/lib/whatsappServer';

// POST { to, message } → sends a WhatsApp message via the Cloud API.
// Used by the admin panel to message customers/leads server-side so the
// access token stays private.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const to = String(body.to || '').trim();
  const message = String(body.message || '').trim();

  if (!to || !/^[0-9+\-\s]{7,20}$/.test(to)) {
    return NextResponse.json(
      { ok: false, error: 'Please provide a valid recipient number.' },
      { status: 400 }
    );
  }
  if (!message) {
    return NextResponse.json({ ok: false, error: 'Message cannot be empty.' }, { status: 400 });
  }
  if (message.length > 4096) {
    return NextResponse.json({ ok: false, error: 'Message is too long (max 4096 characters).' }, { status: 400 });
  }

  const result = await sendWhatsAppText(to, message);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error || 'Could not send the message.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, configured: result.configured });
}
