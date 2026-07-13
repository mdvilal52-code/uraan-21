// Server-side review persistence (Supabase). Returns null / false when the DB
// is not configured (or the table is missing) so callers fall back to the
// in-browser store. Admin moderates (verify / delete); customers don't write
// here in this build. Mirrors lib/leadsDb.ts.
import { getSupabase } from './supabase';
import type { Review } from './reviewsStore';

type Row = {
  id: string;
  name: string;
  city: string | null;
  avatar: string | null;
  rating: number | null;
  text: string | null;
  product: string | null;
  product_id: string | null;
  title: string | null;
  photo: string | null;
  helpful: number | null;
  reported: boolean | null;
  date: string | null;
  verified: boolean | null;
};

function toReview(r: Row): Review {
  return {
    id: r.id,
    name: r.name,
    city: r.city || '',
    avatar: r.avatar || '/images/model.jpg',
    rating: r.rating ?? 5,
    text: r.text || '',
    product: r.product || undefined,
    productId: r.product_id || undefined,
    title: r.title || undefined,
    photo: r.photo || undefined,
    helpful: r.helpful ?? 0,
    reported: Boolean(r.reported),
    date: r.date || '',
    verified: Boolean(r.verified),
  };
}

export async function dbGetReviews(): Promise<Review[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('reviews').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error('[reviewsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toReview);
}

export async function dbSetReviewVerified(id: string, verified: boolean): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('reviews').update({ verified }).eq('id', id);
  if (error) {
    console.error('[reviewsDb] verify:', error.message);
    return false;
  }
  return true;
}

export async function dbDeleteReview(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('reviews').delete().eq('id', id);
  if (error) {
    console.error('[reviewsDb] delete:', error.message);
    return false;
  }
  return true;
}

export async function dbCreateReview(input: {
  name: string;
  city?: string;
  rating: number;
  title?: string;
  text: string;
  product?: string;
  productId?: string;
  photo?: string;
  verified: boolean;
}): Promise<Review | null> {
  const sb = getSupabase();
  if (!sb) return null;
  // reviews.id is `text primary key` with no DB-side default (unlike e.g.
  // admin_notifications.id) — every insert must supply one itself, or every
  // submission hits a NOT NULL violation and silently fails below.
  const id = 'RV' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const { data, error } = await sb
    .from('reviews')
    .insert({
      id,
      name: input.name,
      city: input.city || null,
      avatar: '/images/model.jpg',
      rating: input.rating,
      title: input.title || null,
      text: input.text,
      product: input.product || null,
      product_id: input.productId || null,
      photo: input.photo || null,
      verified: input.verified,
      helpful: 0,
      reported: false,
      date: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) {
    console.error('[reviewsDb] create:', error.message);
    return null;
  }
  return toReview(data as Row);
}

export async function dbMarkHelpful(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { data, error: readErr } = await sb.from('reviews').select('helpful').eq('id', id).maybeSingle();
  if (readErr || !data) return false;
  const { error } = await sb.from('reviews').update({ helpful: (data.helpful || 0) + 1 }).eq('id', id);
  if (error) {
    console.error('[reviewsDb] helpful:', error.message);
    return false;
  }
  return true;
}

export async function dbReportReview(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('reviews').update({ reported: true }).eq('id', id);
  if (error) {
    console.error('[reviewsDb] report:', error.message);
    return false;
  }
  return true;
}
