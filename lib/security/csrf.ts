// CSRF protection (#28) for state-changing, cookie-authenticated admin routes.
// Auth cookies are SameSite=Lax so cross-site posts are already blocked by the
// browser; this adds defense-in-depth by requiring the request Origin (or
// Referer) host to match the site host on mutating methods. Same-origin fetches
// from the admin UI always send a matching Origin.
//
// Use ONLY on admin/same-origin routes — never on public webhooks (e.g. the
// WhatsApp/Razorpay callbacks), which legitimately arrive cross-origin.
export function assertSameOrigin(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

  const host = request.headers.get('host');
  if (!host) return false;

  const origin = request.headers.get('origin');
  if (origin) {
    try {
      return new URL(origin).host === host;
    } catch {
      return false;
    }
  }

  // Fall back to Referer when Origin is absent.
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).host === host;
    } catch {
      return false;
    }
  }

  // A state-changing request with neither Origin nor Referer is rejected.
  return false;
}
