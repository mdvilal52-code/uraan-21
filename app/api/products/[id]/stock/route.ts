import { NextResponse } from 'next/server';
import { dbAdjustStock } from '@/lib/productsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { checkLengths, MAX_LEN, isBodyTooLarge } from '@/lib/security/validate';
import { logAudit } from '@/lib/audit';
import { currentApiAdmin } from '@/lib/security/guard';
import { notify } from '@/lib/notify';

// POST → manual stock correction (admin only). body: { delta, reason? }
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Connect a database (Supabase) to adjust stock.' },
      { status: 400 }
    );
  }

  let body: { delta?: number; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const delta = Number(body.delta);
  if (!Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ ok: false, error: 'A non-zero delta is required.' }, { status: 400 });
  }
  const reason = String(body.reason || '').trim();
  const lengthError = checkLengths({ Reason: { value: reason, max: MAX_LEN.short } });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  const admin = await currentApiAdmin();
  const result = await dbAdjustStock(params.id, delta, reason || undefined, admin?.email);
  if (!result) {
    return NextResponse.json({ ok: false, error: 'Could not adjust stock.' }, { status: 502 });
  }

  await logAudit({
    actorEmail: admin?.email,
    actorRole: admin?.role,
    action: 'product_stock_adjusted',
    target: params.id,
    metadata: { delta, reason: reason || undefined },
  });

  if (result.stock <= 0) {
    notify('out_of_stock', `${result.name} is now out of stock.`, {
      priority: 'critical',
      link: `/admin/products/edit/${params.id}`,
    }).catch(() => {});
  } else if (result.stock <= result.threshold) {
    notify('low_stock', `${result.name} is low on stock (${result.stock} left, threshold ${result.threshold}).`, {
      priority: 'high',
      link: `/admin/products/edit/${params.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
