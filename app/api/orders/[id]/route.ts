import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import {
  dbUpdateOrderStatus,
  dbUpdateOrderNotes,
  dbUpdateOrderTracking,
  dbGetOrderById,
  dbGetTransactionsForOrder,
} from '@/lib/ordersDb';
import type { Order, OrderStatus } from '@/lib/orders';
import { orderUpdateMessage } from '@/lib/whatsapp';
import { sendWhatsAppText } from '@/lib/whatsappServer';
import { sendEmail } from '@/lib/email';
import { currentApiAdmin } from '@/lib/security/guard';
import { logAudit } from '@/lib/audit';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';
import { notify } from '@/lib/notify';

const STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const NOTIFY_STATUSES: OrderStatus[] = ['Shipped', 'Delivered', 'Cancelled'];

// Best-effort customer notification. Never awaited by the caller and never
// throws — a failed WhatsApp/email send must not affect the API response.
function notifyCustomer(order: Order, status: OrderStatus) {
  try {
    const message = orderUpdateMessage({ id: order.id, customer: order.customer, status });
    if (order.phone) {
      sendWhatsAppText(order.phone, message).catch(() => {});
    }
    if (order.email) {
      const html = `<p>${message.replace(/\n/g, '<br />')}</p>`;
      sendEmail(order.email, `Update on your order ${order.id}`, html).catch(() => {});
    }
  } catch {
    /* best-effort — never break the request */
  }
}

// GET → a single order + its transaction history (admin only).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const order = await dbGetOrderById(params.id);
  if (!order) {
    return NextResponse.json({ ok: false, error: 'Order not found.' }, { status: 404 });
  }
  const transactions = await dbGetTransactionsForOrder(params.id);
  return NextResponse.json({ ok: true, order, transactions: transactions || [] });
}

// PATCH → update an order's status and/or notes/tracking (admin only).
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
  const hasNotes = body.notes !== undefined;
  const hasTracking = body.trackingNumber !== undefined || body.courier !== undefined;

  if (!hasStatus && !hasNotes && !hasTracking) {
    return NextResponse.json({ ok: false, error: 'Nothing to update.' }, { status: 400 });
  }

  let status: OrderStatus | undefined;
  if (hasStatus) {
    status = String(body.status || '') as OrderStatus;
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
    }
  }

  const notes = hasNotes ? String(body.notes ?? '') : undefined;
  const trackingNumber = body.trackingNumber !== undefined ? String(body.trackingNumber ?? '') : undefined;
  const courier = body.courier !== undefined ? String(body.courier ?? '') : undefined;

  const lengthError = checkLengths({
    ...(notes !== undefined ? { Notes: { value: notes, max: MAX_LEN.text } } : {}),
    ...(trackingNumber !== undefined
      ? { 'Tracking number': { value: trackingNumber, max: MAX_LEN.short } }
      : {}),
    ...(courier !== undefined ? { Courier: { value: courier, max: MAX_LEN.short } } : {}),
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  const admin = await currentApiAdmin();
  const changedBy = admin?.email || 'system';

  // Needed for the audit "from" status and to fill in phone/email for
  // notifications, and to preserve the other tracking field on a partial update.
  const existing = hasStatus || hasTracking ? await dbGetOrderById(params.id) : null;

  if (hasStatus && status) {
    const ok = await dbUpdateOrderStatus(params.id, status, changedBy);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Could not update order.' }, { status: 502 });
    }
    await logAudit({
      actorEmail: admin?.email,
      actorRole: admin?.role,
      action: 'order_status_changed',
      target: params.id,
      metadata: { from: existing?.status, to: status },
    });

    if (existing && NOTIFY_STATUSES.includes(status)) {
      notifyCustomer(existing, status);
    }

    if (status === 'Cancelled') {
      notify('order_cancelled', `Order ${params.id} was cancelled (was "${existing?.status || 'unknown'}").`, {
        priority: 'high',
        link: `/admin/orders/${params.id}`,
        actorEmail: admin?.email,
      }).catch(() => {});
    }
  }

  if (hasNotes && notes !== undefined) {
    const ok = await dbUpdateOrderNotes(params.id, notes);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Could not update order.' }, { status: 502 });
    }
    await logAudit({
      actorEmail: admin?.email,
      actorRole: admin?.role,
      action: 'order_note_updated',
      target: params.id,
    });
  }

  if (hasTracking) {
    const nextTracking = trackingNumber !== undefined ? trackingNumber : existing?.trackingNumber || '';
    const nextCourier = courier !== undefined ? courier : existing?.courier || '';
    const ok = await dbUpdateOrderTracking(params.id, nextTracking, nextCourier);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Could not update order.' }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
