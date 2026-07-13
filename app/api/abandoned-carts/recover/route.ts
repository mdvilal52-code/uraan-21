import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbMarkRecovered } from '@/lib/abandonedCartsDb';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// POST → mark any abandoned carts for this phone as recovered (public — called
// right after a real order completes at checkout). Best-effort, never blocks.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const phone = String(body.phone || '').trim();
  if (!phone) {
    return NextResponse.json({ ok: true, configured: isSupabaseConfigured() });
  }
  const lengthError = checkLengths({ Phone: { value: phone, max: MAX_LEN.short } });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }
  await dbMarkRecovered(phone);
  return NextResponse.json({ ok: true, configured: true });
}
