import { type NextRequest, NextResponse } from 'next/server';
import { exchangeYouTubeCode } from '@/lib/social/youtube.service';
import { SITE_URL } from '@/lib/site';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code          = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error         = searchParams.get('error');

  // Verify CSRF state
  const savedState = req.cookies.get('yt_oauth_state')?.value;
  if (!savedState || !returnedState || savedState !== returnedState) {
    const res = NextResponse.redirect(`${SITE_URL}/admin/social?error=invalid_state`);
    res.cookies.delete('yt_oauth_state');
    return res;
  }

  const redirect = (path: string) => {
    const res = NextResponse.redirect(`${SITE_URL}${path}`);
    res.cookies.delete('yt_oauth_state');
    return res;
  };

  if (error || !code) {
    return redirect('/admin/social?error=youtube_denied');
  }

  try {
    await exchangeYouTubeCode(code);
    return redirect('/admin/social?connected=youtube');
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'YouTube connection failed');
    return redirect(`/admin/social?error=${msg}`);
  }
}
