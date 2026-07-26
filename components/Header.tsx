'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, User, ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MobileMenu from './MobileMenu';

const NAV_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Register', href: '/register' },
  { label: 'Wishlist', href: '/wishlist' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems: cartCount, openCart } = useCart();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  function handleDesktopSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchRef.current?.value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#0B1E42]/10 bg-[#87CEEB]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 md:gap-6 md:px-8 md:py-4">
          {/* Left: hamburger — mobile only */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#0B1E42] md:hidden"
          >
            <Menu size={24} strokeWidth={1.8} />
          </button>

          {/* Logo lockup (+ desktop nav links beneath) */}
          <div className="flex min-w-0 flex-col">
            <Link href="/" aria-label="OMGPGEMS Home" className="flex min-w-0 items-center gap-2 md:gap-3">
              <span className="relative h-10 w-10 shrink-0 md:h-16 md:w-16">
                <Image
                  src="/images/logo-mark.png"
                  alt="OMGPGEMS logo mark"
                  fill
                  sizes="64px"
                  className="object-contain"
                  priority
                />
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="font-display text-base font-bold tracking-wide text-[#0B1E42] md:text-2xl">
                  OMGPGEMS
                </span>
                <span className="truncate text-[8.5px] font-medium text-[#0B1E42] md:text-xs">
                  Om Gauri Putra Jewellery &amp; Rudraksha
                </span>
              </span>
            </Link>
            {/* Desktop nav links */}
            <nav className="hidden gap-6 pl-[76px] pt-1.5 md:flex">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-poppins text-xs font-medium uppercase tracking-[0.12em] text-[#0B1E42] transition-colors hover:text-[#C9932E]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: desktop search */}
          <form
            onSubmit={handleDesktopSearch}
            className="relative hidden max-w-xl flex-1 md:block"
          >
            <input
              ref={searchRef}
              type="search"
              placeholder="Search for products, categories, jewellery..."
              aria-label="Search products"
              className="h-12 w-full rounded-full border border-[#E4D9BE] bg-[#FBF9F3] pl-12 pr-16 font-poppins text-sm text-[#1a1410] placeholder-[#8a8a8a] outline-none focus:border-[#C9932E]"
            />
            <Search
              size={18}
              strokeWidth={2}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8a8a]"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 flex h-9 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-b from-[#D9A441] to-[#b8822a] text-white shadow-sm transition-colors hover:from-[#c99532] hover:to-[#a5751f]"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>
          </form>

          {/* Right: login + cart */}
          <div className="flex shrink-0 items-center gap-4 md:gap-7">
            <Link
              href="/login"
              className="flex flex-col items-center gap-0.5 text-[#0B1E42] transition-colors hover:text-[#C9932E]"
            >
              <User size={22} strokeWidth={1.6} />
              <span className="font-poppins text-[9px] font-medium uppercase tracking-wide md:text-[10px]">Login</span>
            </Link>
            <button
              onClick={openCart}
              aria-label={`Cart — ${cartCount} items`}
              className="flex flex-col items-center gap-0.5 text-[#0B1E42] transition-colors hover:text-[#C9932E]"
            >
              <span className="relative">
                <ShoppingCart size={22} strokeWidth={1.6} />
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0B1E42] px-0.5 text-[9px] font-bold leading-none text-white">
                  {cartCount}
                </span>
              </span>
              <span className="font-poppins text-[9px] font-medium uppercase tracking-wide md:text-[10px]">Cart</span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
