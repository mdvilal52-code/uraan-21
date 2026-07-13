// Server-side return/exchange (RMA) persistence (Supabase). Returns null /
// false when the DB is not configured so callers fall back to the in-browser
// store. Mirrors lib/couponsDb.ts.
import { getSupabase } from './supabase';
import type { Return, ReturnType, ReturnStatus, ReturnInput } from './returns';

type Row = {
  id: string;
  order_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  reason: string | null;
  type: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

const TYPES: ReturnType[] = ['return', 'exchange'];
const STATUSES: ReturnStatus[] = ['requested', 'approved', 'rejected', 'refunded', 'replaced'];

function normType(t: string): ReturnType {
  return (TYPES.includes(t as ReturnType) ? t : 'return') as ReturnType;
}

function normStatus(s: string): ReturnStatus {
  return (STATUSES.includes(s as ReturnStatus) ? s : 'requested') as ReturnStatus;
}

function toReturn(r: Row): Return {
  return {
    id: r.id,
    orderId: r.order_id,
    customerName: r.customer_name || '',
    customerPhone: r.customer_phone || '',
    customerEmail: r.customer_email || undefined,
    reason: r.reason || '',
    type: normType(r.type),
    status: normStatus(r.status),
    adminNotes: r.admin_notes || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function dbGetReturns(): Promise<Return[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('returns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[returnsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toReturn);
}

export async function dbGetReturnById(id: string): Promise<Return | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('returns').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[returnsDb] getById:', error.message);
    return null;
  }
  if (!data) return null;
  return toReturn(data as Row);
}

export async function dbInsertReturn(input: ReturnInput): Promise<Return | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const id = 'RMA' + Date.now().toString(36).toUpperCase();
  const { data, error } = await sb
    .from('returns')
    .insert({
      id,
      order_id: input.orderId.trim(),
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      customer_email: input.customerEmail?.trim() || null,
      reason: input.reason.trim(),
      type: input.type,
      status: 'requested',
    })
    .select()
    .single();
  if (error) {
    console.error('[returnsDb] insert:', error.message);
    return null;
  }
  return toReturn(data as Row);
}

// `status` is optional so an admin-notes-only update doesn't force a status
// value the caller doesn't have (dbGetReturns() has no single-row lookup —
// this keeps the notes-only PATCH path a single round trip).
export async function dbUpdateReturnStatus(
  id: string,
  status?: ReturnStatus,
  adminNotes?: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) row.status = status;
  if (adminNotes !== undefined) row.admin_notes = adminNotes;
  const { error } = await sb.from('returns').update(row).eq('id', id);
  if (error) {
    console.error('[returnsDb] update:', error.message);
    return false;
  }
  return true;
}
