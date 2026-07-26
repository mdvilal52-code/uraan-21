'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const SLIDES = [
  { src: '/images/banner.jpg', alt: 'OM Gauri Putra – Gems Jewellery and Rudraksha' },
  { src: '/images/collection1.jpg', alt: 'Signature Jewellery Collection' },
  { src: '/images/collection2.jpg', alt: 'Authentic Rudraksha and Gemstone Collection' },
];

const SLIDE_COUNT = SLIDES.length;
const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback((i: number) => {
    setCurrent(((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
    setResetKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % SLIDE_COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [resetKey]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD_PX) {
      goTo(current + (dx > 0 ? -1 : 1));
    }
    touchStartX.current = null;
  }

  return (
    <section aria-label="Hero banner" className="relative w-full">
      <div className="overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            width: `${SLIDE_COUNT * 100}%`,
            transform: `translateX(-${current * (100 / SLIDE_COUNT)}%)`,
          }}
        >
          {SLIDES.map((slide, i) => (
            <div key={i} style={{ width: `${100 / SLIDE_COUNT}%` }} className="shrink-0">
              <div className="relative w-full overflow-hidden">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  width={736}
                  height={1308}
                  priority={i === 0}
                  className="w-full h-auto block"
                  sizes="100vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots — connected to the carousel state */}
      <div className="flex items-center justify-center gap-2 bg-white py-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current ? 'h-2.5 w-2.5 bg-[#C9932E]' : 'h-2 w-2 bg-[#D9D9D9]'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
