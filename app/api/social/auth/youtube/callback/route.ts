import { type NextRequest, NextResponse } from 'next/server';
import { exchangeYouTubeCode } from '@/lib/social/youtube.service';
import { SITE_URL } from '@/lib/site';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${SITE_URL}/admin/social?error=youtube_denied`);
  }
  try {
    await exchangeYouTubeCode(code);
    return NextResponse.redirect(`${SITE_URL}/admin/social?connected=youtube`);
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'YouTube connection failed');
    return NextResponse.redirect(`${SITE_URL}/admin/social?error=${msg}`);
  }
}
