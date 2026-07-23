// Shared publish job — called by both the initial POST and the retry PATCH.
// Extracted here so retry can re-trigger real uploads, not just reset DB status.

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { uploadToYouTube } from './youtube.service';
import { uploadToFacebook } from './facebook.service';
import { uploadToInstagram } from './instagram.service';

export type SocialPlatform = 'youtube' | 'facebook' | 'instagram';

export interface PublishJobInput {
  postId: string;
  videoUrl: string;
  title: string;
  caption: string;
  hashtags?: string[];
  platforms: SocialPlatform[];
  thumbnailUrl?: string;
  ytCategoryId?: string;
  ytVisibility?: 'public' | 'private' | 'unlisted';
  ytTags?: string[];
  ytIsShorts?: boolean;
  ytMadeForKids?: boolean;
  onlyPlatforms?: SocialPlatform[];
}

const MAX_RETRIES = 3;

export async function runPublishJob(input: PublishJobInput): Promise<void> {
  const db = isSupabaseConfigured() ? getSupabase() : null;
  const {
    postId, videoUrl, title, caption, hashtags = [], platforms, thumbnailUrl,
    ytCategoryId, ytVisibility, ytTags, ytIsShorts, ytMadeForKids, onlyPlatforms,
  } = input;

  const toRun = onlyPlatforms ?? platforms;
  const hashtagString = hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  const fullCaption = `${caption}\n\n${hashtagString}`.trim();

  if (toRun.includes('youtube')) {
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
        await updateStatus(db, postId, 'yt', 'published', r.videoId, r.url);
        break;
      }
      if (attempt >= MAX_RETRIES) {
        await updateStatus(db, postId, 'yt', 'failed', undefined, undefined, r.error);
      } else {
        await sleep(attempt * 5000);
      }
    }
  }

  if (toRun.includes('facebook')) {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      const r = await uploadToFacebook({ videoUrl, title, description: fullCaption });
      await log(db, postId, 'facebook', attempt, r.success ? 'published' : 'failed', r.error);
      if (r.success) {
        await updateStatus(db, postId, 'fb', 'published', r.postId, r.url);
        break;
      }
      if (attempt >= MAX_RETRIES) {
        await updateStatus(db, postId, 'fb', 'failed', undefined, undefined, r.error);
      } else {
        await sleep(attempt * 5000);
      }
    }
  }

  if (toRun.includes('instagram')) {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      const r = await uploadToInstagram({ videoUrl, caption: fullCaption, coverImageUrl: thumbnailUrl });
      await log(db, postId, 'instagram', attempt, r.success ? 'published' : 'failed', r.error);
      if (r.success) {
        await updateStatus(db, postId, 'ig', 'published', r.mediaId, r.url);
        break;
      }
      if (attempt >= MAX_RETRIES) {
        await updateStatus(db, postId, 'ig', 'failed', undefined, undefined, r.error);
      } else {
        await sleep(attempt * 5000);
      }
    }
  }

  if (db) {
    await db.from('social_posts').update({ published_at: new Date().toISOString() }).eq('id', postId);
  }
}

function updateStatus(
  db: ReturnType<typeof getSupabase>,
  postId: string,
  prefix: 'yt' | 'fb' | 'ig',
  status: string,
  id?: string,
  url?: string,
  error?: string,
) {
  if (!db) return Promise.resolve();
  const update: Record<string, unknown> = { [`${prefix}_status`]: status };
  if (id)    update[prefix === 'yt' ? 'yt_video_id' : prefix === 'fb' ? 'fb_post_id' : 'ig_media_id'] = id;
  if (url)   update[`${prefix}_url`] = url;
  if (error) update[`${prefix}_error`] = error;
  return db.from('social_posts').update(update).eq('id', postId);
}

function log(
  db: ReturnType<typeof getSupabase>,
  postId: string,
  platform: string,
  attempt: number,
  status: string,
  message?: string,
) {
  if (!db) return Promise.resolve();
  return db.from('social_publish_logs').insert({
    post_id: postId, platform, attempt, status, message: message ?? null,
  });
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
