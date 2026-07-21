// Instagram Graph API v18.0 — Reels upload service.
// Instagram Business accounts are accessed via the same Facebook Page token.
// Flow: Create media container → Poll until ready → Publish

import { getToken, saveToken, type PlatformToken } from './tokens';

export interface InstagramUploadOptions {
  videoUrl: string;
  caption: string;
  coverImageUrl?: string;
  shareToFeed?: boolean;
}

export interface InstagramResult {
  success: boolean;
  mediaId?: string;
  url?: string;
  error?: string;
}

// ─── Instagram token is stored under 'instagram' platform ───────────────────
// We reuse the Facebook page token; Instagram Business Account ID is stored as pageId.

export async function exchangeInstagramAccess(facebookPageToken: string, facebookPageId: string): Promise<void> {
  // Get the Instagram Business Account linked to the Facebook Page
  const igRes = await fetch(
    `https://graph.facebook.com/v18.0/${facebookPageId}?fields=instagram_business_account&access_token=${facebookPageToken}`
  );
  const igData = await igRes.json();
  const igAccountId = igData?.instagram_business_account?.id;
  if (!igAccountId) throw new Error('No Instagram Business Account linked to this Facebook Page.');

  // Get Instagram profile info
  const profileRes = await fetch(
    `https://graph.facebook.com/v18.0/${igAccountId}?fields=username,followers_count,profile_picture_url&access_token=${facebookPageToken}`
  );
  const profile = await profileRes.json();

  await saveToken({
    platform: 'instagram',
    accessToken: facebookPageToken,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    pageId: igAccountId,
    username: profile.username,
    profileImage: profile.profile_picture_url,
    followers: profile.followers_count ?? 0,
  });
}

async function getValidToken(): Promise<PlatformToken> {
  const token = await getToken('instagram');
  if (!token) throw new Error('Instagram not connected. Please connect via Facebook first.');
  return token;
}

// ─── Reel Upload ─────────────────────────────────────────────────────────────

export async function uploadToInstagram(opts: InstagramUploadOptions): Promise<InstagramResult> {
  try {
    const token = await getValidToken();
    const igAccountId = token.pageId;
    if (!igAccountId) throw new Error('Instagram Business Account ID not found.');

    // Step 1: Create media container
    const caption = opts.caption.slice(0, 2200);
    const containerBody: Record<string, string> = {
      media_type: 'REELS',
      video_url: opts.videoUrl,
      caption,
      access_token: token.accessToken,
      share_to_feed: opts.shareToFeed !== false ? 'true' : 'false',
    };
    if (opts.coverImageUrl) containerBody.cover_url = opts.coverImageUrl;

    const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(containerBody),
    });
    const containerData = await containerRes.json();
    if (!containerRes.ok || containerData.error) {
      throw new Error(containerData.error?.message || 'Instagram container creation failed');
    }
    const containerId = containerData.id;

    // Step 2: Poll until container is ready (max 20 retries × 10s = 200s)
    let status = '';
    for (let i = 0; i < 20; i++) {
      await sleep(10000);
      const statusRes = await fetch(
        `https://graph.facebook.com/v18.0/${containerId}?fields=status_code,status&access_token=${token.accessToken}`
      );
      const statusData = await statusRes.json();
      status = statusData.status_code;
      if (status === 'FINISHED') break;
      if (status === 'ERROR') throw new Error(`Instagram processing failed: ${statusData.status}`);
    }
    if (status !== 'FINISHED') throw new Error('Instagram video processing timed out (200s)');

    // Step 3: Publish
    const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igAccountId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: token.accessToken }),
    });
    const publishData = await publishRes.json();
    if (!publishRes.ok || publishData.error) {
      throw new Error(publishData.error?.message || 'Instagram publish failed');
    }

    const mediaId = publishData.id;
    return {
      success: true,
      mediaId,
      url: `https://www.instagram.com/reel/${mediaId}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
