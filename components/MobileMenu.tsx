'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  X, Heart, ShoppingBag, User, Phone, ChevronRight, Gem,
} from 'lucide-react';
import { categories } from '@/data/jewelleryData';
import { CATEGORY_ICONS } from '@/lib/categoryStyles';

type MobileMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const pathname = usePathname();

  // Read the `type` query param on the client only (avoids useSearchParams,
  // which would force every page that renders the navbar into a Suspense
  // boundary). Re-checked on navigation and whenever the menu opens.
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setActiveCategory(
      pathname === '/collections'
        ? new URLSearchParams(window.location.search).get('type')
        : null
    );
  }, [pathname, isOpen]);

  const isActive = (href: string) => {
    const [path, query] = href.split('?');
    if (path !== pathname) return false;
    if (!query) return pathname !== '/collections' || !activeCategory;
    const params = new URLSearchParams(query);
    return params.get('type') === activeCategory;
  };

  const linkClass = (active: boolean) =>
    `flex items-center gap-3 px-6 py-3 text-sm transition-colors duration-200 border-l-2 ${
      active
        ? 'text-[#b8893a] bg-[rgba(184,137,58,0.08)] border-[#b8893a] font-semibold'
        : 'text-[#3a2f24] border-transparent hover:text-[#b8893a] hover:bg-[rgba(184,137,58,0.06)]'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-white z-[201] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col shadow-luxury-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-[#f8f2e6] px-6 py-7 border-b border-[rgba(184,137,58,0.18)] text-center relative">
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="absolute top-3 right-3 w-8 h-8 grid place-items-center text-[#6b5d4c]"
          >
            <X size={18} />
          </button>
          <div className="flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#b8893a] rotate-45" />
            <span className="display text-sm font-semibold tracking-[3px] text-[#1a1410]">
              OM GAURI PUTRA
            </span>
            <span className="w-1.5 h-1.5 bg-[#b8893a] rotate-45" />
          </div>
          <div className="text-[8px] tracking-[3px] text-[#9a8c75] mt-2 uppercase">
            Gems · Jewellery · Rudraksh
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Main Links */}
          <div className="text-[9px] tracking-[2.5px] uppercase text-[#9a8c75] px-6 pt-4 pb-2 font-semibold">
            Browse
          </div>
          <Link href="/" onClick={onClose} className={`${linkClass(isActive('/'))} justify-between`}>
            <span>Home</span>
            <ChevronRight size={14} className={isActive('/') ? 'text-[#b8893a]' : 'opacity-30'} />
          </Link>
          <Link href="/collections" onClick={onClose} className={`${linkClass(isActive('/collections'))} justify-between`}>
            <span>All Products</span>
            <ChevronRight size={14} className={isActive('/collections') ? 'text-[#b8893a]' : 'opacity-30'} />
          </Link>

          {/* Categories */}
          <div className="text-[9px] tracking-[2.5px] uppercase text-[#9a8c75] px-6 pt-5 pb-2 font-semibold">
            Categories
          </div>
          {categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug] ?? Gem;
            const active = isActive(`/collections?type=${cat.slug}`);
            return (
              <Link
                key={cat.slug}
                href={`/collections?type=${cat.slug}`}
                onClick={onClose}
                className={linkClass(active)}
              >
                <Icon size={15} className={active ? 'text-[#b8893a]' : 'text-[#b8893a]/70'} />
                <span className="flex-1 tracking-[0.2px]">{cat.name}</span>
                <span className="text-[10px] text-[#9a8c75]">{cat.count}</span>
              </Link>
            );
          })}

          {/* Account */}
          <div className="text-[9px] tracking-[2.5px] uppercase text-[#9a8c75] px-6 pt-5 pb-2 font-semibold">
            Account
          </div>
          <Link href="/login" onClick={onClose} className={linkClass(isActive('/login'))}>
            <User size={15} className="text-[#b8893a]/70" /> Login / Register
          </Link>
          <Link href="/profile" onClick={onClose} className={linkClass(isActive('/profile'))}>
            <User size={15} className="text-[#b8893a]/70" /> My Profile
          </Link>
          <Link href="/wishlist" onClick={onClose} className={linkClass(isActive('/wishlist'))}>
            <Heart size={15} className="text-[#b8893a]/70" /> Wishlist
          </Link>
          <Link href="/cart" onClick={onClose} className={linkClass(isActive('/cart'))}>
            <ShoppingBag size={15} className="text-[#b8893a]/70" /> Cart
          </Link>

          {/* Other */}
          <div className="text-[9px] tracking-[2.5px] uppercase text-[#9a8c75] px-6 pt-5 pb-2 font-semibold">
            More
          </div>
          <Link href="/about" onClick={onClose} className={`${linkClass(isActive('/about'))} justify-between`}>
            <span>About Us</span>
            <ChevronRight size={14} className={isActive('/about') ? 'text-[#b8893a]' : 'opacity-30'} />
          </Link>
          <Link href="/contact" onClick={onClose} className={`${linkClass(isActive('/contact'))} justify-between`}>
            <span>Contact</span>
            <ChevronRight size={14} className={isActive('/contact') ? 'text-[#b8893a]' : 'opacity-30'} />
          </Link>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[rgba(184,137,58,0.18)] text-center">
          <div className="text-[10px] tracking-[1.5px] text-[#6b5d4c]">Need Help?</div>
          <a href="tel:+919876543210" className="text-sm font-semibold text-[#b8893a] mt-1 inline-flex items-center gap-2">
            <Phone size={12} /> +91 98765 43210
          </a>
        </div>
      </aside>
    </>
  );
}