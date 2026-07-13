import { NextResponse } from 'next/server';
import { dbSetReviewVerified, dbDeleteReview } from '@/lib/reviewsDb';
import { isAdminRequest } from '@/lib/adminApi';

// PATCH → verify / unverify a review (admin only).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const ok = await dbSetReviewVerified(params.id, Boolean(body.verified));
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update review.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// DELETE → remove a review (admin only).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const ok = await dbDeleteReview(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not delete review.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
