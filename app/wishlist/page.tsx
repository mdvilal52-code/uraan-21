'use client';

import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import AddToCartButton from '@/components/AddToCartButton';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { useWishlist } from '@/context/wishlistContext';
import { Heart, ChevronRight, Trash2, X } from 'lucide-react';

export default function WishlistPage() {
  const { items, totalItems, removeFromWishlist, clearWishlist } = useWishlist();

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Wishlist</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-2">My Wishlist</h1>
          <p className="text-sm text-[#6b5d4c]">
            {totalItems > 0
              ? `${totalItems} item${totalItems > 1 ? 's' : ''} saved for later.`
              : 'Your wishlist is empty.'}
          </p>
        </div>
        {totalItems > 0 && (
          <button
            onClick={clearWishlist}
            className="text-[11px] tracking-[2px] uppercase font-semibold text-[#9a8c75] hover:text-[#7a2e2e] inline-flex items-center gap-1.5 transition-colors duration-200"
          >
            <Trash2 size={13} /> Clear All
          </button>
        )}
      </div>

      <section className="max-w-7xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)]">
            <Heart className="text-[#b8893a] mx-auto mb-4" size={48} />
            <p className="serif text-2xl text-[#1a1410] mb-3">Your wishlist is empty</p>
            <p className="text-sm text-[#6b5d4c] mb-6 max-w-md mx-auto">
              Save the pieces you love and find them here anytime.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
            >
              Explore Collections <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="t-card-frame group relative bg-white border border-[rgba(184,137,58,0.18)] overflow-hidden hover:shadow-luxury hover:-translate-y-1 hover:border-[rgba(184,137,58,0.32)] transition-all duration-300"
              >
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  aria-label={`Remove ${item.name} from wishlist`}
                  className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/95 grid place-items-center text-[#6b5d4c] hover:bg-white hover:text-[#7a2e2e] hover:scale-110 active:scale-90 transition-all duration-200"
                >
                  <X size={14} />
                </button>

                <Link href={`/product/${item.id}`} className="block aspect-square relative bg-[#f8f2e6] overflow-hidden shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </Link>

                <div className="t-card-body p-3 md:p-4">
                  <Link href={`/product/${item.id}`} className="hover:text-[#b8893a] transition-colors">
                    <h3 className="t-product-title mb-2">
                      {item.name}
                    </h3>
                  </Link>
                  <PriceDisplay currentPrice={item.price} size="md" className="mb-3" />
                  <div className="mt-auto pt-1">
                    <AddToCartButton
                      product={item}
                      label="Move to Cart"
                      className="w-full py-2.5 border border-[#1a1410] text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] transition-colors duration-200 flex items-center justify-center gap-1.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
