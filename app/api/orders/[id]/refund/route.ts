import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { processRefund } from '@/lib/refunds';
import { currentApiAdmin } from '@/lib/security/guard';
import { logAudit } from '@/lib/audit';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// POST → refund an order, fully or partially (admin only). Calls Razorpay's
// refund API when the order was paid online and Razorpay is configured;
// otherwise this simply records a manual/COD refund the admin is logging.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const amount = Number(body.amount || 0);
  const reason = String(body.reason || '').trim();
  const lengthError = checkLengths({ Reason: { value: reason, max: MAX_LEN.text } });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  const result = await processRefund(params.id, amount, reason || undefined);
  if (!result.ok) {
    const status =
      result.error === 'Order not found.'
        ? 404
        : result.error === 'Refund amount must be greater than zero.' || result.error === 'Refund amount exceeds the order total.'
        ? 400
        : 502;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  const admin = await currentApiAdmin();
  await logAudit({
    actorEmail: admin?.email,
    actorRole: admin?.role,
    action: 'order_refunded',
    target: params.id,
    metadata: { amount, totalRefunded: result.refundAmount, refundStatus: result.refundStatus, reason: reason || undefined },
  });

  return NextResponse.json({ ok: true, refundStatus: result.refundStatus, refundAmount: result.refundAmount });
}
