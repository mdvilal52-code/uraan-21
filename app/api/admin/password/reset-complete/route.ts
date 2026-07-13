import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminSession';
import { createServerSupabase } from '@/lib/supabase/server';
import { validatePassword, hashPassword } from '@/lib/security/password';
import { isPasswordReused, recordPasswordHash, markPasswordChanged } from '@/lib/security/passwordHistory';
import { getClientIp } from '@/lib/security/request';
import { logAudit, logSecurityEvent } from '@/lib/audit';
import { assertSameOrigin } from '@/lib/security/csrf';

// POST → finish a "forgot password" reset. The browser already holds a
// short-lived Supabase recovery session (established by clicking the emailed
// link), so this mirrors /api/admin/password (change password) but is
// reachable without a normal signed-in admin session, and logs a distinct
// 'password_reset' action so it's clear in the audit trail this wasn't a
// self-service change from within the panel.
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Bad origin.' }, { status: 403 });
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Reset link expired or invalid. Request a new one.' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || '';

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const newPassword = String(body.newPassword || '');

  const policy = validatePassword(newPassword, { email: admin.email });
  if (!policy.ok) {
    return NextResponse.json({ ok: false, errors: policy.errors }, { status: 400 });
  }

  if (await isPasswordReused(admin.email, newPassword)) {
    return NextResponse.json({ ok: false, errors: ['You cannot reuse a recent password.'] }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return NextResponse.json({ ok: false, errors: [error.message] }, { status: 400 });
  }

  const hash = await hashPassword(newPassword);
  await recordPasswordHash(admin.email, hash);
  await markPasswordChanged(admin.email);
  await logAudit({ actorEmail: admin.email, actorRole: admin.role, action: 'password_reset', ip, userAgent });
  await logSecurityEvent({ type: 'password_reset', severity: 'warning', email: admin.email, ip, userAgent });

  return NextResponse.json({ ok: true });
}
