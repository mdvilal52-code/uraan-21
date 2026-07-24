// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Hosting-agnostic: set NEXT_PUBLIC_SITE_URL (preferred — it is also available
// in the browser) or SITE_URL to your production origin, e.g.
// https://www.omgauriputra.com. Falls back to localhost for local dev so a
// fresh checkout with no env configured still runs.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');
