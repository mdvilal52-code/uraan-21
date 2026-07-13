import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { products } from '@/data/jewelleryData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetPublishedPosts } from '@/lib/blogDb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = ['', '/collections', '/about', '/contact', '/reviews', '/login', '/register', '/blog'];
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/collections' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : path === '/collections' ? 0.9 : 0.6,
  }));

  // One entry per product so Google can index every product page.
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // One entry per published blog post (server-side — sitemap.ts runs on the
  // server, so it can call the DB helper directly without an HTTP round trip).
  const posts = isSupabaseConfigured() ? await dbGetPublishedPosts() : null;
  const blogEntries: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
