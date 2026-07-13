'use client';

import Link from 'next/link';
import { Heart, Star, CheckCircle2, ChevronRight } from 'lucide-react';
import { reviewAccent, initialsOf } from '@/lib/reviewStyle';
import { useReviews, verifiedOnly, newestFirst } from '@/hooks/useReviews';

export default function Testimonials() {
  const { reviews } = useReviews();
  const shown = newestFirst(verifiedOnly(reviews)).slice(0, 3);
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <p className="section-tag-italic">Words of Love</p>
      <h2 className="section-heading">Happy Customers</h2>
      <div className="luxury-divider">
        <Heart size={10} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {shown.map((r, idx) => {
          const accent = reviewAccent(idx);
          return (
          <div
            key={r.id}
            className="bg-white border border-[rgba(184,137,58,0.18)] rounded-xl p-5 md:p-6 relative"
            style={{ borderTop: `3px solid ${accent}` }}
          >
            {/* Decorative quote */}
            <div
              className="absolute top-2 right-4 serif text-6xl opacity-20 leading-none pointer-events-none"
              style={{ color: accent }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            {/* Stars */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    i < r.rating
                      ? 'text-[#b8893a] fill-[#b8893a]'
                      : 'text-[#9a8c75]'
                  }
                />
              ))}
            </div>

            {/* Text */}
            <p className="serif italic text-[#1a1410] text-base md:text-[17px] leading-relaxed mb-4">
              {r.text}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-[rgba(184,137,58,0.18)]">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 border-2 border-[#e8d49b]"
                style={{ backgroundColor: accent }}
              >
                {initialsOf(r.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: accent }}>{r.name}</div>
                <div className="text-[10px] text-[#b08430] tracking-[1px] uppercase mt-0.5">
                  {r.city}
                </div>
              </div>
              {r.verified && (
                <div className="flex items-center gap-1 text-[10px] text-[#3d6b5a] font-medium">
                  <CheckCircle2 size={11} />
                  <span>Verified</span>
                </div>
              )}
            </div>

            {r.product && (
              <div className="mt-3 text-[10px] text-[#6b5d4c] tracking-[0.5px]">
                Purchased: <span className="font-semibold" style={{ color: accent }}>{r.product}</span>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 text-[11px] tracking-[3px] uppercase font-semibold border-b border-[#1a1410] pb-1 hover:text-[#b8893a] hover:border-[#b8893a]"
        >
          Read All Reviews <ChevronRight size={12} />
        </Link>
      </div>
    </section>
  );
}