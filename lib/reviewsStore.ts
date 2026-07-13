// Browser-persisted review moderation store (localStorage), so verify / unverify
// and delete actions in the admin panel survive a refresh without a backend.
// Seeded from the bundled reviews — the same pattern used by lib/leads.ts.
import { reviews as seedReviews, type Review } from '@/data/jewelleryData';

export type { Review };

const KEY = 'ogp_reviews';

function read(): Review[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Review[]) : null;
  } catch {
    return null;
  }
}

function write(list: Review[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getReviews(): Review[] {
  const stored = read();
  if (stored) return stored;
  write(seedReviews);
  return seedReviews;
}

export function setReviewVerified(id: string, verified: boolean): void {
  write(getReviews().map((r) => (r.id === id ? { ...r, verified } : r)));
}

export function deleteReview(id: string): void {
  write(getReviews().filter((r) => r.id !== id));
}

// Customer-submitted review, persisted locally when there's no database
// configured yet (see lib/reviewsDb.ts for the Supabase path). New reviews are
// unverified by default — an admin verifies them from /admin/reviews.
export function addReview(review: Review): void {
  write([review, ...getReviews()]);
}

const HELPFUL_VOTED_KEY = 'ogp_reviews_helpful_voted';

function votedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(HELPFUL_VOTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** Marks a review helpful once per browser; returns false if already voted. */
export function markHelpful(id: string): boolean {
  const voted = votedIds();
  if (voted.has(id)) return false;
  voted.add(id);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(HELPFUL_VOTED_KEY, JSON.stringify([...voted]));
    } catch {
      /* ignore */
    }
  }
  write(getReviews().map((r) => (r.id === id ? { ...r, helpful: (r.helpful || 0) + 1 } : r)));
  return true;
}

export function hasVotedHelpful(id: string): boolean {
  return votedIds().has(id);
}

export function reportReview(id: string): void {
  write(getReviews().map((r) => (r.id === id ? { ...r, reported: true } : r)));
}
