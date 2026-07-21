// Publishes a video to selected platforms. Runs sequentially with retry logic.
// Creates a social_posts DB record and updates status per platform.

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadToYouTube } from '@/lib/social/youtube.service';
import { uploadToFacebook } from '@/lib/social/facebook.service';
import { uploadToInstagram } from '@/lib/social/instagram.service';

const MAX_RETRIES = 3;

interface PublishBody {
  mediaId: string;
  videoUrl: string;
  title: string;
  caption: string;
  hashtags?: string[];
  platforms: ('youtube' | 'facebook' | 'instagram')[];
  publishMode?: 'now' | 'scheduled' | 'draft';
  scheduledAt?: string;
  timezone?: string;
  thumbnailUrl?: string;
  // YouTube-specific
  ytCategoryId?: string;
  ytVisibility?: 'public' | 'private' | 'unlisted';
  ytTags?: string[];
  ytIsShorts?: boolean;
  ytMadeForKids?: boolean;
}

export async function POST(req: NextRequest) {
  let body: PublishBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { mediaId, videoUrl, title, caption, hashtags = [], platforms, publishMode = 'now',
    scheduledAt, timezone, thumbnailUrl, ytCategoryId, ytVisibility, ytTags, ytIsShorts, ytMadeForKids } = body;

  if (!videoUrl || !platforms?.length) {
    return NextResponse.json({ error: 'videoUrl and platforms are required' }, { status: 400 });
  }

  const db = isSupabaseConfigured() ? getSupabase() : null;

  // Create post record
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

  const hashtagString = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  const fullCaption = `${caption}\n\n${hashtagString}`.trim();

  // Run uploads (fire & forget for long uploads — return postId immediately)
  const doPublish = async () => {
    const results: Record<string, unknown> = {};

    if (platforms.includes('youtube')) {
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        attempt++;
        const r = await uploadToYouTube({
          videoUrl, title, description: fullCaption,
          tags: ytTags, categoryId: ytCategoryId, visibility: ytVisibility,
          isShorts: ytIsShorts, madeForKids: ytMadeForKids, thumbnailUrl,
        });
        await log(db, postId, 'youtube', attempt, r.success ? 'published' : 'failed', r.error);
        if (r.success) {
          results.youtube = r;
          await updateStatus(db, postId, 'yt', 'published', r.videoId, r.url);
          break;
        }
        if (attempt >= MAX_RETRIES) {
          results.youtube = r;
          await updateStatus(db, postId, 'yt', 'failed', undefined, undefined, r.error);
        } else {
          await sleep(attempt * 5000);
        }
      }
    }

    if (platforms.includes('facebook')) {
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        attempt++;
        const r = await uploadToFacebook({ videoUrl, title, description: fullCaption });
        await log(db, postId, 'facebook', attempt, r.success ? 'published' : 'failed', r.error);
        if (r.success) {
          results.facebook = r;
          await updateStatus(db, postId, 'fb', 'published', r.postId, r.url);
          break;
        }
        if (attempt >= MAX_RETRIES) {
          results.facebook = r;
          await updateStatus(db, postId, 'fb', 'failed', undefined, undefined, r.error);
        } else {
          await sleep(attempt * 5000);
        }
      }
    }

    if (platforms.includes('instagram')) {
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        attempt++;
        const r = await uploadToInstagram({ videoUrl, caption: fullCaption, coverImageUrl: thumbnailUrl });
        await log(db, postId, 'instagram', attempt, r.success ? 'published' : 'failed', r.error);
        if (r.success) {
          results.instagram = r;
          await updateStatus(db, postId, 'ig', 'published', r.mediaId, r.url);
          break;
        }
        if (attempt >= MAX_RETRIES) {
          results.instagram = r;
          await updateStatus(db, postId, 'ig', 'failed', undefined, undefined, r.error);
        } else {
          await sleep(attempt * 5000);
        }
      }
    }

    if (db) {
      await db.from('social_posts').update({ published_at: new Date().toISOString() }).eq('id', postId);
    }
  };

  // Start publish in background
  doPublish().catch((e) => console.error('[social/publish]', e));

  return NextResponse.json({ postId, status: 'publishing' });
}

async function updateStatus(
  db: ReturnType<typeof getSupabase>,
  postId: string,
  prefix: 'yt' | 'fb' | 'ig',
  status: string,
  id?: string,
  url?: string,
  error?: string
) {
  if (!db) return;
  const update: Record<string, unknown> = { [`${prefix}_status`]: status };
  if (id)    update[prefix === 'yt' ? 'yt_video_id' : prefix === 'fb' ? 'fb_post_id' : 'ig_media_id'] = id;
  if (url)   update[`${prefix}_url`] = url;
  if (error) update[`${prefix}_error`] = error;
  await db.from('social_posts').update(update).eq('id', postId);
}

async function log(
  db: ReturnType<typeof getSupabase>,
  postId: string,
  platform: string,
  attempt: number,
  status: string,
  message?: string
) {
  if (!db) return;
  await db.from('social_publish_logs').insert({ post_id: postId, platform, attempt, status, message: message ?? null });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
