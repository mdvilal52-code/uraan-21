import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep private/functional areas out of Google's index.
      disallow: ['/admin', '/api', '/checkout', '/profile'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
