import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/config';
import { SITE_URL } from '@/lib/site';

// Customer-facing OAuth callback (Google/Facebook sign-in via Supabase Auth),
// separate from the admin login flow handled in middleware.ts. Exchanges the
// auth code for a session (sets Supabase cookies), then hands off to a client
// page that bridges the verified identity into the site's existing
// localStorage profile store so cart/checkout/profile keep working unchanged.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/profile';

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/login?error=oauth_failed`);
  }

  const cookieStore = cookies();
  const response = NextResponse.redirect(
    `${SITE_URL}/login/oauth-complete?next=${encodeURIComponent(next)}`
  );

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${SITE_URL}/login?error=oauth_failed`);
  }

  return response;
}
