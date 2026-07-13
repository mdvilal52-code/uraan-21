// Shared admin-auth helpers used by the login route and the middleware that
// guards /admin. Credentials come from environment variables so they can be
// changed in Vercel without code edits. The session cookie stores a SHA-256
// token derived from the credentials plus a secret — the password itself is
// never stored in the browser, and changing the password invalidates old
// sessions. Uses only Web Crypto + TextEncoder, so it runs in both the Node
// (route handler) and Edge (middleware) runtimes.

export const ADMIN_COOKIE = 'ogp_admin';

export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@omgauriputra.com').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || 'omgauri2024').trim();
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || 'om-gauri-putra-admin-secret';

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** The session token a valid login receives; recomputed by the middleware. */
export function adminSessionToken(): Promise<string> {
  return sha256Hex(`${ADMIN_EMAIL.toLowerCase()}:${ADMIN_PASSWORD}:${ADMIN_SECRET}`);
}

/** Whether the submitted credentials match the configured admin. */
export function verifyAdmin(email: string, password: string): boolean {
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password.trim() === ADMIN_PASSWORD;
}

