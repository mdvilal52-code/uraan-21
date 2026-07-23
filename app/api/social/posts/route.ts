// Returns publish history and per-post status for the social dashboard.

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { requireRole } from '@/lib/security/guard';
import { runPublishJob, type SocialPlatform } from '@/lib/social/publishJob';

export async function GET(req: NextRequest) {
  const auth = await requireRole('staff');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('id');
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit  = Math.min(50, parseInt(searchParams.get('limit') ?? '20', 10));
  const offset = (page - 1) * limit;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ posts: [], total: 0 });
  }

  const db = getSupabase()!;

  if (postId) {
    const { data, error } = await db.from('social_posts').select('*').eq('id', postId).single();
    if (error) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    const { data: logs } = await db
      .from('social_publish_logs')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    return NextResponse.json({ post: data, logs: logs ?? [] });
  }

  const { data, error, count } = await db
    .from('social_posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [], total: count ?? 0, page, limit });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole('staff');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('id');
  if (!postId) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const db = getSupabase()!;
  const { data: post } = await db
    .from('social_posts')
    .select('*, social_media(public_url)')
    .eq('id', postId)
    .single();
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const failedPlatforms: SocialPlatform[] = [];
  const update: Record<string, string> = {};

  if (post.yt_status === 'failed') { update.yt_status = 'uploading'; failedPlatforms.push('youtube'); }
  if (post.fb_status === 'failed') { update.fb_status = 'uploading'; failedPlatforms.push('facebook'); }
  if (post.ig_status === 'failed') { update.ig_status = 'uploading'; failedPlatforms.push('instagram'); }

  if (!failedPlatforms.length) {
    return NextResponse.json({ error: 'No failed platforms to retry' }, { status: 400 });
  }

  const videoUrl: string = post.social_media?.public_url ?? '';
  if (!videoUrl) {
    return NextResponse.json({ error: 'Video URL not found — cannot retry' }, { status: 422 });
  }

  await db.from('social_posts').update(update).eq('id', postId);

  // Actually re-trigger the upload for failed platforms — don't just reset DB status
  runPublishJob({
    postId,
    videoUrl,
    title: post.title ?? '',
    caption: post.caption ?? '',
    hashtags: post.hashtags ?? [],
    platforms: post.platforms ?? failedPlatforms,
    thumbnailUrl: post.thumbnail_url ?? undefined,
    ytCategoryId: post.yt_category_id ?? undefined,
    ytVisibility: post.yt_visibility ?? 'public',
    ytTags: post.yt_tags ?? [],
    ytIsShorts: post.yt_is_shorts ?? false,
    ytMadeForKids: post.yt_made_for_kids ?? false,
    onlyPlatforms: failedPlatforms,
  }).catch((e) => console.error('[social/retry]', e));

  return NextResponse.json({ ok: true, postId, retrying: failedPlatforms });
}
