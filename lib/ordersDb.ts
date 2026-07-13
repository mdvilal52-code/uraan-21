// Server-side order persistence (Supabase). Returns null / false when the DB is
// not configured so callers can fall back to the bundled demo orders.
import { getSupabase } from './supabase';
import type { Order, OrderStatus } from './orders';

const STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function normStatus(s: string): OrderStatus {
  return (STATUSES.includes(s as OrderStatus) ? s : 'Processing') as OrderStatus;
}

export type StatusHistoryEntry = { status: string; at: string; by: string };

type LineItem = { name: string; quantity: number; price: number; image?: string };

type Row = {
  id: string;
  customer: string;
  email: string | null;
  phone: string | null;
  amount: number;
  item_count: number;
  items: LineItem[] | null;
  status: string;
  payment: string | null;
  payment_id: string | null;
  paid: boolean | null;
  address: string | null;
  created_at: string;
  notes: string | null;
  status_history: StatusHistoryEntry[] | null;
  tracking_number: string | null;
  courier: string | null;
  refund_amount: number | null;
  refund_status: string | null;
};

function normRefundStatus(s: string | null | undefined): 'none' | 'partial' | 'full' {
  return s === 'partial' || s === 'full' ? s : 'none';
}

function toOrder(r: Row): Order {
  return {
    id: r.id,
    customerId: '',
    customer: r.customer,
    email: r.email || '',
    phone: r.phone || '',
    amount: r.amount,
    items: r.item_count,
    status: normStatus(r.status),
    payment: r.payment || '',
    date: new Date(r.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    address: r.address || undefined,
    paid: Boolean(r.paid),
    paymentId: r.payment_id || undefined,
    notes: r.notes || undefined,
    statusHistory: Array.isArray(r.status_history) ? r.status_history : undefined,
    trackingNumber: r.tracking_number || undefined,
    courier: r.courier || undefined,
    refundAmount: r.refund_amount ?? 0,
    refundStatus: normRefundStatus(r.refund_status),
    lineItems: Array.isArray(r.items) ? r.items : undefined,
  };
}

export async function dbGetOrders(): Promise<Order[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('orders').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[ordersDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toOrder);
}

// Idempotency lookup for /api/payment/verify — a replayed (valid) signature
// must resolve to the SAME order instead of minting a new one every time.
export async function dbGetOrderByPaymentId(paymentId: string): Promise<Order | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('orders').select('*').eq('payment_id', paymentId).maybeSingle();
  if (error) {
    console.error('[ordersDb] getByPaymentId:', error.message);
    return null;
  }
  if (!data) return null;
  return toOrder(data as Row);
}

export async function dbGetOrderById(id: string): Promise<Order | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[ordersDb] get:', error.message);
    return null;
  }
  if (!data) return null;
  return toOrder(data as Row);
}

export interface NewOrderInput {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  amount: number;
  items: { name: string; quantity: number; price: number; image?: string }[];
  payment?: string;
  status?: string;
  address?: string;
  paid?: boolean;
  paymentId?: string;
}

export async function dbInsertOrder(input: NewOrderInput): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('orders').insert({
    id: input.id,
    customer: input.customer,
    email: input.email || null,
    phone: input.phone || null,
    amount: input.amount,
    items: input.items,
    item_count: input.items.reduce((sum, i) => sum + i.quantity, 0),
    status: input.status || 'Processing',
    payment: input.payment || null,
    payment_id: input.paymentId || null,
    paid: input.paid ?? false,
    address: input.address || null,
  });
  if (error) {
    console.error('[ordersDb] insert:', error.message);
    return false;
  }

  // Every paid order gets an initial transaction record so the transaction
  // log is complete from the start (best-effort — never fails the order).
  if (input.paid) {
    await dbInsertTransaction({
      orderId: input.id,
      type: 'payment',
      gateway: input.paymentId ? 'razorpay' : undefined,
      amount: input.amount,
      status: 'success',
    });
  }

  return true;
}

export async function dbUpdateOrderStatus(
  id: string,
  status: OrderStatus,
  changedBy: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { data: current, error: fetchError } = await sb
    .from('orders')
    .select('status_history')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) {
    console.error('[ordersDb] status fetch:', fetchError.message);
    return false;
  }

  const history: StatusHistoryEntry[] = Array.isArray(current?.status_history)
    ? current!.status_history
    : [];
  const nextHistory = [...history, { status, at: new Date().toISOString(), by: changedBy }];

  const { error } = await sb
    .from('orders')
    .update({ status, status_history: nextHistory })
    .eq('id', id);
  if (error) {
    console.error('[ordersDb] status:', error.message);
    return false;
  }
  return true;
}

export async function dbUpdateOrderNotes(id: string, notes: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('orders').update({ notes }).eq('id', id);
  if (error) {
    console.error('[ordersDb] notes:', error.message);
    return false;
  }
  return true;
}

export async function dbUpdateOrderTracking(
  id: string,
  trackingNumber: string,
  courier: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('orders')
    .update({ tracking_number: trackingNumber, courier })
    .eq('id', id);
  if (error) {
    console.error('[ordersDb] tracking:', error.message);
    return false;
  }
  return true;
}

export async function dbSetOrderRefund(
  id: string,
  refundAmount: number,
  refundStatus: 'none' | 'partial' | 'full'
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('orders')
    .update({ refund_amount: refundAmount, refund_status: refundStatus })
    .eq('id', id);
  if (error) {
    console.error('[ordersDb] refund:', error.message);
    return false;
  }
  return true;
}

export type Transaction = {
  id: number;
  orderId: string;
  type: 'payment' | 'refund' | 'failure';
  gateway?: string;
  gatewayResponse?: Record<string, unknown>;
  amount: number;
  status: string;
  createdAt: string;
};

type TransactionRow = {
  id: number;
  order_id: string;
  type: string;
  gateway: string | null;
  gateway_response: Record<string, unknown> | null;
  amount: number;
  status: string;
  created_at: string;
};

function toTransaction(r: TransactionRow): Transaction {
  return {
    id: r.id,
    orderId: r.order_id,
    type: (r.type === 'refund' || r.type === 'failure' ? r.type : 'payment') as Transaction['type'],
    gateway: r.gateway || undefined,
    gatewayResponse: r.gateway_response || undefined,
    amount: r.amount,
    status: r.status,
    createdAt: r.created_at,
  };
}

export async function dbInsertTransaction(entry: {
  orderId: string;
  type: 'payment' | 'refund' | 'failure';
  gateway?: string;
  gatewayResponse?: object;
  amount: number;
  status: string;
}): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('transactions').insert({
    order_id: entry.orderId,
    type: entry.type,
    gateway: entry.gateway || null,
    gateway_response: entry.gatewayResponse || {},
    amount: entry.amount,
    status: entry.status,
  });
  if (error) {
    console.error('[ordersDb] transaction insert:', error.message);
    return false;
  }
  return true;
}

export async function dbGetTransactionsForOrder(orderId: string): Promise<Transaction[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('transactions')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[ordersDb] transactions list:', error.message);
    return null;
  }
  return (data as TransactionRow[]).map(toTransaction);
}
