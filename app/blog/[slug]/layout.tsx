import type { Metadata } from 'next';
import { dbGetPostBySlug } from '@/lib/blogDb';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

// page.tsx below is a client component (it fetches the post client-side), so
// metadata is generated here in the server-only layout instead — same pattern
// as app/product/[id]/layout.tsx. Falls back to {} (no override) when the DB
// isn't configured or the post can't be found/isn't published.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  if (!isSupabaseConfigured()) return {};
  const post = await dbGetPostBySlug(params.slug);
  if (!post || !post.published) return {};

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const image = post.coverImage
    ? post.coverImage.startsWith('http')
      ? post.coverImage
      : `${SITE_URL}${post.coverImage}`
    : undefined;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return children;
}
