// Facebook Graph API v18.0 — video/reel upload service.
// Requires a Facebook Page access token (not a user token).

import { getToken, saveToken, isTokenExpired, type PlatformToken } from './tokens';

const APP_ID      = process.env.FACEBOOK_APP_ID      || '';
const APP_SECRET  = process.env.FACEBOOK_APP_SECRET  || '';
const REDIRECT_URI = process.env.FACEBOOK_REDIRECT_URI || '';

export interface FacebookUploadOptions {
  videoUrl: string;
  title: string;
  description: string;
  scheduledAt?: Date;
  isReel?: boolean;
}

export interface FacebookResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

// ─── OAuth ──────────────────────────────────────────────────────────────────

export function getFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    state,
    scope: [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'pages_manage_metadata',
      'publish_video',
      'instagram_basic',
      'instagram_content_publish',
    ].join(','),
    response_type: 'code',
  });
  return `https://www.facebook.com/v18.0/dialog/oauth?${params}`;
}

export async function exchangeFacebookCode(code: string): Promise<void> {
  // Step 1: Exchange code for short-lived user token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${APP_SECRET}&code=${code}`
  );
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.error?.message || 'Facebook token exchange failed');
  const userToken = tokenData.access_token;

  // Step 2: Exchange for long-lived token
  const longRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${userToken}`
  );
  const longData = await longRes.json();
  const longToken = longData.access_token;

  // Step 3: Get managed pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${longToken}`
  );
  const pagesData = await pagesRes.json();
  const page = pagesData.data?.[0];
  if (!page) throw new Error('No Facebook Page found. Please ensure you manage at least one page.');

  // Page token is already long-lived (60 days) when exchanged from a long-lived user token
  const pageToken = page.access_token;

  // Get page follower count
  const pageInfoRes = await fetch(
    `https://graph.facebook.com/v18.0/${page.id}?fields=fan_count,picture&access_token=${pageToken}`
  );
  const pageInfo = await pageInfoRes.json();

  await saveToken({
    platform: 'facebook',
    accessToken: pageToken,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // ~60 days
    pageId: page.id,
    pageName: page.name,
    profileImage: pageInfo.picture?.data?.url,
    followers: pageInfo.fan_count ?? 0,
  });
}

export async function refreshFacebookToken(token: PlatformToken): Promise<PlatformToken> {
  // Facebook page tokens don't expire if generated from a long-lived user token.
  // If needed, re-auth is the only option (no silent refresh for page tokens).
  return token;
}

async function getValidToken(): Promise<PlatformToken> {
  const token = await getToken('facebook');
  if (!token) throw new Error('Facebook not connected. Please connect your Page first.');
  return token;
}

// ─── Video Upload ────────────────────────────────────────────────────────────

export async function uploadToFacebook(opts: FacebookUploadOptions): Promise<FacebookResult> {
  try {
    const token = await getValidToken();
    const pageId = token.pageId;
    if (!pageId) throw new Error('Facebook page ID not found in stored token.');

    if (opts.isReel) {
      return await uploadFacebookReel(token, pageId, opts);
    }
    return await uploadFacebookVideo(token, pageId, opts);
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function uploadFacebookVideo(
  token: PlatformToken,
  pageId: string,
  opts: FacebookUploadOptions
): Promise<FacebookResult> {
  // Download video
  const videoRes = await fetch(opts.videoUrl);
  if (!videoRes.ok) throw new Error('Failed to download video');
  const videoBuffer = await videoRes.arrayBuffer();

  const body = new FormData();
  body.append('access_token', token.accessToken);
  body.append('title', opts.title.slice(0, 255));
  body.append('description', opts.description.slice(0, 10000));
  body.append('source', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4');
  if (opts.scheduledAt) {
    body.append('scheduled_publish_time', String(Math.floor(opts.scheduledAt.getTime() / 1000)));
    body.append('published', 'false');
  } else {
    body.append('published', 'true');
  }

  const res = await fetch(`https://graph.facebook.com/v18.0/${pageId}/videos`, {
    method: 'POST',
    body,
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Facebook video upload failed');
  }

  return {
    success: true,
    postId: data.id,
    url: `https://www.facebook.com/video/${data.id}`,
  };
}

async function uploadFacebookReel(
  token: PlatformToken,
  pageId: string,
  opts: FacebookUploadOptions
): Promise<FacebookResult> {
  // Step 1: Init upload session
  const initRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_phase: 'start', access_token: token.accessToken }),
  });
  const initData = await initRes.json();
  if (!initRes.ok) throw new Error(initData.error?.message || 'Reel upload init failed');
  const uploadSessionId = initData.video_id;

  // Step 2: Upload video bytes
  const videoRes = await fetch(opts.videoUrl);
  if (!videoRes.ok) throw new Error('Failed to download video');
  const videoBuffer = await videoRes.arrayBuffer();

  await fetch(`https://rupload.facebook.com/video-upload/v18.0/${uploadSessionId}`, {
    method: 'POST',
    headers: {
      Authorization: `OAuth ${token.accessToken}`,
      offset: '0',
      file_size: String(videoBuffer.byteLength),
      'Content-Type': 'video/mp4',
    },
    body: videoBuffer,
  });

  // Step 3: Publish
  const publishRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/video_reels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      upload_phase: 'finish',
      access_token: token.accessToken,
      video_id: uploadSessionId,
      title: opts.title.slice(0, 255),
      description: opts.description,
      video_state: 'PUBLISHED',
    }),
  });
  const publishData = await publishRes.json();
  if (!publishRes.ok) throw new Error(publishData.error?.message || 'Reel publish failed');

  return {
    success: true,
    postId: uploadSessionId,
    url: `https://www.facebook.com/reel/${uploadSessionId}`,
  };
}
