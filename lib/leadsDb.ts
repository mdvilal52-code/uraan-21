// Server-side lead persistence (Supabase). Returns null / false when the DB is
// not configured so callers can fall back to the in-browser store.
import { getSupabase } from './supabase';
import type { Lead, LeadStatus } from './leads';

type Row = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  source: string;
  status: string;
  created_at: string;
};

function toLead(r: Row): Lead {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone || undefined,
    message: r.message || undefined,
    source: r.source,
    status: (r.status as LeadStatus) || 'New',
    createdAt: r.created_at,
  };
}

export async function dbGetLeads(): Promise<Lead[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('leads').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('[leadsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toLead);
}

export async function dbInsertLead(input: {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}): Promise<Lead | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('leads')
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      message: input.message || null,
      source: input.source || 'Website',
      status: 'New',
    })
    .select()
    .single();
  if (error) {
    console.error('[leadsDb] insert:', error.message);
    return null;
  }
  return toLead(data as Row);
}

export async function dbUpdateLeadStatus(id: string, status: LeadStatus): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('leads').update({ status }).eq('id', id);
  if (error) {
    console.error('[leadsDb] update:', error.message);
    return false;
  }
  return true;
}

export async function dbDeleteLead(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('leads').delete().eq('id', id);
  if (error) {
    console.error('[leadsDb] delete:', error.message);
    return false;
  }
  return true;
}
