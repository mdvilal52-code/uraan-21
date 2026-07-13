'use client';

// Client-side entry points for writing a review, voting it helpful, or
// reporting it. Each posts to the API first; when the server reports
// `configured: false` (no Supabase yet) the mutation is applied to the
// browser-local review store instead, so the feature works end-to-end before
// a database is wired up — same graceful-degradation pattern as leads/orders.
import type { Review } from '@/data/jewelleryData';
import { addReview, markHelpful, reportReview, hasVotedHelpful } from '@/lib/reviewsStore';
import {
  primeReviewCache,
  refreshLocalReviews,
  bumpCachedHelpful,
  markCachedReported,
} from '@/hooks/useReviews';

export type NewReviewInput = {
  name: string;
  city?: string;
  rating: number;
  title?: string;
  text: string;
  product?: string;
  productId?: string;
  photo?: string;
  /** Honeypot — must stay empty; a filled value marks the submission as spam. */
  website?: string;
};

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function submitReview(
  input: NewReviewInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  let res: Response;
  try {
    res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }

  let data: { ok: boolean; error?: string; configured?: boolean; review?: Review };
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }

  if (!data.ok) {
    return { ok: false, error: data.error || 'Could not submit your review.' };
  }

  if (data.configured && data.review) {
    primeReviewCache(data.review);
    return { ok: true };
  }

  // No database configured — persist locally so it shows up immediately
  // across the homepage, /reviews, and this product's page.
  const review: Review = {
    id: newId(),
    name: input.name,
    city: input.city || '',
    avatar: '/images/model.jpg',
    rating: input.rating,
    text: input.text,
    title: input.title || undefined,
    product: input.product || undefined,
    productId: input.productId || undefined,
    photo: input.photo || undefined,
    helpful: 0,
    reported: false,
    date: new Date().toISOString(),
    verified: false,
  };
  addReview(review);
  refreshLocalReviews();
  return { ok: true };
}

/** Returns false if this browser already voted this review helpful. */
export async function voteHelpful(id: string): Promise<boolean> {
  if (hasVotedHelpful(id)) return false;
  // Records the vote so this browser can't repeat it, regardless of where the
  // count itself ends up living (local store vs. database).
  markHelpful(id);
  refreshLocalReviews();
  try {
    const res = await fetch(`/api/reviews/${id}/helpful`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (data?.configured) bumpCachedHelpful(id);
  } catch {
    /* best-effort — the local vote already landed */
  }
  return true;
}

export async function reportReviewAction(id: string): Promise<void> {
  reportReview(id);
  refreshLocalReviews();
  try {
    const res = await fetch(`/api/reviews/${id}/report`, { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (data?.configured) markCachedReported(id);
  } catch {
    /* best-effort */
  }
}
