// Shared admin-auth helpers used by the login route and the middleware that
// guards /admin. Credentials come from environment variables so they can be
// changed via environment variables without code edits. The session cookie stores a SHA-256
// token derived from the credentials plus a secret — the password itself is
// never stored in the browser, and changing the password invalidates old
// sessions. Uses only Web Crypto + TextEncoder, so it runs in both the Node
// (route handler) and Edge (middleware) runtimes.

export const ADMIN_COOKIE = 'ogp_admin';

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@omgauriputra.com').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'omgauri2024').trim();
const ADMIN_SESSION_SECRET_ENV = process.env.ADMIN_SESSION_SECRET;

// In production, refuse to fall back to a public/known session secret: with
// ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_SESSION_SECRET all defaulted, the
// legacy session token is deterministic and any visitor could forge the cookie
// straight from this source file. Disabling break-glass here forces the
// operator to either set ADMIN_SESSION_SECRET or sign in via Supabase Auth.
export function isBreakGlassEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return Boolean(ADMIN_SESSION_SECRET_ENV);
  }
  return true;
}

const ADMIN_SECRET = ADMIN_SESSION_SECRET_ENV || 'om-gauri-putra-admin-secret';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * The session token a valid login receives; recomputed by the middleware.
 * Returns null when break-glass is disabled (production without a configured
 * ADMIN_SESSION_SECRET) so cookie comparisons never accidentally succeed on a
 * predictable digest.
 */
export async function adminSessionToken(): Promise<string | null> {
  if (!isBreakGlassEnabled()) return null;
  return sha256Hex(`${ADMIN_EMAIL.toLowerCase()}:${ADMIN_PASSWORD}:${ADMIN_SECRET}`);
}

/** Whether the submitted credentials match the configured admin. */
export function verifyAdmin(email: string, password: string): boolean {
  if (!isBreakGlassEnabled()) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password.trim() === ADMIN_PASSWORD;
}

