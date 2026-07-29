'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Gem, ChevronRight, LayoutGrid } from 'lucide-react';
import { CATEGORY_THEME, CATEGORY_IMAGES, fallbackCategoryImage } from '@/lib/categoryStyles';
import { useCategories } from '@/hooks/useCategories';
import { isOptimizableImageSrc } from '@/lib/safeImage';
import { blurDataURL } from '@/lib/imagePlaceholder';

export default function Categories() {
  const { categories } = useCategories();
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <p className="section-tag-italic">Explore Our Collection</p>
      <h2 className="section-heading">Shop By Category</h2>
      <div className="luxury-divider">
        <Gem size={10} />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 mt-8">
        {categories.slice(0, 12).map((cat) => {
          const theme = CATEGORY_THEME[cat.slug] ?? { bg: '#FFFFFF', text: '#1a1410' };
          // Third fallback: any admin-created category whose slug isn't one
          // of the 12 seeded ones AND whose image field went empty would
          // otherwise resolve to url(undefined) — rendering every such card
          // as the same broken image. fallbackCategoryImage() picks a
          // distinct picture from a pool by hashing the name.
          const image = cat.image || CATEGORY_IMAGES[cat.slug] || fallbackCategoryImage(cat.name);
          return (
            <Link
              key={cat.slug}
              href={`/collections?type=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden flex flex-col hover:shadow-[0_14px_44px_rgba(122,90,31,0.16)] hover:-translate-y-1 transition-all duration-300"
              style={{ backgroundColor: theme.bg }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] z-10 bg-gradient-to-r from-[#d4a857] via-[#b8893a] to-[#8c6726] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

              <div className="relative w-full aspect-[4/5] overflow-hidden">
                {isOptimizableImageSrc(image) ? (
                  <Image
                    src={image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    placeholder="blur"
                    blurDataURL={blurDataURL()}
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  // Admin-pasted external URL outside images.remotePatterns —
                  // see lib/safeImage.ts for why this can't go through the
                  // optimizer.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
              </div>

              <div className="px-2 py-3 md:py-4 text-center">
                <div
                  className="display text-[10px] md:text-[11px] font-semibold tracking-[1.5px] uppercase leading-tight"
                  style={{ color: theme.text }}
                >
                  {cat.name}
                </div>
                <div className="text-[9px] md:text-[10px] text-[#9a8c75] italic mt-1">
                  {cat.count} Products
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 md:mt-10 flex justify-center">
        <Link
          href="/collections"
          className="group inline-flex items-center gap-4 w-full max-w-md justify-between px-7 py-4 rounded-2xl border border-[#c79a48] bg-[#faf5e9] text-[#b8893a] text-xs md:text-sm tracking-[4px] uppercase font-semibold hover:bg-[#b8893a] hover:text-white hover:border-[#b8893a] transition-all"
        >
          <LayoutGrid size={20} className="shrink-0" />
          <span className="flex-1 text-center">View All Categories</span>
          <ChevronRight size={18} className="shrink-0" />
        </Link>
      </div>
    </section>
  );
}