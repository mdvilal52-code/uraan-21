// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Set NEXT_PUBLIC_SITE_URL in your hosting environment if you use a different domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://omgpgems.com'
).replace(/\/+$/, '');
