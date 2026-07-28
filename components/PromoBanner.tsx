'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

// Auto-rotating hero carousel — five slides that cross-fade every 5s, with
// clickable progress-bar indicators. Mirrors the omgpgems.com hero: same
// copy, imagery, gold accents and button styling.
const SLIDES = [
  {
    image: '/images/hero.jpg',
    eyebrow: 'Timeless Elegance',
    titleTop: 'Crafted to Make You',
    titleEm: 'Unforgettable',
    text: 'Discover heirloom jewellery handcrafted by master artisans — for every milestone, every memory, every you.',
    cta: 'Explore Collections',
    href: '/collections',
  },
  {
    image: '/images/gallery/lifestyle-1.jpg',
    eyebrow: 'Bridal Collection',
    titleTop: 'Heritage',
    titleEm: 'In Gold',
    text: 'Handcrafted bridal masterpieces — celebrating every sacred moment.',
    cta: 'Explore',
    href: '/collections?type=bridal',
  },
  {
    image: '/images/gallery/rudraksh-1.jpg',
    eyebrow: 'Sacred Rudraksh',
    titleTop: 'Wear the Divine,',
    titleEm: 'Every Day',
    text: 'Certified, energised Rudraksh from the high forests of Nepal — for protection, prosperity, and inner peace.',
    cta: 'Shop Rudraksh',
    href: '/collections?type=rudraksh',
  },
  {
    image: '/images/gallery/emerald-gem.jpg',
    eyebrow: 'Nature’s Rarest',
    titleTop: 'Emeralds That',
    titleEm: 'Enchant',
    text: 'Vivid, untreated emeralds set in gold — a rare touch of nature’s magic for the modern connoisseur.',
    cta: 'Shop Gems',
    href: '/collections?type=gems',
  },
  {
    image: '/images/gallery/blue-diamond.jpg',
    eyebrow: 'Rare Brilliance',
    titleTop: 'Diamonds Beyond',
    titleEm: 'Compare',
    text: 'Certified diamonds, cut to perfection — brilliance engineered to last a lifetime.',
    cta: 'Shop Diamonds',
    href: '/collections?type=diamond',
    fitHeight: true,
  },
];

export default function PromoBanner() {
  const [active, setActive] = useState(0);
  // Only the active slide + the one it's about to cross-fade into ever get an
  // <Image> mounted, so the browser fetches at most 2 of the 5 slide images at
  // a time instead of all 5 up front. Once loaded a slide stays mounted (the
  // set only grows) so revisiting it on the next loop is instant.
  const [primed, setPrimed] = useState<Set<number>>(() => new Set([0, 1 % SLIDES.length]));

  const go = useCallback((i: number) => setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setPrimed((prev) => {
      const next = (active + 1) % SLIDES.length;
      if (prev.has(active) && prev.has(next)) return prev;
      return new Set(prev).add(active).add(next);
    });
  }, [active]);

  return (
    <section
      id="promo-banner"
      aria-label="Featured collections"
      className={`relative h-[480px] md:h-[600px] overflow-hidden transition-colors duration-700 ${
        active === 4 ? 'bg-[#0a0f1a]' : 'bg-[#f8f2e6]'
      }`}
    >
      {SLIDES.map((s, i) => (
        <div
          key={i}
          aria-hidden={i !== active}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === active ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {primed.has(i) && (
            s.fitHeight ? (
              <Image
                src={s.image}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain object-right"
              />
            ) : (
              <Image
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-right md:object-center"
              />
            )
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent md:from-black/45 md:via-black/15" />
          <div className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24">
            <div className="max-w-md">
              <p className="serif italic text-[#b8893a] text-sm md:text-base tracking-[3px] mb-3 uppercase animate-fade-up max-w-[140px] leading-tight">
                {s.eyebrow}
              </p>
              <h1 className="serif text-5xl md:text-7xl font-normal text-white leading-none mb-4 mt-3 animate-slide-in">
                {s.titleTop}
                <br />
                <em className="gold-text font-medium">{s.titleEm}</em>
              </h1>
              <p className="text-sm md:text-base text-white/85 leading-relaxed mb-6 max-w-xs animate-fade-up">
                {s.text}
              </p>
              <Link
                href={s.href}
                className="inline-flex items-center gap-3 px-8 py-3 bg-[#b8893a] text-[#1a1410] text-[11px] tracking-[3px] uppercase font-medium hover:bg-[#e8d49b] hover:text-[#1a1410] transition-all"
              >
                {s.cta}{' '}
                <ChevronRight size={14} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Slide indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => go(i)}
            className={`h-[2px] transition-all duration-300 ${
              i === active ? 'w-10 bg-[#b8893a]' : 'w-6 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
