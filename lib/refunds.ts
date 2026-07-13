// Shared refund processing — the ONE place that actually moves money back to
// a customer (via Razorpay when the order was paid online, or just records a
// manual/COD refund otherwise). Used by both the order-detail "Refund" action
// and the Returns/RMA workflow, so marking a return "Refunded" can never be a
// cosmetic status flip that doesn't touch the real order/gateway.
import { dbGetOrderById, dbSetOrderRefund, dbInsertTransaction } from './ordersDb';
import { isRazorpayConfigured, createRazorpayRefund } from './razorpay';

export type RefundResult =
  | { ok: true; refundStatus: 'partial' | 'full'; refundAmount: number }
  | { ok: false; error: string };

export async function processRefund(orderId: string, amount: number, reason?: string): Promise<RefundResult> {
  if (!amount || amount <= 0) {
    return { ok: false, error: 'Refund amount must be greater than zero.' };
  }

  const order = await dbGetOrderById(orderId);
  if (!order) {
    return { ok: false, error: 'Order not found.' };
  }

  const alreadyRefunded = order.refundAmount || 0;
  const totalRefunded = alreadyRefunded + amount;
  if (totalRefunded > order.amount) {
    return { ok: false, error: 'Refund amount exceeds the order total.' };
  }

  let gateway: string | undefined;
  let gatewayResponse: Record<string, unknown> = { manual: true, reason: reason || undefined };

  if (order.paymentId && isRazorpayConfigured()) {
    gateway = 'razorpay';
    const result = await createRazorpayRefund(order.paymentId, Math.round(amount * 100));
    if (!result.ok) {
      return { ok: false, error: result.error || 'Refund failed.' };
    }
    gatewayResponse = { razorpayRefundId: result.id };
  }

  const refundStatus: 'partial' | 'full' = totalRefunded >= order.amount ? 'full' : 'partial';

  const saved = await dbSetOrderRefund(orderId, totalRefunded, refundStatus);
  if (!saved) {
    return { ok: false, error: 'Could not record refund.' };
  }

  await dbInsertTransaction({
    orderId,
    type: 'refund',
    gateway,
    gatewayResponse,
    amount,
    status: 'success',
  });

  return { ok: true, refundStatus, refundAmount: totalRefunded };
}
