import { type NextRequest, NextResponse } from 'next/server';
import { exchangeFacebookCode } from '@/lib/social/facebook.service';
import { exchangeInstagramAccess } from '@/lib/social/instagram.service';
import { getToken } from '@/lib/social/tokens';
import { SITE_URL } from '@/lib/site';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code         = searchParams.get('code');
  const returnedState = searchParams.get('state');
  const error        = searchParams.get('error');

  // Verify CSRF state
  const savedState = req.cookies.get('fb_oauth_state')?.value;
  if (!savedState || !returnedState || savedState !== returnedState) {
    const res = NextResponse.redirect(`${SITE_URL}/admin/social?error=invalid_state`);
    res.cookies.delete('fb_oauth_state');
    return res;
  }

  const redirect = (path: string) => {
    const res = NextResponse.redirect(`${SITE_URL}${path}`);
    res.cookies.delete('fb_oauth_state');
    return res;
  };

  if (error || !code) {
    return redirect('/admin/social?error=facebook_denied');
  }

  try {
    await exchangeFacebookCode(code);

    const fbToken = await getToken('facebook');
    if (fbToken?.accessToken && fbToken.pageId) {
      try {
        await exchangeInstagramAccess(fbToken.accessToken, fbToken.pageId);
      } catch {
        // Instagram linking is optional — continue even if it fails
      }
    }

    return redirect('/admin/social?connected=facebook');
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'Facebook connection failed');
    return redirect(`/admin/social?error=${msg}`);
  }
}
