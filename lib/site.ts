// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Hosting-agnostic: set NEXT_PUBLIC_SITE_URL in your environment if the site
// ever moves to a different domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://omgpgems.com'
).replace(/\/+$/, '');
