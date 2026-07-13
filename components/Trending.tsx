'use client';

import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import { getNewArrivals } from '@/lib/products';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from './ProductCard';

export default function Trending() {
  const { products: list } = useProducts();
  const trending = getNewArrivals(8, list);

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[#b8893a] serif italic text-sm tracking-[2px]">Just Landed</p>
          <h2 className="display text-2xl md:text-3xl tracking-[3px] uppercase text-[#1a1410]">
            New Arrivals
          </h2>
        </div>
        <Link
          href="/collections?type=new"
          className="text-[10px] font-semibold tracking-[2px] uppercase border-b border-[#1a1410] pb-1 flex items-center gap-1 hover:text-[#b8893a] hover:border-[#b8893a]"
        >
          View All <ChevronRight size={12} />
        </Link>
      </div>
      <div className="luxury-divider">
        <Sparkles size={10} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mt-6">
        {trending.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}