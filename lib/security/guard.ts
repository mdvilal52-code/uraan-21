// Role-aware guard for admin API routes (#39-43). The legacy break-glass login
// is treated as Owner (full access); Supabase admins use their admin_users role.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, ADMIN_EMAIL, adminSessionToken } from '../adminAuth';
import { getCurrentAdmin } from '../adminSession';
import { hasAtLeast, type Role } from '../rbac';

export type ApiAdmin = { email: string; role: Role };

export async function currentApiAdmin(): Promise<ApiAdmin | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (token && token === (await adminSessionToken())) {
    return { email: ADMIN_EMAIL, role: 'owner' };
  }
  return getCurrentAdmin();
}

// Returns { admin } when authorised at >= `min`, otherwise { error } — a ready
// NextResponse the route should return (401 unauthenticated / 403 forbidden).
export async function requireRole(
  min: Role
): Promise<{ admin: ApiAdmin } | { error: NextResponse }> {
  const admin = await currentApiAdmin();
  if (!admin) {
    return { error: NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 }) };
  }
  if (!hasAtLeast(admin.role, min)) {
    return { error: NextResponse.json({ ok: false, error: 'Insufficient permissions.' }, { status: 403 }) };
  }
  return { admin };
}
