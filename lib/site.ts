// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Netlify sets URL (and DEPLOY_PRIME_URL for deploy previews) automatically,
// so this resolves correctly out of the box; override with
// NEXT_PUBLIC_SITE_URL once you connect a custom domain (e.g.
// https://www.omgauriputra.com).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://your-site.netlify.app'
).replace(/\/+$/, '');
