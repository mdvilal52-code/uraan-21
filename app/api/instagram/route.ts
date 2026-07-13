import { NextResponse } from 'next/server';

// Server-side Instagram feed. The access token stays on the server.
// Set INSTAGRAM_ACCESS_TOKEN (a long-lived Instagram Graph API token) in
// Vercel env vars. Without it, returns an empty list and the gallery
// falls back to curated images. Cached for 1 hour.

export const revalidate = 3600;

interface IgMedia {
  id: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
}

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ configured: false, posts: [] });
  }

  try {
    const url =
      `https://graph.instagram.com/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption&limit=8&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json({ configured: true, posts: [], error: `Instagram ${res.status}` });
    }

    const data = (await res.json()) as { data?: IgMedia[] };
    const posts = (data.data || [])
      .filter((m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM' || m.media_type === 'VIDEO')
      .slice(0, 6)
      .map((m) => ({
        id: m.id,
        image: m.media_type === 'VIDEO' ? m.thumbnail_url || m.media_url : m.media_url,
        permalink: m.permalink,
        caption: (m.caption || '').slice(0, 120),
      }));

    return NextResponse.json({ configured: true, posts });
  } catch {
    return NextResponse.json({ configured: true, posts: [], error: 'Could not reach Instagram' });
  }
}
