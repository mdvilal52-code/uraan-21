'use client';

import Link from 'next/link';
import { ChevronRight, Gem, Award, Heart, Star, Sparkles, MapPin, Navigation } from 'lucide-react';
import { BUSINESS_NAME, BUSINESS_ADDRESS_LINES, MAPS_DIRECTIONS_URL } from '@/lib/business';

export default function About() {
  return (
    <>
      {/* Heritage Section */}
      <section className="bg-[#f8f2e6] py-10 md:py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <svg viewBox="0 0 24 14" className="w-7 h-4 mx-auto text-[#c9a24a] mb-2" fill="currentColor" aria-hidden="true">
            <path d="M12 1 C10.5 3.4 10.5 6 12 8.4 C13.5 6 13.5 3.4 12 1 Z" />
            <path d="M7.2 3.8 C8.4 6 10 7.6 12 8.4 C10.7 9.5 8.7 9.4 7.3 8.3 C6.3 7.3 6.3 5 7.2 3.8 Z" />
            <path d="M16.8 3.8 C15.6 6 14 7.6 12 8.4 C13.3 9.5 15.3 9.4 16.7 8.3 C17.7 7.3 17.7 5 16.8 3.8 Z" />
            <circle cx="12" cy="11" r="1.1" />
            <rect x="7.5" y="12.6" width="9" height="0.8" rx="0.4" />
          </svg>
          <h2 className="serif text-3xl md:text-4xl leading-[1.15] tracking-tight text-[#8e1f2f] font-semibold mb-2">Our Heritage</h2>
          <p className="text-sm md:text-base leading-relaxed text-[#3a2f24] mb-8">
            Timeless craftsmanship inspired by tradition, designed for today&apos;s woman.
          </p>
          <h3 className="serif text-2xl md:text-3xl text-[#1a1410] mb-4 leading-[1.2] tracking-tight">
            A Legacy of <em className="gold-text">Trust</em> Since Generations
          </h3>
          <p className="text-sm text-[#6b5d4c] leading-relaxed mb-4 max-w-xl mx-auto">
            At Om Gauri Putra, every ornament tells a story — of devotion,
            of craftsmanship, of celebrations. Three generations of master
            artisans handcraft each piece with care, ensuring purity of
            gold, brilliance of gems, and authenticity of every Rudraksh bead.
          </p>
          <p className="text-sm text-[#6b5d4c] leading-relaxed mb-6 max-w-xl mx-auto">
            From bridal masterpieces to spiritual blessings, we honour the
            richness of Indian tradition while embracing modern elegance.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 text-[11px] tracking-[3px] uppercase font-semibold border-b border-[#1a1410] pb-1 hover:text-[#b8893a] hover:border-[#b8893a]"
          >
            Read Our Story <ChevronRight size={12} />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#fbf8f1] py-12 px-4 border-y border-[rgba(184,137,58,0.18)]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { num: '25+', label: 'Years of Trust', icon: Award },
            { num: '10K+', label: 'Happy Customers', icon: Heart },
            { num: '500+', label: 'Unique Designs', icon: Gem },
            { num: '4.9★', label: 'Average Rating', icon: Star },
          ].map((s, i) => (
            <div key={i} className="text-center bg-white px-5 py-6 rounded-xl border border-[rgba(184,137,58,0.18)]">
              <span className="relative inline-block mb-2">
                <s.icon className="text-[#b8893a]" size={26} />
                <Sparkles size={11} className="absolute -top-1.5 -right-3 text-[#d4a857]" />
              </span>
              <div className="tabular-nums lining-nums text-4xl md:text-[2.5rem] leading-[1.1] tracking-tight text-[#b08430] font-bold">
                {s.num}
              </div>
              <div className="text-[10px] md:text-xs tracking-[2px] uppercase text-[#5f5546] font-medium mt-2.5">
                {s.label}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-3 text-[#c9a24a]">
                <span className="h-px w-6 bg-[#c9a24a]/60" />
                <Heart size={8} fill="currentColor" />
                <span className="h-px w-6 bg-[#c9a24a]/60" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visit Our Store */}
      <section className="bg-white py-10 px-4 border-b border-[rgba(184,137,58,0.18)]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-full bg-[#f8f2e6] grid place-items-center flex-shrink-0">
            <MapPin className="text-[#b8893a]" size={20} aria-hidden="true" />
          </div>
          <div>
            <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410] mb-1">
              Visit Our Store
            </h3>
            <address className="not-italic text-sm text-[#6b5d4c] leading-relaxed mb-2">
              {BUSINESS_ADDRESS_LINES.join(', ')}
            </address>
            <a
              href={MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[1.5px] uppercase font-semibold text-[#b8893a] hover:underline"
            >
              <Navigation size={12} aria-hidden="true" /> Get Directions to {BUSINESS_NAME}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}