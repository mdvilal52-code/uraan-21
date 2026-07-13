'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, ShoppingBag, Heart, User, X, Phone, Star } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/wishlistContext';
import AnnouncementBar from './AnnouncementBar';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { totalItems: cartCount, openCart } = useCart();
  const { totalItems: wishCount } = useWishlist();

  return (
    <>
      <AnnouncementBar />

      {/* Contact Strip — desktop only */}
      <div className="hidden md:block bg-[#f8f2e6] border-b border-[rgba(184,137,58,0.18)] py-2">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-[10px] tracking-[1.5px] uppercase text-[#6b5d4c]">
          <div className="flex items-center gap-2">
            <Phone size={11} className="text-[#b8893a]" />
            <span>+91 98765 43210</span>
            <span className="mx-2 opacity-30">|</span>
            <span>info@omgauriputra.com</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-[#b8893a]">About</Link>
            <Link href="/contact" className="hover:text-[#b8893a]">Contact</Link>
            <Link href="/login" className="hover:text-[#b8893a]">Login</Link>
            <Link href="/register" className="hover:text-[#b8893a]">Register</Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[rgba(184,137,58,0.18)]">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="w-10 h-10 grid place-items-center hover:text-[#b8893a]"
            >
              <Menu size={20} />
            </button>
          </div>

          {/* Center — Brand */}
          <Link href="/" className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-[#1a1410]">
              <Star size={10} className="text-[#b8893a] fill-[#b8893a]" />
              <span className="display text-sm md:text-base font-semibold tracking-[3px]">
                OM GAURI
              </span>
              <Star size={10} className="text-[#b8893a] fill-[#b8893a]" />
            </div>
            <div className="text-[7px] md:text-[8px] tracking-[3px] text-[#9a8c75] mt-1 uppercase font-medium">
              Putra · Gems · Rudraksh
            </div>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="w-10 h-10 grid place-items-center hover:text-[#b8893a]"
            >
              <Search size={18} />
            </button>
            <Link
              href="/profile"
              aria-label="Profile"
              className="w-10 h-10 grid place-items-center hover:text-[#b8893a] hidden md:grid"
            >
              <User size={18} />
            </Link>
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="w-10 h-10 grid place-items-center hover:text-[#b8893a] relative"
            >
              <Heart size={18} />
              {wishCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#1a1410] text-[#e8d49b] text-[9px] font-bold min-w-[16px] h-4 rounded-full grid place-items-center px-1">
                  {wishCount}
                </span>
              )}
            </Link>
            <button
              onClick={openCart}
              aria-label="Cart"
              className="w-10 h-10 grid place-items-center hover:text-[#b8893a] relative"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#1a1410] text-[#e8d49b] text-[9px] font-bold min-w-[16px] h-4 rounded-full grid place-items-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Category Nav */}
        <div className="hidden md:block border-t border-[rgba(184,137,58,0.12)]">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-8 text-[11px] tracking-[2px] uppercase font-medium text-[#1a1410]">
            <Link href="/collections" className="hover:text-[#b8893a]">All Products</Link>
            <Link href="/collections?type=gold" className="hover:text-[#b8893a]">Gold</Link>
            <Link href="/collections?type=silver" className="hover:text-[#b8893a]">Silver</Link>
            <Link href="/collections?type=diamond" className="hover:text-[#b8893a]">Diamond</Link>
            <Link href="/collections?type=gems" className="hover:text-[#b8893a]">Gems</Link>
            <Link href="/collections?type=rudraksh" className="hover:text-[#b8893a] flex items-center gap-1">
              Rudraksh <span className="text-[#b8893a]">✦</span>
            </Link>
            <Link href="/collections?type=bridal" className="hover:text-[#b8893a]">Bridal</Link>
            <Link href="/collections?type=new" className="hover:text-[#b8893a]">New Arrivals</Link>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[200] flex items-start justify-center pt-20 px-4 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-white max-w-2xl w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="display text-sm tracking-[3px] text-[#1a1410]">SEARCH</h3>
              <button onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get('q') as string;
                if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`;
              }}
              className="flex items-center border-b-2 border-[#1a1410] pb-2"
            >
              <Search size={18} className="text-[#b8893a] mr-3" />
              <input
                name="q"
                type="text"
                placeholder="Search jewellery, rudraksh, gems..."
                className="flex-1 outline-none bg-transparent text-sm"
                autoFocus
              />
            </form>
            <div className="mt-4">
              <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Popular</div>
              <div className="flex flex-wrap gap-2">
                {['Necklace', 'Ring', 'Earrings', 'Rudraksh', 'Bridal Set', 'Pendant'].map((p) => (
                  <Link
                    key={p}
                    href={`/search?q=${p}`}
                    onClick={() => setSearchOpen(false)}
                    className="px-3 py-1 border border-[rgba(184,137,58,0.32)] text-xs hover:bg-[#f8f2e6]"
                  >
                    {p}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}