// YouTube Data API v3 — video upload service.
// Uses OAuth2 with offline access so we can refresh tokens server-side.

import { getToken, saveToken, isTokenExpired, type PlatformToken } from './tokens';

const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID     || '';
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET || '';
const REDIRECT_URI  = process.env.YOUTUBE_REDIRECT_URI  || '';

export interface YouTubeUploadOptions {
  videoUrl: string;       // public URL to download the video from (Supabase storage)
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;    // default '22' = People & Blogs
  visibility?: 'public' | 'private' | 'unlisted';
  isShorts?: boolean;
  madeForKids?: boolean;
  thumbnailUrl?: string;
}

export interface YouTubeResult {
  success: boolean;
  videoId?: string;
  url?: string;
  error?: string;
}

// ─── OAuth helpers ──────────────────────────────────────────────────────────

export function getYouTubeAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeYouTubeCode(code: string): Promise<void> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'YouTube token exchange failed');

  // Fetch channel info
  const channelRes = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
    { headers: { Authorization: `Bearer ${data.access_token}` } }
  );
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];

  await saveToken({
    platform: 'youtube',
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
    pageId: channel?.id,
    pageName: channel?.snippet?.title,
    profileImage: channel?.snippet?.thumbnails?.default?.url,
    followers: parseInt(channel?.statistics?.subscriberCount || '0'),
    scopes: data.scope,
  });
}

export async function refreshYouTubeToken(token: PlatformToken): Promise<PlatformToken> {
  if (!token.refreshToken) throw new Error('No refresh token available');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: token.refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'YouTube token refresh failed');
  const updated: PlatformToken = {
    ...token,
    accessToken: data.access_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
  await saveToken(updated);
  return updated;
}

async function getValidToken(): Promise<PlatformToken> {
  let token = await getToken('youtube');
  if (!token) throw new Error('YouTube not connected. Please connect your account first.');
  if (isTokenExpired(token)) token = await refreshYouTubeToken(token);
  return token;
}

// ─── Upload ─────────────────────────────────────────────────────────────────

export async function uploadToYouTube(opts: YouTubeUploadOptions): Promise<YouTubeResult> {
  try {
    const token = await getValidToken();

    // Download video buffer from Supabase storage URL
    const videoRes = await fetch(opts.videoUrl);
    if (!videoRes.ok) throw new Error('Failed to download video from storage');
    const videoBuffer = await videoRes.arrayBuffer();
    const contentType = videoRes.headers.get('content-type') || 'video/mp4';

    // Step 1: Initiate resumable upload
    const meta = {
      snippet: {
        title: opts.title.slice(0, 100),
        description: opts.description.slice(0, 5000),
        tags: opts.tags ?? [],
        categoryId: opts.categoryId ?? '22',
      },
      status: {
        privacyStatus: opts.visibility ?? 'public',
        selfDeclaredMadeForKids: opts.madeForKids ?? false,
      },
    };

    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': contentType,
          'X-Upload-Content-Length': String(videoBuffer.byteLength),
        },
        body: JSON.stringify(meta),
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json();
      throw new Error(err.error?.message || 'YouTube upload init failed');
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) throw new Error('No upload URL returned by YouTube');

    // Step 2: Upload the video
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(videoBuffer.byteLength),
      },
      body: videoBuffer,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      throw new Error(err.error?.message || 'YouTube video upload failed');
    }

    const uploadData = await uploadRes.json();
    const videoId = uploadData.id;
    if (!videoId) throw new Error('No video ID returned by YouTube');

    // Step 3: Upload thumbnail if provided
    if (opts.thumbnailUrl) {
      try {
        const thumbRes = await fetch(opts.thumbnailUrl);
        const thumbBuffer = await thumbRes.arrayBuffer();
        await fetch(
          `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token.accessToken}`,
              'Content-Type': thumbRes.headers.get('content-type') || 'image/jpeg',
            },
            body: thumbBuffer,
          }
        );
      } catch {
        // Thumbnail failure is non-fatal
      }
    }

    return {
      success: true,
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
