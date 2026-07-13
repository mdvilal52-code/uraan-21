import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminSession';
import { createServerSupabase } from '@/lib/supabase/server';
import { validatePassword, hashPassword } from '@/lib/security/password';
import { isPasswordReused, recordPasswordHash, markPasswordChanged } from '@/lib/security/passwordHistory';
import { getClientIp } from '@/lib/security/request';
import { logAudit, logSecurityEvent } from '@/lib/audit';
import { assertSameOrigin } from '@/lib/security/csrf';

// POST → change the signed-in admin's password (Supabase Auth account).
// Enforces the strong-password policy (#8) and the reuse/history check (#9),
// then records the new Argon2id hash and bumps password_changed_at (#10).
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: 'Bad origin.' }, { status: 403 });
  }

  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
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
  await logAudit({ actorEmail: admin.email, actorRole: admin.role, action: 'password_changed', ip, userAgent });
  await logSecurityEvent({ type: 'password_changed', severity: 'info', email: admin.email, ip, userAgent });

  return NextResponse.json({ ok: true });
}
