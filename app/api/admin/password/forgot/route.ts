import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase/server';
import { isSupabaseAuthConfigured } from '@/lib/supabase/config';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { passwordResetEmail } from '@/lib/security/emails';
import { assertSameOrigin } from '@/lib/security/csrf';
import { getClientIp } from '@/lib/security/request';
import { logSecurityEvent } from '@/lib/audit';

// POST → start a "forgot password" reset. Sends a reset link to the admin's
// email. Two delivery paths, tried in order:
//   1. Generate a one-time Supabase recovery link with the service role and
//      email it through our own provider (Resend) — full control over
//      deliverability to Gmail/etc.
//   2. Fall back to Supabase Auth's built-in email (requires SMTP configured
//      in the Supabase dashboard) when Resend isn't set up.
//
// The response is always a generic success so the endpoint can't be used to
// probe which addresses have admin accounts. Node runtime (service-role client).
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
  const redirectTo = `${origin}/admin/reset-password`;
  const ip = getClientIp(request);

  // Uniform response — never reveal whether the email maps to an admin account.
  const generic = NextResponse.json({ ok: true });

  if (!EMAIL_RE.test(email)) return generic;

  // Only ever send a reset to a real, active admin.
  const service = getSupabase();
  let isAdmin = false;
  if (service) {
    try {
      const { data } = await service
        .from('admin_users')
        .select('status')
        .ilike('email', email)
        .maybeSingle();
      isAdmin = Boolean(data && data.status === 'active');
    } catch {
      /* DB unreachable — fall through to the generic response */
    }
  }
  if (!isAdmin) return generic;

  // Path 1: recovery link generated with the service role, emailed via Resend.
  if (service && isEmailConfigured()) {
    try {
      const { data, error } = await service.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo },
      });
      const link = data?.properties?.action_link;
      if (!error && link) {
        const { subject, html } = passwordResetEmail({ link });
        const sent = await sendEmail(email, subject, html);
        if (sent) {
          await logSecurityEvent({ type: 'password_reset_requested', severity: 'info', email, ip, metadata: { via: 'resend' } });
          return generic;
        }
      }
    } catch {
      /* fall through to Supabase's built-in email */
    }
  }

  // Path 2: Supabase Auth's built-in email (needs SMTP configured in Supabase).
  try {
    const sb = createServerSupabase();
    await sb.auth.resetPasswordForEmail(email, { redirectTo });
    await logSecurityEvent({ type: 'password_reset_requested', severity: 'info', email, ip, metadata: { via: 'supabase' } });
  } catch {
    /* swallow — the response stays uniform regardless of outcome */
  }

  return generic;
}
