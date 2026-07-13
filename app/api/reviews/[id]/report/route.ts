import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbReportReview } from '@/lib/reviewsDb';

// POST → any visitor can flag a review as inappropriate for admin moderation
// (see app/admin/reviews). Reporting never removes the review itself — only an
// admin can delete it from /admin/reviews.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }
  const ok = await dbReportReview(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not report review.' }, { status: 502 });
  return NextResponse.json({ ok: true, configured: true });
}
