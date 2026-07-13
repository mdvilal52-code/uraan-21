'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react';

type ProductGalleryProps = {
  images: string[];
  name: string;
  tag?: string;
};

const SWIPE_THRESHOLD = 40;

export default function ProductGallery({ images, name, tag }: ProductGalleryProps) {
  const gallery = images.length > 0 ? images : ['/images/necklace.jpg'];
  const [active, setActive] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);

  const goTo = (index: number) => {
    setActive(((index % gallery.length) + gallery.length) % gallery.length);
  };
  const next = () => goTo(active + 1);
  const prev = () => goTo(active - 1);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };
  const onTouchEnd = () => {
    if (touchDeltaX.current > SWIPE_THRESHOLD) prev();
    else if (touchDeltaX.current < -SWIPE_THRESHOLD) next();
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  return (
    <div>
      {/* Main image */}
      <div
        className="aspect-square bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)] relative overflow-hidden group/gallery touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {gallery.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={`Zoom image ${i + 1} of ${name}`}
            className={`absolute inset-0 cursor-zoom-in transition-opacity duration-300 ${
              i === active ? 'opacity-100 z-[1]' : 'opacity-0 pointer-events-none'
            }`}
          >
            <Image
              src={src}
              alt={`${name} — view ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover/gallery:scale-[1.03]"
            />
          </button>
        ))}

        {tag && (
          <div className="absolute top-3 left-3 z-10 bg-[#1a1410] text-[#e8d49b] text-[10px] tracking-[1.5px] uppercase px-3 py-1 font-semibold">
            {tag}
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-3 right-3 z-10 hidden md:flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#1a1410] text-[10px] tracking-[1px] uppercase font-semibold px-2.5 py-1.5 opacity-0 group-hover/gallery:opacity-100 transition-opacity duration-300">
          <ZoomIn size={12} /> Click to zoom
        </div>

        {/* Desktop arrows */}
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Previous image"
              className="hidden md:grid absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 place-items-center bg-white/90 text-[#1a1410] opacity-0 group-hover/gallery:opacity-100 hover:bg-white transition-all duration-200 hover:scale-110"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Next image"
              className="hidden md:grid absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 place-items-center bg-white/90 text-[#1a1410] opacity-0 group-hover/gallery:opacity-100 hover:bg-white transition-all duration-200 hover:scale-110"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Mobile swipe dots */}
        {gallery.length > 1 && (
          <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {gallery.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-5 bg-[#1a1410]' : 'w-1.5 bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {gallery.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`aspect-square relative overflow-hidden border transition-colors ${
                i === active
                  ? 'border-[#b8893a] ring-1 ring-[#b8893a]'
                  : 'border-[rgba(184,137,58,0.18)] hover:border-[#b8893a]'
              }`}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom overlay */}
      {zoomOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center px-4 py-10 animate-fade-up"
          onClick={() => setZoomOpen(false)}
        >
          <button
            onClick={() => setZoomOpen(false)}
            aria-label="Close zoom"
            className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 grid place-items-center bg-white/10 text-white hover:bg-white/20 transition-colors rounded-full"
          >
            <X size={20} />
          </button>

          <div
            className="relative w-full max-w-2xl aspect-square"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={gallery[active]}
              alt={`${name} zoomed view ${active + 1}`}
              fill
              sizes="100vw"
              className="object-contain select-none"
            />
          </div>

          {gallery.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous image"
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all rounded-full"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next image"
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all rounded-full"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-[11px] tracking-[2px] uppercase">
                {active + 1} / {gallery.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
