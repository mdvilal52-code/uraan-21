'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, ShoppingBag, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';

/* ──────────────────────────────────────────────
   OMGP Logo Mark — approximates the circular brand emblem from the official
   logo reference (Reference 3). Uses navy + gold brand colors with Om symbol,
   crown, diamond gem, and rudraksha beads on the right arc.
   ────────────────────────────────────────────── */
function OmgpEmblem({ size = 48 }: { size?: number }) {
  const beadAngles = [-42, -18, 8, 34, 60, 86];
  const beadR = 21;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* Outer gold ring */}
      <circle cx="24" cy="24" r="22" stroke="#C9A24A" strokeWidth="1.5" />
      {/* Inner accent ring */}
      <circle cx="24" cy="24" r="17.5" stroke="#C9A24A" strokeWidth="0.7" opacity="0.5" />

      {/* Om (ॐ) symbol */}
      <text x="24" y="19" textAnchor="middle" fill="#C9A24A" fontSize="10"
        fontFamily="'Cormorant Garamond', Georgia, serif" fontWeight="600">ॐ</text>

      {/* Crown spikes */}
      <path d="M16 27.5 L18.5 23 L21 24.5 L24 21 L27 24.5 L29.5 23 L32 27.5"
        stroke="#C9A24A" strokeWidth="1.4" fill="none"
        strokeLinejoin="round" strokeLinecap="round" />
      {/* Crown base bar */}
      <rect x="16" y="27" width="16" height="1.8" rx="0.9" fill="#C9A24A" />

      {/* Diamond gem — navy blue facets */}
      <path d="M20 30 L24 25.5 L28 30 L24 37Z" fill="#1a2744" />
      <path d="M20 30 L28 30 L24 25.5Z" fill="#2d4f8a" opacity="0.75" />
      <path d="M20 30 L24 30 L24 37Z" fill="#0e1a30" opacity="0.9" />

      {/* Rudraksha beads along right arc */}
      {beadAngles.map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const bx = 24 + beadR * Math.cos(rad);
        const by = 24 + beadR * Math.sin(rad);
        return (
          <g key={deg}>
            <circle cx={bx} cy={by} r="2" fill="#7B4426" />
            <circle cx={bx} cy={by} r="1.1" fill="#A8623A" opacity="0.55" />
          </g>
        );
      })}
    </svg>
  );
}

/* Full logo: emblem + brand name text */
function OmgpLogo({ size = 48, tagline }: { size?: number; tagline?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <OmgpEmblem size={size} />
      <div className="flex flex-col">
        <div className="flex items-baseline leading-none">
          <span
            className="font-bold tracking-tight text-[#1a2744]"
            style={{ fontFamily: "'Cinzel', serif", fontSize: size * 0.44 }}
          >
            OMGP
          </span>
          <span
            className="font-bold tracking-tight text-[#C9A24A]"
            style={{ fontFamily: "'Cinzel', serif", fontSize: size * 0.44 }}
          >
            GEMS
          </span>
        </div>
        <span
          className="text-[#6b5d4c] leading-tight mt-0.5 whitespace-nowrap"
          style={{ fontSize: size * 0.17, letterSpacing: '0.04em' }}
        >
          {tagline ?? 'Om Gauri Putra Gems Jewellery and Rudraksh'}
        </span>
      </div>
    </div>
  );
}

