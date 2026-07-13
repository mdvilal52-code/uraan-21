import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetReturns, dbInsertReturn } from '@/lib/returnsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { currentApiAdmin } from '@/lib/security/guard';
import { logAudit } from '@/lib/audit';
import type { ReturnInput, ReturnType } from '@/lib/returns';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// GET → list return/exchange (RMA) requests (admin only).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, returns: [] });
  }
  const returns = await dbGetReturns();
  if (returns === null) {
    return NextResponse.json({ ok: true, configured: false, returns: [] });
  }
  return NextResponse.json({ ok: true, configured: true, returns });
}

// POST → log a new RMA request (admin only — there is no customer
// self-service portal in this repo; requests are logged by admin/support
// staff after a customer calls/messages).
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const orderId = String(body.orderId || '').trim();
  const customerName = String(body.customerName || '').trim();
  const customerPhone = String(body.customerPhone || '').trim();
  const customerEmail = String(body.customerEmail || '').trim();
  const reason = String(body.reason || '').trim();
  const type = (String(body.type || 'return') === 'exchange' ? 'exchange' : 'return') as ReturnType;

  if (!orderId || !customerName || !customerPhone || !reason) {
    return NextResponse.json(
      { ok: false, error: 'Order id, customer name, phone and reason are required.' },
      { status: 400 }
    );
  }

  const lengthError = checkLengths({
    'Order id': { value: orderId, max: MAX_LEN.short },
    'Customer name': { value: customerName, max: MAX_LEN.short },
    Phone: { value: customerPhone, max: MAX_LEN.short },
    Email: { value: customerEmail, max: MAX_LEN.short },
    Reason: { value: reason, max: MAX_LEN.text },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  const input: ReturnInput = {
    orderId,
    customerName,
    customerPhone,
    customerEmail: customerEmail || undefined,
    reason,
    type,
  };
  const record = await dbInsertReturn(input);
  if (!record) {
    return NextResponse.json({ ok: false, error: 'Could not save return.' }, { status: 502 });
  }

  const admin = await currentApiAdmin();
  await logAudit({
    actorEmail: admin?.email,
    actorRole: admin?.role,
    action: 'return_created',
    target: record.id,
    metadata: { orderId, type },
  });

  return NextResponse.json({ ok: true, configured: true, return: record });
}
