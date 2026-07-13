// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Defaults to the live Vercel URL; override with NEXT_PUBLIC_SITE_URL when you
// connect a custom domain (e.g. https://www.omgauriputra.com).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://uraan-alpha.vercel.app'
).replace(/\/+$/, '');