/* Shared search form — used in both mobile and desktop header */
function SearchForm({
  className,
  inputClassName,
  buttonClassName,
}: {
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-stretch ${className ?? ''}`}
    >
      <input
        ref={inputRef}
        type="search"
        placeholder="Search for products, categories, jewellery..."
        aria-label="Search products"
        className={`flex-1 bg-white text-[#1a1410] placeholder-[#9a8c75] outline-none
          border border-[rgba(184,137,58,0.32)] rounded-full
          text-sm pl-5 pr-1 py-2.5 focus:border-[#C9A24A] transition-colors ${inputClassName ?? ''}`}
      />
      <button
        type="submit"
        aria-label="Search"
        className={`absolute right-1 top-1 bottom-1 flex items-center justify-center
          bg-[#C9A24A] hover:bg-[#b8893a] text-white rounded-full
          transition-colors px-4 ${buttonClassName ?? ''}`}
      >
        <Search size={16} strokeWidth={2.5} />
      </button>
    </form>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems: cartCount, openCart } = useCart();

  return (
    <>
      <AnnouncementBar />

      <header className="sticky top-0 z-50 bg-white border-b border-[rgba(184,137,58,0.18)] shadow-[0_1px_8px_rgba(0,0,0,0.06)]">

        {/* ── DESKTOP HEADER (md+) ── */}
        <div className="hidden md:flex items-center gap-5 px-6 py-3 max-w-[1600px] mx-auto">

          {/* Left: Logo + Nav links stacked */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <Link href="/" aria-label="OMGPGEMS Home">
              <OmgpLogo size={46} />
            </Link>
            <nav
              aria-label="Site navigation"
              className="flex gap-5 ml-0.5 text-[10.5px] tracking-[1.5px] font-semibold uppercase text-[#3a2f24]"
            >
              <Link href="/about" className="hover:text-[#b8893a] transition-colors">About</Link>
              <Link href="/contact" className="hover:text-[#b8893a] transition-colors">Contact</Link>
              <Link href="/register" className="hover:text-[#b8893a] transition-colors">Register</Link>
              <Link href="/wishlist" className="hover:text-[#b8893a] transition-colors">Wishlist</Link>
            </nav>
          </div>

          {/* Center: Premium search bar */}
          <div className="flex-1 flex items-center justify-center px-4">
            <SearchForm
              className="w-full max-w-[640px] shadow-[0_2px_10px_rgba(184,137,58,0.12)]"
              inputClassName="text-sm"
            />
          </div>

          {/* Right: Login + Cart */}
          <div className="flex items-center gap-5 shrink-0">
            <Link
              href="/login"
              className="flex flex-col items-center gap-0.5 text-[#1a1410] hover:text-[#b8893a] transition-colors group"
            >
              <User size={22} strokeWidth={1.7} />
              <span className="text-[9px] tracking-[1.5px] uppercase font-semibold">Login</span>
            </Link>

            <button
              onClick={openCart}
              aria-label={`Cart — ${cartCount} items`}
              className="flex flex-col items-center gap-0.5 text-[#1a1410] hover:text-[#b8893a] transition-colors relative"
            >
              <div className="relative">
                <ShoppingBag size={22} strokeWidth={1.7} />
                <span
                  className="absolute -top-1.5 -right-2 bg-[#1a2744] text-white text-[9px] font-bold
                    min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 leading-none"
                >
                  {cartCount}
                </span>
              </div>
              <span className="text-[9px] tracking-[1.5px] uppercase font-semibold">Cart</span>
            </button>
          </div>
        </div>

        {/* ── MOBILE HEADER (< md) ── */}
        <div className="md:hidden">
          {/* Row 1: Hamburger | Logo | Login + Cart */}
          <div className="flex items-center justify-between px-3 py-2.5">

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 flex items-center justify-center text-[#1a1410]"
            >
              <Menu size={22} strokeWidth={1.8} />
            </button>

            {/* Logo — centered */}
            <Link href="/" aria-label="OMGPGEMS Home" className="flex items-center gap-2">
              <OmgpEmblem size={38} />
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none">
                  <span className="font-bold text-[15px] tracking-tight text-[#1a2744]"
                    style={{ fontFamily: "'Cinzel', serif" }}>OMGP</span>
                  <span className="font-bold text-[15px] tracking-tight text-[#C9A24A]"
                    style={{ fontFamily: "'Cinzel', serif" }}>GEMS</span>
                </div>
                <span className="text-[7px] text-[#6b5d4c] tracking-wide mt-0.5 whitespace-nowrap">
                  Original Wastik Gems Jewellery
                </span>
              </div>
            </Link>

            {/* Login + Cart */}
            <div className="flex items-center gap-0.5">
              <Link
                href="/login"
                className="flex flex-col items-center w-10 h-10 justify-center text-[#1a1410] hover:text-[#b8893a]"
                aria-label="Login"
              >
                <User size={20} strokeWidth={1.7} />
                <span className="text-[7px] tracking-wide">Login</span>
              </Link>
              <button
                onClick={openCart}
                aria-label={`Cart — ${cartCount} items`}
                className="flex flex-col items-center w-10 h-10 justify-center text-[#1a1410] hover:text-[#b8893a] relative"
              >
                <div className="relative">
                  <ShoppingBag size={20} strokeWidth={1.7} />
                  <span
                    className="absolute -top-1.5 -right-2 bg-[#1a2744] text-white text-[8px] font-bold
                      min-w-[15px] h-3.5 rounded-full flex items-center justify-center px-0.5 leading-none"
                  >
                    {cartCount}
                  </span>
                </div>
                <span className="text-[7px] tracking-wide">Cart</span>
              </button>
            </div>
          </div>

          {/* Row 2: Search bar */}
          <div className="px-3 pb-3">
            <SearchForm className="shadow-[0_1px_6px_rgba(184,137,58,0.1)]" />
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
