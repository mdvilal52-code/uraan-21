'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, User, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import MobileMenu from './MobileMenu';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems: cartCount, openCart } = useCart();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 md:px-8 md:py-4">
          {/* Left: hamburger — opens mobile nav drawer */}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-[#0B1E42]"
          >
            <Menu size={24} strokeWidth={1.8} />
          </button>

          {/* Center-left: logo lockup */}
          <Link href="/" aria-label="OMGPGEMS Home" className="flex min-w-0 items-center gap-2">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full md:h-12 md:w-12">
              {/* [IMAGE: logo-mark.png] — circular OMGP emblem (Om symbol + trishul +
                  rudraksha mala icon). Placeholder only — swap in the supplied file. */}
              <Image
                src="/images/logo-mark.png"
                alt="OMGPGEMS logo mark"
                fill
                sizes="48px"
                className="object-contain"
              />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="font-display text-base font-bold tracking-wide text-[#0B1E42] md:text-2xl">
                OMGPGEMS
              </span>
              <span className="truncate text-[8.5px] text-[#8a8a8a] md:text-xs">
                Original Wastik Gems Jewellery and Rudraksh
              </span>
            </span>
          </Link>

          {/* Right: login + cart */}
          <div className="flex shrink-0 items-center gap-4 md:gap-7">
            <Link
              href="/login"
              className="flex flex-col items-center gap-0.5 text-[#0B1E42] transition-colors hover:text-[#C9932E]"
            >
              <User size={22} strokeWidth={1.6} />
              <span className="font-poppins text-[9px] font-medium uppercase tracking-wide">Login</span>
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
              <span className="font-poppins text-[9px] font-medium uppercase tracking-wide">Cart</span>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
