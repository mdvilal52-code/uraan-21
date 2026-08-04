import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, adminSessionToken } from '@/lib/adminAuth';
import { isSupabaseAuthConfigured, createMiddlewareSupabase } from '@/lib/supabase/middleware';
import { assertSameOrigin } from '@/lib/security/csrf';
import { mfaStepUpRequired } from '@/lib/security/mfa';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── CSRF protection for API mutations (#28). External webhooks are exempt
  //    because they legitimately arrive cross-origin. ──
  if (pathname.startsWith('/api/')) {
    const method = request.method.toUpperCase();
    const isMutation = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';
    const isWebhook = pathname.startsWith('/api/whatsapp/webhook');
    if (isMutation && !isWebhook && !assertSameOrigin(request)) {
      return NextResponse.json({ ok: false, error: 'Invalid origin.' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // ── /admin route protection ──
  // Login and the password-reset landing page must be reachable while signed
  // out (reset-password relies on a short-lived Supabase recovery session,
  // not a full admin session, so it can't go through the checks below).
  if (pathname === '/admin/login' || pathname === '/admin/reset-password') {
    return NextResponse.next();
  }

  // 1) Legacy break-glass cookie. adminSessionToken() returns null when
  // break-glass is disabled (production without ADMIN_SESSION_SECRET set),
  // which keeps a forged empty cookie from ever matching.
  const legacyToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const expected = await adminSessionToken();
  const legacyAllowed = Boolean(legacyToken) && expected !== null && legacyToken === expected;
  if (legacyAllowed) {
    return NextResponse.next();
  }

  // 2) Supabase Auth admin session (only when configured).
  if (isSupabaseAuthConfigured()) {
    const { supabase, response } = createMiddlewareSupabase(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const { data: admin } = await supabase
        .from('admin_users')
        .select('role,status')
        .ilike('email', user.email)
        .maybeSingle();

      if (admin && admin.status === 'active') {
        // Enforce 2FA server-side: an admin with a verified TOTP factor must
        // complete the code challenge (reach AAL2) before any /admin surface —
        // otherwise a password-only (AAL1) session could bypass the second
        // factor by navigating straight here. The login page handles the
        // step-up prompt.
        if (await mfaStepUpRequired(supabase)) {
          return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        return response;
      }
    }
  }

  return NextResponse.redirect(new URL('/admin/login', request.url));
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
