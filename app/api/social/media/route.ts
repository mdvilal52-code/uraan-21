// Returns the media library (uploaded videos) for the social dashboard.

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ media: [], total: 0 });
  }

  const db = getSupabase()!;
  const { data, error, count } = await db
    .from('social_media')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ media: data ?? [], total: count ?? 0, page, limit });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('id');
  if (!mediaId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const db = getSupabase()!;
  const { data: media } = await db.from('social_media').select('storage_path').eq('id', mediaId).single();
  if (media?.storage_path) {
    await db.storage.from('social-videos').remove([media.storage_path]);
  }
  await db.from('social_media').delete().eq('id', mediaId);
  return NextResponse.json({ ok: true });
}
