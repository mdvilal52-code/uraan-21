'use client';

import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useBanners } from '@/hooks/useBanners';

// Renders the active banners managed in Admin → Banners. Returns nothing when
// no banner is active, so the homepage stays clean until the store adds one.
export default function PromoBanners() {
  const { banners } = useBanners();
  const active = banners.filter((b) => b.active);
  if (active.length === 0) return null;

  return (
    <section className="py-12 px-4 max-w-7xl mx-auto">
      <p className="section-tag-italic">Don&apos;t Miss Out</p>
      <h2 className="section-heading">Special Offers</h2>
      <div className="luxury-divider">
        <Sparkles size={10} />
      </div>

      <div className="space-y-4 md:space-y-5 mt-6">
        {active.map((b) => (
          <Link
            key={b.id}
            href={b.ctaLink || '/collections'}
            className="group block relative overflow-hidden rounded-2xl aspect-[16/7] md:aspect-[16/5] bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
              style={{ backgroundImage: `url(${b.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-lg">
              <span className="block h-px w-10 bg-[#e8d49b]/70 mb-3" aria-hidden="true" />
              <h3 className="serif lining-nums text-[1.7rem] md:text-4xl leading-[1.12] tracking-[0.01em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                {b.title}
              </h3>
              {b.subtitle && (
                <p className="text-[13px] md:text-[15px] leading-relaxed tracking-[0.02em] text-white/90 mt-2.5 max-w-sm drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                  {b.subtitle}
                </p>
              )}
              {b.ctaText && (
                <span className="mt-5 w-fit inline-flex items-center gap-2 px-6 py-2.5 bg-[#b8893a] text-[#1a1410] text-[11px] tracking-[2.5px] uppercase font-semibold group-hover:bg-[#e8d49b] transition-all">
                  {b.ctaText} <ChevronRight size={14} />
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
