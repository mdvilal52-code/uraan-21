import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbMarkHelpful } from '@/lib/reviewsDb';

// POST → any visitor can mark a review helpful. The client itself prevents a
// repeat vote from the same browser (see reviewsStore.markHelpful); this route
// just persists the count when a database is configured, matching the same
// graceful-degradation pattern as review creation.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }
  const ok = await dbMarkHelpful(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update review.' }, { status: 502 });
  return NextResponse.json({ ok: true, configured: true });
}
