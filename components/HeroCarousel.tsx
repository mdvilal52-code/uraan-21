'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Gem, Sparkles } from 'lucide-react';

const SLIDE_COUNT = 3;
const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

function CornerFlourish({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} fill="none" aria-hidden="true">
      <path d="M2 34 C2 15 15 2 34 2" stroke="#C9A24A" strokeWidth="1" opacity="0.55" />
      <path d="M2 46 C2 22 22 2 46 2" stroke="#C9A24A" strokeWidth="1" opacity="0.3" />
      <circle cx="2" cy="2" r="2" fill="#C9A24A" opacity="0.7" />
    </svg>
  );
}

function GemSparkleIcon() {
  return (
    <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden="true">
      <Gem size={22} strokeWidth={1.4} className="text-[#C9A24A]" />
      <Sparkles size={11} className="absolute -right-1 -top-1 text-[#C9A24A]" />
    </span>
  );
}

function RibbonBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-[#0B1E42] px-4 py-[5px]"
      style={{ clipPath: 'polygon(4% 0%, 96% 0%, 100% 50%, 96% 100%, 4% 100%, 0% 50%)' }}
    >
      <span className="whitespace-nowrap font-devanagari text-[10.5px] font-semibold tracking-wide text-[#D9A441]">
        {children}
      </span>
    </div>
  );
}

// Slide 1 content is fully specified. Slides 2-3 are temporary duplicates
// until real content is supplied for them.
function HeroSlideContent() {
  return (
    <div
      className="relative overflow-hidden px-2 pb-5 pt-4 sm:px-4"
      style={{ background: 'linear-gradient(180deg, #CDE9F5 0%, #FFFFFF 100%)' }}
    >
      <CornerFlourish className="absolute left-2 top-2 h-8 w-8 sm:h-10 sm:w-10" />
      <CornerFlourish className="absolute right-2 top-2 h-8 w-8 -scale-x-100 sm:h-10 sm:w-10" />
      <CornerFlourish className="absolute bottom-2 left-2 h-8 w-8 -scale-y-100 sm:h-10 sm:w-10" />
      <CornerFlourish className="absolute bottom-2 right-2 h-8 w-8 -scale-x-100 -scale-y-100 sm:h-10 sm:w-10" />

      {/* Top mantra line */}
      <div className="relative z-10 mx-auto mb-2 flex max-w-[260px] items-center gap-2">
        <span className="h-px flex-1 bg-[#0B1E42]/40" />
        <p className="whitespace-nowrap font-devanagari text-[11px] tracking-wide text-[#0B1E42]">
          ॥ ॐ नम: शिवाय ॥
        </p>
        <span className="h-px flex-1 bg-[#0B1E42]/40" />
      </div>

      {/* 3-column layout: deity artwork / gold+navy stack / bullets + product */}
      <div className="relative z-10 mx-auto flex max-w-xl items-start justify-center gap-1 sm:max-w-2xl md:max-w-3xl">
        {/* Left */}
        <div className="flex w-[34%] shrink-0 items-end justify-center self-stretch">
          <div className="relative aspect-[3/5] w-full overflow-hidden rounded-md bg-[#0B1E42]/5">
            {/* [IMAGE: hero-deities.png] — Shiva/Parvati/Ganesha/Kartikeya
                devotional artwork. Placeholder only — swap in the supplied file,
                do not substitute a different image. */}
            <Image
              src="/images/hero-deities.png"
              alt="Shiva, Parvati, Ganesha and Kartikeya devotional artwork"
              fill
              sizes="34vw"
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Center */}
        <div className="flex w-[32%] shrink-0 flex-col items-center gap-1 pt-1 text-center">
          <p className="gold-text font-devanagari-display text-[32px] leading-[0.9] sm:text-[38px]">
            ॐ गौरी
          </p>
          <p className="font-devanagari-display text-[26px] leading-[0.9] text-[#0B1E42] sm:text-[31px]">
            पुत्र
          </p>
          <div className="mt-1.5">
            <RibbonBanner>जेम्स ज्वेलरी और रुद्राक्ष</RibbonBanner>
          </div>
          <p className="mt-1.5 font-devanagari text-[7.5px] leading-snug text-[#0B1E42] sm:text-[9px]">
            ॥ रत्नों की दिव्यता, विकास की परंपरा ॥
          </p>
          <span className="relative mt-1.5 h-8 w-8 shrink-0 overflow-hidden rounded-full sm:h-10 sm:w-10">
            {/* Same OMGP emblem placeholder used in the header. */}
            <Image
              src="/images/logo-mark.png"
              alt="OMGPGEMS logo mark"
              fill
              sizes="40px"
              className="object-contain"
            />
          </span>
        </div>

        {/* Right */}
        <div className="flex w-[34%] shrink-0 flex-col items-center gap-1.5">
          <GemSparkleIcon />
          <div className="space-y-0.5 text-center font-devanagari text-[7.5px] leading-snug text-[#0B1E42] sm:text-[9px]">
            <p>सोने • चांदी • हीरे के आभूषण</p>
            <p>रुद्राक्ष • रत्न • जेम्स स्टोनन</p>
            <p>उत्तम क्वालिटी, भरोसेमंद सेवा</p>
          </div>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#0B1E42]/5">
            {/* [IMAGE: hero-products.png] — necklace + earring set on black bust,
                rudraksha mala with tassel, ring. Placeholder only — swap in the
                supplied file, do not substitute a different image. */}
            <Image
              src="/images/hero-products.png"
              alt="Necklace and earring set on a bust, rudraksha mala with tassel, and a ring"
              fill
              sizes="34vw"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (i: number) => {
      setCurrent(((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);
      setResetKey((k) => k + 1);
    },
    [],
  );

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
          className="hero-slide-track flex transition-transform duration-500 ease-in-out"
          style={{
            width: `${SLIDE_COUNT * 100}%`,
            transform: `translateX(-${current * (100 / SLIDE_COUNT)}%)`,
          }}
        >
          {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
            <div key={i} style={{ width: `${100 / SLIDE_COUNT}%` }} className="shrink-0">
              <HeroSlideContent />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots on a white strip directly below the hero */}
      <div className="flex items-center justify-center gap-2 bg-white py-4">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
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
