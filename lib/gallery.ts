// Maps the newly added gallery photography to each product so the
// product detail page can render a real multi-image gallery.

const GALLERY_POOLS = {
  ring: [
    '/images/gallery/ring-1.jpg',
    '/images/gallery/ring-2.jpg',
    '/images/gallery/ring-3.jpg',
    '/images/gallery/ring-4.jpg',
    '/images/gallery/ring-5.jpg',
    '/images/gallery/ring-6.jpg',
    '/images/gallery/ring-7.jpg',
    '/images/gallery/ring-8.jpg',
  ],
  necklace: [
    '/images/gallery/necklace-1.jpg',
    '/images/gallery/necklace-2.jpg',
    '/images/gallery/necklace-3.jpg',
    '/images/gallery/necklace-4.jpg',
    '/images/gallery/necklace-5.jpg',
    '/images/gallery/necklace-6.jpg',
    '/images/gallery/necklace-7.jpg',
    '/images/gallery/necklace-8.jpg',
  ],
  earrings: [
    '/images/gallery/earrings-1.jpg',
    '/images/gallery/earrings-2.jpg',
    '/images/gallery/earrings-3.jpg',
    '/images/gallery/earrings-4.jpg',
    '/images/gallery/earrings-5.jpg',
    '/images/gallery/earrings-6.jpg',
    '/images/gallery/earrings-7.jpg',
    '/images/gallery/earrings-8.jpg',
    '/images/gallery/earrings-9.jpg',
  ],
  bracelet: [
    '/images/gallery/bracelet-1.jpg',
    '/images/gallery/bracelet-2.jpg',
    '/images/gallery/bracelet-3.jpg',
    '/images/gallery/bracelet-4.jpg',
    '/images/gallery/bracelet-5.jpg',
    '/images/gallery/bracelet-6.jpg',
    '/images/gallery/bracelet-7.jpg',
  ],
  lifestyle: [
    '/images/gallery/lifestyle-1.jpg',
    '/images/gallery/lifestyle-2.jpg',
    '/images/gallery/lifestyle-3.jpg',
  ],
} as const;

type PoolKey = keyof typeof GALLERY_POOLS;

// The product catalogue only ships a handful of base photos
// (necklace.jpg, ring.jpg, earrings.jpg, ...). Map each one to the
// gallery pool(s) that visually match that kind of jewellery.
const BASE_IMAGE_POOLS: Record<string, PoolKey[]> = {
  'necklace.jpg': ['necklace', 'lifestyle'],
  'earrings.jpg': ['earrings', 'lifestyle'],
  'ring.jpg': ['ring'],
  'bracelet.jpg': ['bracelet', 'lifestyle'],
  'bridal-set.jpg': ['necklace', 'lifestyle'],
  'diamond-set.jpg': ['necklace', 'earrings'],
};

function seedFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Builds a stable per-product gallery: the product's existing primary
 * photo first, followed by a deterministic, category-matched selection
 * from the newly added gallery photography (no client/server mismatch).
 */
export function getGalleryImages(
  product: { id: string; image: string },
  additional: number = 3
): string[] {
  const filename = product.image.split('/').pop() ?? '';
  const poolKeys = BASE_IMAGE_POOLS[filename] ?? ['necklace'];
  const pool = Array.from(new Set(poolKeys.flatMap((key) => GALLERY_POOLS[key])));

  if (pool.length === 0) return [product.image];

  const seed = seedFromId(product.id);
  const start = seed % pool.length;
  const picks: string[] = [];
  for (let i = 0; i < pool.length && picks.length < additional; i++) {
    picks.push(pool[(start + i) % pool.length]);
  }

  return [product.image, ...picks];
}
