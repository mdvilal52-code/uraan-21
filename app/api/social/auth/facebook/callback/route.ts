import { type NextRequest, NextResponse } from 'next/server';
import { exchangeFacebookCode } from '@/lib/social/facebook.service';
import { exchangeInstagramAccess } from '@/lib/social/instagram.service';
import { getToken } from '@/lib/social/tokens';
import { SITE_URL } from '@/lib/site';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${SITE_URL}/admin/social?error=facebook_denied`);
  }
  try {
    // Store Facebook token first
    await exchangeFacebookCode(code);

    // Automatically try to link Instagram Business account
    const fbToken = await getToken('facebook');
    if (fbToken?.accessToken && fbToken.pageId) {
      try {
        await exchangeInstagramAccess(fbToken.accessToken, fbToken.pageId);
      } catch {
        // Instagram linking is optional — continue even if it fails
      }
    }

    return NextResponse.redirect(`${SITE_URL}/admin/social?connected=facebook`);
  } catch (err) {
    const msg = encodeURIComponent(err instanceof Error ? err.message : 'Facebook connection failed');
    return NextResponse.redirect(`${SITE_URL}/admin/social?error=${msg}`);
  }
}
