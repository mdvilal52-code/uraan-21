// Server-side abandoned-cart persistence (Supabase). Returns null / false when
// the DB is not configured. Mirrors lib/leadsDb.ts / lib/couponsDb.ts.
import { getSupabase } from './supabase';
import type { AbandonedCart, AbandonedCartItem } from './abandonedCarts';

type Row = {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  items: AbandonedCartItem[] | null;
  total: number;
  reminded_at: string | null;
  recovered: boolean | null;
  created_at: string;
};

function toCart(r: Row): AbandonedCart {
  return {
    id: r.id,
    name: r.name || undefined,
    phone: r.phone || undefined,
    email: r.email || undefined,
    items: Array.isArray(r.items) ? r.items : [],
    total: r.total,
    remindedAt: r.reminded_at || undefined,
    recovered: Boolean(r.recovered),
    createdAt: r.created_at,
  };
}

export async function dbGetAbandonedCarts(): Promise<AbandonedCart[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('abandoned_carts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[abandonedCartsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toCart);
}

export async function dbInsertAbandonedCart(input: {
  name?: string;
  phone?: string;
  email?: string;
  items: AbandonedCartItem[];
  total: number;
}): Promise<AbandonedCart | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('abandoned_carts')
    .insert({
      name: input.name || null,
      phone: input.phone || null,
      email: input.email || null,
      items: input.items,
      total: input.total,
      recovered: false,
    })
    .select()
    .single();
  if (error) {
    console.error('[abandonedCartsDb] insert:', error.message);
    return null;
  }
  return toCart(data as Row);
}

export async function dbMarkReminded(id: number): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('abandoned_carts')
    .update({ reminded_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[abandonedCartsDb] markReminded:', error.message);
    return false;
  }
  return true;
}

// Marks ALL unrecovered abandoned carts matching this phone as recovered
// (called when a real order completes with the same phone number).
export async function dbMarkRecovered(phone: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  if (!phone.trim()) return false;
  const { error } = await sb
    .from('abandoned_carts')
    .update({ recovered: true })
    .eq('phone', phone.trim())
    .eq('recovered', false);
  if (error) {
    console.error('[abandonedCartsDb] markRecovered:', error.message);
    return false;
  }
  return true;
}

export async function dbGetAbandonedCartById(id: number): Promise<AbandonedCart | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('abandoned_carts').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('[abandonedCartsDb] getById:', error.message);
    return null;
  }
  if (!data) return null;
  return toCart(data as Row);
}
