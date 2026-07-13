'use client';

import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/hero';
import Categories from '@/components/Categories';
import PromoBanners from '@/components/PromoBanners';
import Bestseller from '@/components/Bestseller';
import Trending from '@/components/Trending';
import Testimonials from '@/components/Testimonials';
import InstagramGallery from '@/components/InstagramGallery';
import Newsletter from '@/components/Newsletter';
import About from '@/components/About';
import CartDrawer from '@/components/CartDrawer';
import FloatingActions from '@/components/FloatingActions';
import PaymentOptions from '@/components/PaymentOptions';
import { whatsappLink } from '@/lib/whatsapp';
import ProductCard from '@/components/ProductCard';
import { getSaleProducts } from '@/lib/products';
import { useProducts } from '@/hooks/useProducts';
import {
  Truck,
  ShieldCheck,
  RotateCw,
  Lock,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Diamond,
  Gift,
  ShoppingBag,
  Package,
  User,
  Gem,
  Shirt,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaYoutube, } from "react-icons/fa";

// Delicate gold leaf-branch corner ornament for the "Shop By Budget" section.
function LeafBranch({ className }: { className?: string }) {
  const leaves = [
    { x: 15, y: 20, r: -50 },
    { x: 38, y: 46, r: 135 },
    { x: 26, y: 74, r: -40 },
    { x: 50, y: 100, r: 140 },
    { x: 38, y: 128, r: -35 },
    { x: 62, y: 150, r: 130 },
  ];
  return (
    <svg viewBox="0 0 100 170" className={className} fill="none" aria-hidden="true">
      <path d="M8 6 C 50 45, 25 95, 68 164" stroke="#d4a857" strokeWidth="1.4" />
      {leaves.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.r})`}>
          <path d="M0 0 C 6 -6 17 -6 23 0 C 17 6 6 6 0 0 Z" stroke="#d4a857" strokeWidth="1.1" />
          <path d="M2 0 L 21 0" stroke="#d4a857" strokeWidth="0.9" />
        </g>
      ))}
    </svg>
  );
}

// Glossy 3D-style budget icons (green wallet, blue price tag, purple
// shopping bag, gold diamond) to match the luxury reference design.
function WalletIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-9 h-9 drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]" aria-hidden="true">
      <defs>
        <linearGradient id="walletBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#62B488" />
          <stop offset="100%" stopColor="#2C7A50" />
        </linearGradient>
      </defs>
      <rect x="20" y="13" width="26" height="13" rx="2.5" fill="#FBEFD3" />
      <rect x="22" y="16" width="22" height="2.4" rx="1.2" fill="#D8B873" />
      <rect x="11" y="20" width="42" height="29" rx="6.5" fill="url(#walletBody)" />
      <path d="M11 27 a6.5 6.5 0 0 1 6.5 -7 H53 v7 Z" fill="#FFFFFF" opacity="0.16" />
      <rect x="11" y="33" width="42" height="2.6" fill="#000000" opacity="0.1" />
      <circle cx="45" cy="38" r="4" fill="#FBEFD3" />
      <circle cx="45" cy="38" r="1.7" fill="#2C7A50" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-9 h-9 drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]" aria-hidden="true">
      <defs>
        <linearGradient id="tagBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5C92D4" />
          <stop offset="100%" stopColor="#2B5790" />
        </linearGradient>
      </defs>
      <g transform="rotate(-19 32 30)">
        <path
          d="M30.6 11.2 Q32 9.8 33.4 11.2 L42.2 20.2 Q43.5 21.5 43.5 23.4 V45.2 Q43.5 50.4 38.3 50.4 H25.7 Q20.5 50.4 20.5 45.2 V23.4 Q20.5 21.5 21.8 20.2 Z"
          fill="url(#tagBody)"
        />
        <path d="M32 11 L42 21 V26.5 H22 V21 Z" fill="#FFFFFF" opacity="0.15" />
        <text x="32" y="42" textAnchor="middle" fontSize="15" fontWeight="700" fill="#FFFFFF" fontFamily="serif">₹</text>
      </g>
      <path d="M28.5 20 C 27 11, 35.5 4.5, 41 8.5 C 45.5 11.8, 42.5 18, 35 14" stroke="#C9A24A" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="28.6" cy="20.1" r="2.9" fill="#EAF1FB" />
      <circle cx="28.6" cy="20.1" r="1.3" fill="#2B5790" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-9 h-9 drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]" aria-hidden="true">
      <defs>
        <linearGradient id="bagBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9E72E2" />
          <stop offset="100%" stopColor="#6B3CBD" />
        </linearGradient>
      </defs>
      <path d="M23 23 a9 9 0 0 1 18 0" stroke="#C9A24A" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <path d="M19 22 H45 L48 47 a4 4 0 0 1 -4 4 H23 a4 4 0 0 1 -4 -4 Z" fill="url(#bagBody)" />
      <path d="M19 22 H45 L45.7 28 H18.3 Z" fill="#FFFFFF" opacity="0.16" />
      <rect x="24" y="29" width="4.5" height="17" rx="2.25" fill="#FFFFFF" opacity="0.18" />
    </svg>
  );
}

function GemIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-9 h-9 drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]" aria-hidden="true">
      <defs>
        <linearGradient id="gemBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F1D079" />
          <stop offset="100%" stopColor="#C5942A" />
        </linearGradient>
      </defs>
      <path d="M15 26 L22 15 H42 L49 26 L32 52 Z" fill="url(#gemBody)" />
      <g stroke="#FFFFFF" strokeOpacity="0.5" strokeWidth="1.1">
        <path d="M15 26 H49" />
        <path d="M22 15 L27 26 L32 52" />
        <path d="M42 15 L37 26 L32 52" />
        <path d="M27 26 H37" />
      </g>
    </svg>
  );
}

// Gold fleur ornament + maroon line icons for the How To Style section.
function FleurOrnament({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 14" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 1 C10.5 3.4 10.5 6 12 8.4 C13.5 6 13.5 3.4 12 1 Z" />
      <path d="M7.2 3.8 C8.4 6 10 7.6 12 8.4 C10.7 9.5 8.7 9.4 7.3 8.3 C6.3 7.3 6.3 5 7.2 3.8 Z" />
      <path d="M16.8 3.8 C15.6 6 14 7.6 12 8.4 C13.3 9.5 15.3 9.4 16.7 8.3 C17.7 7.3 17.7 5 16.8 3.8 Z" />
      <circle cx="12" cy="11" r="1.1" />
      <rect x="7.5" y="12.6" width="9" height="0.8" rx="0.4" />
    </svg>
  );
}

function StyleHairIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="10.5" r="5.5" />
      <circle cx="16.6" cy="5.6" r="2.1" />
      <path d="M15.6 14.3 v1.4" />
      <circle cx="15.6" cy="17.2" r="1.4" />
    </svg>
  );
}

function StyleNecklaceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5.5 5.5 C5.5 11 8.4 14 12 14 C15.6 14 18.5 11 18.5 5.5" />
      <circle cx="6.6" cy="9.4" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12.2" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="17.4" cy="9.4" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12 14 v1.6" />
      <circle cx="12" cy="18" r="2" />
    </svg>
  );
}

function StyleDrapeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4.5 C10 6 14 6 15 4.5" />
      <path d="M9 4.5 C8 9 7.5 14 6.5 19.5" />
      <path d="M15 4.5 C16 9 16.5 14 17.5 19.5" />
      <path d="M6.5 19.5 h11" />
      <path d="M15 4.5 C11 8.5 9 13 7.8 19.5" />
      <path d="M16.2 9.5 C12.8 12.5 11 15.5 10.2 19.5" />
    </svg>
  );
}

function StyleSparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M9 4 L10.3 8.7 L15 10 L10.3 11.3 L9 16 L7.7 11.3 L3 10 L7.7 8.7 Z" />
      <path d="M17 11 L17.9 14.1 L21 15 L17.9 15.9 L17 19 L16.1 15.9 L13 15 L16.1 14.1 Z" />
      <path d="M15.5 3.5 L16.1 5.4 L18 6 L16.1 6.6 L15.5 8.5 L14.9 6.6 L13 6 L14.9 5.4 Z" />
    </svg>
  );
}

export default function HomePage() {
  const { products: list } = useProducts();
  const trending = getSaleProducts(6, list);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />
      <FloatingActions />

      {/* 1. HERO SLIDER */}
      <Hero />

      {/* 2. TRUST STRIP */}
      <section className="bg-[#3a2f24] border-y border-[rgba(184,137,58,0.18)]">
        <div className="max-w-7xl mx-auto grid grid-cols-4">
          {[
            { icon: Truck, title: 'Free Shipping', sub: 'Complimentary Above ₹1,999' },
            { icon: ShieldCheck, title: 'Certified', sub: 'BIS Hallmarked Purity' },
            { icon: RotateCw, title: 'Easy Returns', sub: '7-Day Hassle-Free' },
            { icon: Lock, title: 'Secure Pay', sub: '256-bit SSL Encrypted' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center py-5 md:py-6 px-1.5 md:px-4 border-r border-[rgba(184,137,58,0.18)] last:border-r-0"
            >
              <item.icon className="text-[#b8893a] mb-2" size={22} />
              <div className="text-[8px] md:text-[10px] font-semibold tracking-[1px] md:tracking-[1.5px] uppercase text-[#e8d49b]">
                {item.title}
              </div>
              <div className="text-[8px] md:text-[10px] text-[#e8d49b]/60 mt-1 leading-tight">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY */}
      <Categories />

      {/* 3.5 PROMOTIONAL BANNERS (managed in Admin → Banners) */}
      <PromoBanners />

      {/* 4. SIGNATURE COLLECTION VIDEO */}
      <section className="relative">
        <div className="relative h-[560px] md:h-[680px] overflow-hidden bg-[#1a1410]">
          {/* Decorative background reel. WebM (VP9) is listed first so capable
              browsers pick the sharper, more efficient stream; MP4 is the H.264
              fallback. preload="auto" buffers enough to keep HD playback smooth
              without re-buffering, and PiP/remote playback are disabled so the
              full-resolution frame is never downscaled to a cast/picture window. */}
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
            tabIndex={-1}
            poster="/videos/signature-collection-poster.jpg"
            className="absolute inset-0 w-full h-full object-cover object-center"
          >
            <source src="/videos/signature-collection.webm" type="video/webm" />
            <source src="/videos/signature-collection.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/75" />

          <div className="absolute inset-0 flex flex-col items-center justify-end text-center px-6 pb-12 md:pb-16">
            <p className="text-xs md:text-sm italic text-[#e8d49b] tracking-[4px] uppercase mb-3">
              Signature Collection
            </p>
            <h2 className="serif text-4xl md:text-6xl text-white leading-[1.15] mb-1">
              Timeless Jewellery
            </h2>
            <h2 className="serif text-2xl md:text-5xl text-white leading-[1.15] mb-2 whitespace-nowrap">
              Crafted For Every Celebration
            </h2>
            <div className="luxury-divider !my-4 before:bg-[#e8d49b]/40 after:bg-[#e8d49b]/40 text-[#e8d49b]">
              <Sparkles size={12} />
            </div>
            <p className="text-sm text-white/80 mb-6">
              Exquisite designs. Eternal elegance.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center px-10 py-3 bg-[#b8893a] text-[#1a1410] text-[11px] tracking-[3px] uppercase font-medium hover:bg-[#e8d49b] transition-all"
            >
              Explore Collection
            </Link>
          </div>
        </div>

        <div className="bg-[#1a1410] grid grid-cols-3 divide-x divide-[rgba(184,137,58,0.18)]">
          {[
            { icon: Diamond, line1: 'Certified', line2: 'Authentic' },
            { icon: ShieldCheck, line1: 'Lifetime', line2: 'Assurance' },
            { icon: Gift, line1: 'Premium', line2: 'Gifting' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center py-5 md:py-6 px-2">
              <item.icon className="text-[#b8893a] mb-2" size={20} />
              <div className="text-[9px] md:text-[10px] tracking-[1.5px] uppercase text-[#e8d49b] font-medium leading-snug">
                {item.line1}<br />{item.line2}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. NEW ARRIVALS / TRENDING */}
      <Trending />

      {/* 6. SHOP BY BUDGET */}
      <section className="gpu-layer relative overflow-hidden py-12 px-4 bg-gradient-to-br from-[#fdf6ea] via-[#fbf3e3] to-[#f5e8d3]">
        <LeafBranch className="pointer-events-none select-none absolute top-0 left-0 w-24 md:w-40 opacity-50" />
        <LeafBranch className="pointer-events-none select-none absolute top-0 right-0 w-24 md:w-40 opacity-50 -scale-x-100" />

        <div className="max-w-7xl mx-auto relative">
          <p className="section-tag-italic">Find Your Perfect Piece</p>
          <h2 className="section-heading">Shop By Budget</h2>
          <div className="luxury-divider">
            <span className="w-7 h-7 rounded-full border border-[#b8893a]/40 flex items-center justify-center">
              <ShoppingBag size={12} />
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mt-6">
            {[
              { label: 'Under ₹4,999', range: '999-4999', count: '120+', Icon: WalletIcon, light: '#DCEFE2', deep: '#BFE1CE', accent: '#3E9C73' },
              { label: '₹5,000 - ₹9,999', range: '5000-9999', count: '85+', Icon: TagIcon, light: '#DDEAFB', deep: '#C3D8F5', accent: '#3D6FA8' },
              { label: '₹10,000 - ₹24,999', range: '10000-24999', count: '60+', Icon: BagIcon, light: '#EAE0FA', deep: '#D7C5F3', accent: '#8856D6' },
              { label: 'Above ₹25,000', range: 'above-25000', count: '40+', Icon: GemIcon, light: '#F8EDCB', deep: '#EEDDA6', accent: '#A6790C' },
            ].map((b, i) => (
              <Link
                key={i}
                href={`/collections?price=${b.range}`}
                className="luxury-card rounded-2xl p-4 md:p-7 text-center flex flex-col items-center"
              >
                <div
                  className="budget-icon w-16 h-16 md:w-[72px] md:h-[72px] rounded-full flex items-center justify-center mb-3 md:mb-4"
                  style={{
                    background: `radial-gradient(circle at 34% 28%, ${b.light} 0%, ${b.deep} 100%)`,
                    boxShadow: `inset 0 1px 2px rgba(255,255,255,0.7), inset 0 0 0 1px ${b.accent}33, 0 6px 14px ${b.accent}26`,
                  }}
                >
                  <b.Icon />
                </div>
                <div
                  className="flex items-center gap-2 text-[9px] md:text-[10px] tracking-[2px] uppercase font-semibold mb-2"
                  style={{ color: b.accent }}
                >
                  <span className="h-px w-3 md:w-4 opacity-50" style={{ backgroundColor: b.accent }} />
                  Budget
                  <span className="h-px w-3 md:w-4 opacity-50" style={{ backgroundColor: b.accent }} />
                </div>
                <div className="serif lining-nums text-lg md:text-2xl text-[#1a1410] font-normal mb-3 whitespace-nowrap">
                  {b.label}
                </div>
                <div className="flex items-center gap-2 w-full mb-3">
                  <span className="h-px flex-1 bg-[#b8893a]/25" />
                  <span className="w-1.5 h-1.5 rotate-45 bg-[#b8893a] shrink-0" />
                  <span className="h-px flex-1 bg-[#b8893a]/25" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] md:text-sm font-medium" style={{ color: b.accent }}>
                  <Package size={14} />
                  {b.count} Products
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BESTSELLERS */}
      <Bestseller />

      {/* 8. RUDRAKSH FEATURE BLOCK (dark) */}
      <section className="px-4 md:px-8">
        <div className="gpu-layer max-w-7xl mx-auto rounded-2xl bg-gradient-to-br from-[#3b2a17] via-[#2c1f11] to-[#1d140a] text-[#e8d49b] py-8 md:py-12 px-6 md:px-12 text-center relative overflow-hidden shadow-[0_14px_30px_rgba(43,31,18,0.28)]">
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-6 md:right-6 text-[240px] md:text-[360px] text-[#c89043] opacity-[0.15] font-serif leading-none"
            aria-hidden="true"
          >
            ॐ
          </div>
          <div className="relative z-10">
            <p className="serif italic text-[#d4a857] text-sm tracking-[3px] uppercase mb-3">
              Sacred · Authentic · Blessed
            </p>
            <h2 className="serif text-4xl md:text-5xl text-white font-normal mb-4">
              Authentic <em className="text-[#d4a857]">Rudraksh</em>
            </h2>
            <p className="text-sm md:text-base text-[#efe0bd]/85 leading-relaxed max-w-xs md:max-w-md mx-auto mb-6">
              Certified beads sourced from Nepal & Indonesia. From 1 Mukhi to 21 Mukhi —
              for prosperity, peace, and protection.
            </p>
            <Link
              href="/collections?type=rudraksh"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-[#d4a857]/80 text-[#e3b96b] text-[11px] md:text-xs tracking-[3px] uppercase font-medium hover:bg-[#b8893a] hover:text-[#1a1410] transition-all"
            >
              Explore Sacred Collection <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. TRENDING NOW (sale products) */}
      <section className="pt-6 pb-8 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-px w-7 md:w-10 bg-[#b8893a]/50" />
            <span className="text-[#b8893a] text-[9px] leading-none">✦</span>
            <span className="h-px w-3.5 md:w-5 bg-[#b8893a]/50" />
          </span>
          <p className="section-tag-italic !mb-0">Most Loved This Season</p>
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="h-px w-3.5 md:w-5 bg-[#b8893a]/50" />
            <span className="text-[#b8893a] text-[9px] leading-none">✦</span>
            <span className="h-px w-7 md:w-10 bg-[#b8893a]/50" />
          </span>
        </div>
        <h2 className="section-heading">Trending Now</h2>
        <div className="luxury-divider">
          <Sparkles size={10} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 mt-6">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* 10. HOW TO STYLE */}
      <section className="pt-10 pb-12 px-4 bg-[#f9f3e8]">
        <div className="max-w-5xl mx-auto">
          <FleurOrnament className="w-7 h-4 mx-auto text-[#c9a24a] mb-2" />
          <div className="flex items-center justify-center gap-3 md:gap-5">
            <span className="h-px w-8 md:w-14 bg-[#c9a24a]/70" />
            <h2 className="display text-xl md:text-3xl tracking-[3px] md:tracking-[5px] uppercase text-[#8e1f2f] whitespace-nowrap">
              How To Style
            </h2>
            <span className="h-px w-8 md:w-14 bg-[#c9a24a]/70" />
          </div>
          <p className="text-center text-[13px] md:text-base text-[#3a2f24] mt-2 mb-8">
            Elevate your elegance with the perfect jewelry styling
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { Icon: User, lead: 'Pair with sleek', rest: 'bun or open hair to highlight the earrings.' },
              { Icon: Gem, lead: 'Let the', rest: 'necklace be the statement piece.' },
              { Icon: Shirt, lead: 'Wear with', rest: 'sarees or draped outfits for a regal look.' },
              { Icon: Sparkles, lead: 'Avoid heavy', rest: 'neckpieces — this set speaks for itself.' },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#e3d6bf] px-3 py-5 text-center">
                <t.Icon className="w-7 h-7 md:w-9 md:h-9 mx-auto mb-3 text-[#8e1f2f]" strokeWidth={1.6} />
                <p className="text-[12px] md:text-sm leading-snug text-[#3a2f24]">
                  <span className="text-[#8e1f2f] font-semibold">{t.lead}</span> {t.rest}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 max-w-[280px] md:max-w-md mx-auto bg-white p-2 rounded-2xl border border-[#d4a857]/60">
            <img
              src="/images/style-model.jpg"
              alt="Model wearing traditional gold temple jewellery"
              width={760}
              height={1140}
              loading="lazy"
              className="block w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* 11 + 12. ABOUT + STATS */}
      <About />

      {/* 12. CUSTOMER REVIEWS */}
      <Testimonials />

      {/* 13. PAYMENT OPTIONS */}
      <PaymentOptions showWhatsApp={false} />

      {/* 14. INSTAGRAM GALLERY */}
      <InstagramGallery />

      {/* 15. NEWSLETTER */}
      <Newsletter />

      {/* 16. SOCIAL CONTACT STRIP */}
      <section className="bg-[#fbf8f1] py-8 px-4 border-t border-[rgba(184,137,58,0.18)]">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-6 md:gap-10 text-center">
          {[
            { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com' },
            { icon: FaFacebook, label: 'Facebook', href: 'https://facebook.com' },
            { icon: FaYoutube, label: 'YouTube', href: 'https://youtube.com' },
            { icon: MessageCircle, label: 'WhatsApp', href: whatsappLink() },
          ].map((s, i) => (
            <a
              key={i}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 group"
            >
              <s.icon
                className="text-[#1a1410] group-hover:text-[#b8893a] transition-colors"
                size={20}
              />
              <span className="text-[10px] tracking-[1.5px] uppercase text-[#6b5d4c]">
                {s.label}
              </span>
            </a>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}