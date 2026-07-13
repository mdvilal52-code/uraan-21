import { NextResponse } from 'next/server';
import { dbGetGoldRate, dbSetGoldRate } from '@/lib/productsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isBodyTooLarge } from '@/lib/security/validate';
import { logAudit } from '@/lib/audit';
import { currentApiAdmin } from '@/lib/security/guard';

// GET → current gold rate per gram (admin only).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const rate = await dbGetGoldRate();
  return NextResponse.json({ ok: true, rate });
}

// POST → set today's gold rate per gram (admin only). body: { rate }
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Connect a database (Supabase) to set the gold rate.' },
      { status: 400 }
    );
  }

  let body: { rate?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const rate = Number(body.rate);
  if (!Number.isFinite(rate) || rate <= 0 || rate >= 100000) {
    return NextResponse.json({ ok: false, error: 'Rate must be a number greater than 0 and less than 100000.' }, { status: 400 });
  }

  const ok = await dbSetGoldRate(rate);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not save the gold rate.' }, { status: 502 });
  }

  const admin = await currentApiAdmin();
  await logAudit({ actorEmail: admin?.email, actorRole: admin?.role, action: 'gold_rate_updated', metadata: { rate } });

  return NextResponse.json({ ok: true, rate });
}
