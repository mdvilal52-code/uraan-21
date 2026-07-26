'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

const SLIDES = [
  {
    src: '/images/model.jpg',
    alt: 'Woman wearing heirloom gold jewellery',
    objectPos: 'object-[72%_18%]',
  },
  {
    src: '/images/bridal-set.jpg',
    alt: 'Bridal jewellery set',
    objectPos: 'object-center',
  },
  {
    src: '/images/style-model.jpg',
    alt: 'Model wearing luxury jewellery',
    objectPos: 'object-[50%_20%]',
  },
];

const AUTOPLAY_MS = 4500;

export default function PromoBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), []);
  const goTo = (i: number) => setCurrent(i);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, next]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
  }

  return (
    <section
      id="promo-banner"
      className="px-3 py-3 md:px-8 md:py-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative mx-auto aspect-[4/3] w-full max-w-7xl overflow-hidden rounded-2xl sm:aspect-[16/9] md:aspect-[21/9]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slides */}
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="100vw"
              className={`object-cover ${slide.objectPos}`}
              priority={i === 0}
            />
          </div>
        ))}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent"
          style={{ zIndex: 2 }}
        />

        {/* Text content */}
        <div
          className="absolute inset-0 flex flex-col justify-center px-5 py-4 sm:px-10 md:px-16"
          style={{ zIndex: 3 }}
        >
          <p className="font-poppins text-[10px] font-semibold uppercase leading-relaxed tracking-[0.3em] text-[#D9A441] sm:text-xs">
            Timeless
            <br />
            Elegance
          </p>
          <h2 className="mt-2 font-serif text-xl leading-[1.15] text-white sm:mt-4 sm:text-5xl">
            Crafted to Make
            <br />
            You{' '}
            <em className="font-serif italic text-[#D9A441]">Unforgettable</em>
          </h2>
          <p className="mt-2 max-w-[220px] font-poppins text-[11px] leading-snug text-[#EDEDED] sm:mt-4 sm:max-w-sm sm:text-[15px] sm:leading-relaxed">
            Discover heirloom jewellery handcrafted by master artisans — for
            every milestone, every memory, every you.
          </p>
          <Link
            href="/collections"
            className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#D9A441] px-4 py-2 font-poppins text-[10px] font-bold uppercase tracking-[0.15em] text-[#0B1E42] transition-colors hover:bg-[#c99532] sm:mt-6 sm:px-6 sm:py-3 sm:text-xs"
          >
            Explore Collections <ChevronRight size={13} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Dot indicators */}
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:bottom-5"
          style={{ zIndex: 4 }}
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-5 bg-[#D9A441]' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
