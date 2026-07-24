// Canonical public site URL — used for SEO metadata, the sitemap and robots.
// Set NEXT_PUBLIC_SITE_URL in your environment variables to your live domain
// (e.g. https://www.omgauriputra.com). Without it, falls back to
// NEXT_PUBLIC_VERCEL_URL (Vercel), RENDER_EXTERNAL_URL (Render), or
// RAILWAY_PUBLIC_DOMAIN (Railway) when available.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : '') ||
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '') ||
  'https://yourdomain.com'
).replace(/\/+$/, '');
