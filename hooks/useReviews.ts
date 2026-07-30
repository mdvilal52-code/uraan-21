'use client';

import { useEffect, useState } from 'react';
import { reviews as seedReviews, type Review } from '@/data/jewelleryData';
import { getReviews as getStoredReviews } from '@/lib/reviewsStore';

// Module-level cache shared across the testimonials block and the reviews page.
// Mirrors hooks/useProducts.ts. `cached` holds the database list once fetched;
// until then (or when there's no database configured) every consumer reads the
// browser-local store instead of the raw bundled seed, so admin verify/delete
// actions AND newly-submitted reviews (see lib/reviewsActions.ts) show up
// immediately without a page refresh.
let cached: Review[] | null = null;
let inflight: Promise<Review[] | null> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

function loadReviews(): Promise<Review[] | null> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch('/api/reviews')
      .then((r) => r.json())
      .then((d) => {
        // A genuinely empty (but configured) table is a valid result, not a
        // failure — treating `reviews: []` as "fetch failed" masked a real
        // empty DB behind stale local/seed data. Only `configured: false`
        // (no DB wired up) or an actual fetch error should fall back.
        if (d?.ok && d.configured && Array.isArray(d.reviews)) {
          cached = d.reviews as Review[];
          return cached;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Re-renders every mounted useReviews() consumer after a local-store mutation
 *  (new review, helpful vote, report) so the change shows up instantly. */
export function refreshLocalReviews(): void {
  notify();
}

/** Prepends a database-created review to the shared cache (Supabase path). */
export function primeReviewCache(review: Review): void {
  cached = [review, ...(cached || [])];
  notify();
}

/** Optimistically bumps a cached (Supabase-backed) review's helpful count. */
export function bumpCachedHelpful(id: string): void {
  if (!cached) return;
  cached = cached.map((r) => (r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r));
  notify();
}

/** Optimistically flags a cached (Supabase-backed) review as reported. */
export function markCachedReported(id: string): void {
  if (!cached) return;
  cached = cached.map((r) => (r.id === id ? { ...r, reported: true } : r));
  notify();
}

// Live reviews from the database, falling back to the local browser store
// (which itself falls back to the bundled seed). Public views should show
// only verified reviews (see `verifiedOnly`).
export function useReviews(): { reviews: Review[]; loaded: boolean } {
  // Must match the server-rendered value exactly on first client render — the
  // stored (localStorage) reviews can differ from the bundled seed (verified
  // flags, submitted reviews, helpful counts), which server-side rendering can
  // never see. Reading getStoredReviews() here caused a hydration mismatch
  // (React error #425) for any returning visitor whose local review store had
  // already diverged from the seed. The effect below syncs in the real
  // stored/live value immediately after mount instead.
  const [reviews, setReviews] = useState<Review[]>(() => cached || seedReviews);
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let active = true;
    const sync = () => {
      if (!active) return;
      const next = cached || getStoredReviews();
      setReviews((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    };
    listeners.add(sync);
    loadReviews().then((list) => {
      if (!active) return;
      if (list && list.length) cached = list;
      const next = cached || getStoredReviews();
      setReviews((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
      setLoaded(true);
    });
    return () => {
      active = false;
      listeners.delete(sync);
    };
  }, []);

  return { reviews, loaded };
}

/** Verified reviews for public display; falls back to all if none are verified. */
export function verifiedOnly(list: Review[]): Review[] {
  const verified = list.filter((r) => r.verified);
  return verified.length ? verified : list;
}

/** Newest first, by `date`. */
export function newestFirst(list: Review[]): Review[] {
  return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
