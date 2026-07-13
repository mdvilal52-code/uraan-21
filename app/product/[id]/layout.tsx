import type { Metadata } from 'next';
import { getProductById } from '@/lib/products';
import { dbGetProducts } from '@/lib/productsDb';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

// page.tsx below is a client component (it needs cart/wishlist/review hooks),
// so metadata is generated here in the server-only layout instead — this is
// the standard Next.js App Router pattern for a client page that still needs
// per-route <title>/<meta> tags. Falls back to the bundled catalogue when the
// database isn't configured, same as the storefront itself.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const list = isSupabaseConfigured() ? await dbGetProducts() : undefined;
  const product = getProductById(params.id, list || undefined);
  if (!product) return {};

  const title = product.seoTitle || product.name;
  const description = product.seoDescription || product.description;
  const image = product.image
    ? product.image.startsWith('http')
      ? product.image
      : `${SITE_URL}${product.image}`
    : undefined;
  const url = `${SITE_URL}/product/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
