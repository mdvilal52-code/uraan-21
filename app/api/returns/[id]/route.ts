import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { dbGetReturnById, dbUpdateReturnStatus } from '@/lib/returnsDb';
import { dbGetOrderById } from '@/lib/ordersDb';
import { processRefund } from '@/lib/refunds';
import type { ReturnStatus } from '@/lib/returns';
import { currentApiAdmin } from '@/lib/security/guard';
import { logAudit } from '@/lib/audit';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

const STATUSES: ReturnStatus[] = ['requested', 'approved', 'rejected', 'refunded', 'replaced'];

// PATCH → update a return's status and/or admin notes (admin only). Setting
// status to 'refunded' actually moves money — it calls the same refund path
// as the order-detail "Refund" button (Razorpay when paid online, a logged
// manual refund otherwise) BEFORE the return is marked refunded, so this can
// never be a cosmetic status flip that doesn't touch the real order.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const hasStatus = body.status !== undefined;
  const hasNotes = body.adminNotes !== undefined;
  if (!hasStatus && !hasNotes) {
    return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
  }

  let status: ReturnStatus | undefined;
  if (hasStatus) {
    status = String(body.status || '') as ReturnStatus;
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
    }
  }

  const adminNotes = hasNotes ? String(body.adminNotes ?? '') : undefined;
  const lengthError = checkLengths({
    ...(adminNotes !== undefined ? { 'Admin notes': { value: adminNotes, max: MAX_LEN.text } } : {}),
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  let refundAmount: number | undefined;
  if (status === 'refunded') {
    const existing = await dbGetReturnById(params.id);
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Return not found.' }, { status: 404 });
    }
    if (existing.status !== 'refunded') {
      // A return has no per-item amount of its own — default to refunding
      // whatever remains unpaid-back on the linked order, unless the admin
      // specified a smaller (e.g. partial-item) amount explicitly.
      const requested = Number(body.refundAmount);
      let amount = Number.isFinite(requested) && requested > 0 ? requested : undefined;
      if (amount === undefined) {
        const order = await dbGetOrderById(existing.orderId);
        if (!order) {
          return NextResponse.json({ ok: false, error: 'Linked order not found — cannot refund.' }, { status: 404 });
        }
        amount = Math.max(0, order.amount - (order.refundAmount || 0));
        if (amount <= 0) {
          return NextResponse.json({ ok: false, error: 'This order has already been fully refunded.' }, { status: 400 });
        }
      }
      const result = await processRefund(existing.orderId, amount, `Return ${params.id}: ${existing.reason || 'refund'}`);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
      }
      refundAmount = result.refundAmount;
    }
  }

  const ok = await dbUpdateReturnStatus(params.id, status, adminNotes);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not update return.' }, { status: 502 });
  }

  const admin = await currentApiAdmin();
  await logAudit({
    actorEmail: admin?.email,
    actorRole: admin?.role,
    action: 'return_status_changed',
    target: params.id,
    metadata: { status, notesUpdated: hasNotes, refundAmount },
  });

  return NextResponse.json({ ok: true });
}
