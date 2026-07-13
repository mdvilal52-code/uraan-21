'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { heroSlides } from '@/data/jewelleryData';

export default function Hero() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[480px] md:h-[600px] overflow-hidden bg-[#f8f2e6]">
      {heroSlides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0 max-md:hidden'
          }`}
        >
          {/* Background */}
          <div
            className="absolute inset-0 bg-cover bg-right md:bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent md:from-black/45 md:via-black/15" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center px-6 md:px-16 lg:px-24">
            <div className="max-w-md">
              <p className="serif italic text-[#b8893a] text-sm md:text-base tracking-[3px] mb-3 uppercase animate-fade-up max-w-[140px] leading-tight">
                {slide.eyebrow}
              </p>
              <h1 className="serif text-5xl md:text-7xl font-normal text-white leading-none mb-4 mt-3 animate-slide-in">
                {slide.title}
                <br />
                <em className="gold-text font-medium">{slide.titleEm}</em>
              </h1>
              <p className="text-sm md:text-base text-white/85 leading-relaxed mb-6 max-w-xs animate-fade-up">
                {slide.desc}
              </p>
              <Link
                href={slide.href}
                className="inline-flex items-center gap-3 px-8 py-3 bg-[#b8893a] text-[#1a1410] text-[11px] tracking-[3px] uppercase font-medium hover:bg-[#e8d49b] hover:text-[#1a1410] transition-all"
              >
                {slide.cta} <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {heroSlides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setCurrent(idx)}
            className={`h-[2px] transition-all duration-300 ${
              idx === current ? 'w-10 bg-[#b8893a]' : 'w-6 bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
}