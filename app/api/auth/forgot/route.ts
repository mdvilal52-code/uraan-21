import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { passwordResetEmail } from '@/lib/security/emails';
import { assertSameOrigin } from '@/lib/security/csrf';

// POST → start a customer "forgot password" reset. Emails a reset link for the
// storefront account. Two delivery paths, tried in order:
//   1. Generate a one-time Supabase recovery link with the service role and
//      send it through our own provider (Resend) — best deliverability.
//   2. Fall back to Supabase Auth's built-in email (needs SMTP configured in
//      the Supabase dashboard) when Resend isn't set up.
//
// The response is always a generic success so the endpoint can't be used to
// probe which addresses have accounts. Node runtime (service-role client).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Bad origin.' }, { status: 403 });
  }
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      { ok: false, error: 'Password reset is not available on this deployment.' },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const origin = request.headers.get('origin') || new URL(request.url).origin;
  const redirectTo = `${origin}/reset-password`;

  // Uniform response — never reveal whether the email maps to an account.
  const generic = NextResponse.json({ ok: true });
  if (!EMAIL_RE.test(email)) return generic;

  // Path 1: recovery link generated with the service role, emailed via Resend.
  const service = getSupabase();
  if (service && isEmailConfigured()) {
    try {
      const { data, error } = await service.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      });
      const link = data?.properties?.action_link;
      if (!error && link) {
        const { subject, html } = passwordResetEmail({ link, scope: 'account' });
        const sent = await sendEmail(email, subject, html);
        if (sent) return generic;
      }
    } catch {
      /* fall through to Supabase's built-in email */
    }
  }

  // Path 2: Supabase Auth's built-in email (needs SMTP configured in Supabase).
  try {
    const sb = createServerSupabase();
    await sb.auth.resetPasswordForEmail(email, { redirectTo });
  } catch {
    /* swallow — the response stays uniform regardless of outcome */
  }

  return generic;
}
