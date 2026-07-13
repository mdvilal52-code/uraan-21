// Freeform admin notes attached to a customer (keyed by phone/email id).
// Supabase-only — no browser fallback (notes are a light CRM extra, not a
// core flow that needs to work offline).
import { getSupabase } from './supabase';

export type CustomerNote = {
  id: number;
  phone: string;
  note: string;
  createdBy?: string;
  createdAt: string;
};

type Row = { id: number; phone: string; note: string; created_by: string | null; created_at: string };

function toNote(r: Row): CustomerNote {
  return {
    id: r.id,
    phone: r.phone,
    note: r.note,
    createdBy: r.created_by || undefined,
    createdAt: r.created_at,
  };
}

export async function dbGetCustomerNotes(phone: string): Promise<CustomerNote[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('customer_notes')
    .select('*')
    .eq('phone', phone)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[customerNotesDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toNote);
}

export async function dbAddCustomerNote(
  phone: string,
  note: string,
  createdBy?: string
): Promise<CustomerNote | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('customer_notes')
    .insert({ phone, note, created_by: createdBy || null })
    .select()
    .single();
  if (error) {
    console.error('[customerNotesDb] insert:', error.message);
    return null;
  }
  return toNote(data as Row);
}
