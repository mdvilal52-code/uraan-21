// Publishes a video to selected platforms. Runs sequentially with retry logic.
// Creates a social_posts DB record and updates status per platform.

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { requireRole } from '@/lib/security/guard';
import { runPublishJob, type SocialPlatform } from '@/lib/social/publishJob';

interface PublishBody {
  mediaId: string;
  videoUrl: string;
  title: string;
  caption: string;
  hashtags?: string[];
  platforms: SocialPlatform[];
  publishMode?: 'now' | 'scheduled' | 'draft';
  scheduledAt?: string;
  timezone?: string;
  thumbnailUrl?: string;
  ytCategoryId?: string;
  ytVisibility?: 'public' | 'private' | 'unlisted';
  ytTags?: string[];
  ytIsShorts?: boolean;
  ytMadeForKids?: boolean;
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('staff');
  if ('error' in auth) return auth.error;

  let body: PublishBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    mediaId, videoUrl, title, caption, hashtags = [], platforms,
    publishMode = 'now', scheduledAt, timezone, thumbnailUrl,
    ytCategoryId, ytVisibility, ytTags, ytIsShorts, ytMadeForKids,
  } = body;

  if (!videoUrl || !platforms?.length) {
    return NextResponse.json({ error: 'videoUrl and platforms are required' }, { status: 400 });
  }

  const db = isSupabaseConfigured() ? getSupabase() : null;

  let postId: string = crypto.randomUUID();
  if (db) {
    const { data } = await db.from('social_posts').insert({
      media_id: mediaId || null,
      title,
      caption,
      hashtags,
      thumbnail_url: thumbnailUrl,
      platforms,
      publish_mode: publishMode,
      scheduled_at: scheduledAt ?? null,
      timezone: timezone ?? 'Asia/Kolkata',
      yt_category_id: ytCategoryId ?? '22',
      yt_visibility: ytVisibility ?? 'public',
      yt_tags: ytTags ?? [],
      yt_is_shorts: ytIsShorts ?? false,
      yt_made_for_kids: ytMadeForKids ?? false,
      yt_status:  platforms.includes('youtube')   ? 'uploading' : 'skipped',
      fb_status:  platforms.includes('facebook')  ? 'uploading' : 'skipped',
      ig_status:  platforms.includes('instagram') ? 'uploading' : 'skipped',
    }).select('id').single();
    if (data) postId = data.id;
  }

  if (publishMode === 'draft') {
    return NextResponse.json({ postId, status: 'draft' });
  }

  if (publishMode === 'scheduled' && scheduledAt) {
    return NextResponse.json({ postId, status: 'scheduled' });
  }

  runPublishJob({
    postId, videoUrl, title, caption, hashtags, platforms, thumbnailUrl,
    ytCategoryId, ytVisibility, ytTags, ytIsShorts, ytMadeForKids,
  }).catch((e) => console.error('[social/publish]', e));

  return NextResponse.json({ postId, status: 'publishing' });
}
