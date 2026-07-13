import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetReviews, dbCreateReview } from '@/lib/reviewsDb';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';
import { getClientIp } from '@/lib/security/request';
import { notify } from '@/lib/notify';

// GET → public review list. Database when configured, else the page falls back
// to its bundled browser store.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, reviews: [] });
  }
  const reviews = await dbGetReviews();
  if (reviews === null) {
    return NextResponse.json({ ok: true, configured: false, reviews: [] });
  }
  return NextResponse.json({ ok: true, configured: true, reviews });
}

const MAX_PHOTO_BYTES = 2 * 1024 * 1024; // 2 MB, base64-encoded data URL
const PHOTO_RE = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;

// Best-effort in-memory throttle: caps submissions per IP per warm serverless
// instance. Not a durable/distributed limit (resets on cold start / across
// instances) but stops a single burst of automated spam without needing a DB.
const RECENT_SUBMITS = new Map<string, number[]>();
const SUBMIT_WINDOW_MS = 10 * 60 * 1000;
const SUBMIT_MAX_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (RECENT_SUBMITS.get(ip) || []).filter((t) => now - t < SUBMIT_WINDOW_MS);
  hits.push(now);
  RECENT_SUBMITS.set(ip, hits);
  return hits.length > SUBMIT_MAX_PER_WINDOW;
}

// POST → customer submits a new review. Saved to the database when Supabase is
// configured; otherwise `configured: false` tells the client to persist it to
// the browser's local review store instead (same graceful-degradation pattern
// as leads/orders). New reviews start unverified — an admin verifies them from
// /admin/reviews before they show up in the public "verified" feed.
export async function POST(request: Request) {
  if (isBodyTooLarge(request, MAX_PHOTO_BYTES + 8 * 1024)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many reviews submitted. Please try again later.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  // Honeypot: a real visitor never fills this hidden field.
  if (String(body.website || '').trim()) {
    return NextResponse.json({ ok: true, configured: isSupabaseConfigured() });
  }

  const name = String(body.name || '').trim();
  const city = String(body.city || '').trim();
  const title = String(body.title || '').trim();
  const text = String(body.text || '').trim();
  const product = String(body.product || '').trim();
  const productId = String(body.productId || '').trim();
  const photo = String(body.photo || '').trim();
  const rating = Math.round(Number(body.rating));

  if (!name || name.length < 2) {
    return NextResponse.json({ ok: false, error: 'Please enter your name.' }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: 'Please select a star rating.' }, { status: 400 });
  }
  if (!text || text.length < 10) {
    return NextResponse.json(
      { ok: false, error: 'Please write at least 10 characters in your review.' },
      { status: 400 }
    );
  }
  const lengthError = checkLengths({
    Name: { value: name, max: MAX_LEN.short },
    City: { value: city, max: MAX_LEN.short },
    Title: { value: title, max: MAX_LEN.short },
    Review: { value: text, max: MAX_LEN.text },
    Product: { value: product, max: MAX_LEN.short },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }
  if (photo && (!PHOTO_RE.test(photo) || photo.length > MAX_PHOTO_BYTES)) {
    return NextResponse.json({ ok: false, error: 'Photo must be a JPEG, PNG, WEBP or GIF under 2 MB.' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    // No database yet — the client persists this to its local review store
    // itself (see lib/reviewsStore.ts's addReview) once it sees configured:false.
    return NextResponse.json({ ok: true, configured: false });
  }

  // Duplicate guard: reject the exact same name+text submitted twice in a row
  // (e.g. a double-click or a resubmitted form) rather than silently duplicating.
  const existing = await dbGetReviews();
  const isDuplicate = (existing || []).some(
    (r) => r.name.toLowerCase() === name.toLowerCase() && r.text.trim() === text
  );
  if (isDuplicate) {
    return NextResponse.json({ ok: false, error: 'This review has already been submitted.' }, { status: 409 });
  }

  const created = await dbCreateReview({
    name,
    city,
    rating,
    title: title || undefined,
    text,
    product: product || undefined,
    productId: productId || undefined,
    photo: photo || undefined,
    verified: false,
  });
  if (!created) {
    return NextResponse.json({ ok: false, error: 'Could not save your review. Please try again.' }, { status: 502 });
  }

  notify('new_review', `${name} left a ${rating}-star review${product ? ` on ${product}` : ''}.`, {
    link: '/admin/reviews',
  }).catch(() => {});

  return NextResponse.json({ ok: true, configured: true, review: created });
}
