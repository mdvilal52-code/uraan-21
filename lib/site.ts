// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Always set NEXT_PUBLIC_SITE_URL in your environment to your live domain,
// e.g. https://www.omgauriputra.com — this is the only variable that matters.
// The PORT fallback exists only for local development convenience.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.PORT ? `http://localhost:${process.env.PORT}` : '') ||
  'http://localhost:3000'
).replace(/\/+$/, '');
