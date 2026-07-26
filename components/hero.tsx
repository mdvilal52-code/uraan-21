'use client';

import { useState, useEffect, useCallback } from 'react';
import { heroSlides } from '@/data/jewelleryData';

export default function Hero() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(
    () => setCurrent((prev) => (prev + 1) % heroSlides.length),
    [],
  );

  useEffect(() => {
    const timer = setInterval(next, 5500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full overflow-hidden bg-[#f0eadf]" aria-label="Hero banner">
      {/* Slides */}
      <div className="relative" style={{ paddingBottom: '0' }}>
        {heroSlides.map((slide, idx) => (
          <div
            key={idx}
            aria-hidden={idx !== current}
            className={`
              ${idx === 0 ? 'relative' : 'absolute inset-0'}
              transition-opacity duration-1000 ease-in-out
              ${idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          >
            {/* Background image — full width, auto height on mobile so the image
                (which carries brand text) is never cropped. Fixed height on desktop
                provides a controlled viewport impression. */}
            <div
              className="w-full"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: 'clamp(260px, 55vw, 620px)',
              }}
              role="img"
              aria-label={`${slide.eyebrow} — ${slide.title} ${slide.titleEm}`}
            />
          </div>
        ))}

        {/* Spacer so the section has height when slides are absolute */}
        {heroSlides.length > 1 && (
          <div
            aria-hidden="true"
            style={{ height: 'clamp(260px, 55vw, 620px)' }}
          />
        )}
      </div>

      {/* Round slider dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setCurrent(idx)}
            className={`
              rounded-full transition-all duration-300
              ${idx === current
                ? 'w-3 h-3 bg-[#C9A24A] shadow-[0_0_0_2px_rgba(201,162,74,0.4)]'
                : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/75'
              }
            `}
          />
        ))}
      </div>
    </section>
  );
}
