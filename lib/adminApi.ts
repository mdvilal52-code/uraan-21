// Guard for admin-only API routes. The middleware protects /admin pages, but
// API routes live under /api, so mutating routes verify the admin here too.
// Authorised if EITHER the legacy break-glass cookie is valid OR there is a
// valid Supabase Auth session whose email is an active admin_users row.
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, adminSessionToken } from './adminAuth';
import { getCurrentAdmin } from './adminSession';

export async function isAdminRequest(): Promise<boolean> {
  // Fast path: legacy break-glass cookie (no network call). adminSessionToken()
  // returns null when break-glass is disabled (production without
  // ADMIN_SESSION_SECRET); guard so a forged empty-string cookie never wins.
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const expected = await adminSessionToken();
  if (token && expected && token === expected) return true;

  // Otherwise accept a valid Supabase Auth admin session.
  const admin = await getCurrentAdmin();
  return admin !== null;
}
