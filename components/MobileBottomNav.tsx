'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, LayoutGrid, Heart, User, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/wishlistContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems: cartCount } = useCart();
  const { totalItems: wishCount } = useWishlist();

  const items = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: LayoutGrid, label: 'Categories', href: '/collections' },
    { icon: Heart, label: 'Wishlist', href: '/wishlist', badge: wishCount },
    { icon: User, label: 'Account', href: '/profile' },
    { icon: ShoppingBag, label: 'Cart', href: '/cart', badge: cartCount },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[100] grid grid-cols-5 bg-white border-t border-[rgba(184,137,58,0.18)]">
      {items.map((item) => {
        const active =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 py-2 text-[9px] tracking-[1px] uppercase transition-colors ${
              active ? 'text-[#b8893a]' : 'text-[#6b5d4c]'
            }`}
          >
            <item.icon size={18} />
            {!!item.badge && (
              <span className="absolute top-1 right-[24%] bg-[#1a1410] text-[#e8d49b] text-[8px] font-bold min-w-[14px] h-[14px] rounded-full grid place-items-center px-1">
                {item.badge}
              </span>
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
