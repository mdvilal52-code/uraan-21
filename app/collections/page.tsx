'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { SlidersHorizontal, X } from 'lucide-react';

function CollectionsContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') || '';
  const priceParam = searchParams.get('price') || '';
  const queryParam = searchParams.get('q') || '';

  const [sortBy, setSortBy] = useState('newest');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(typeParam);
  const [priceRange, setPriceRange] = useState(priceParam);

  const { products: liveProducts } = useProducts();
  const { categories } = useCategories();

  const filtered = useMemo(() => {
    let list = [...liveProducts];

    if (typeParam === 'new') {
      list = list.filter((p) => p.tag === 'new');
    } else if (typeParam === 'bestseller') {
      list = list.filter((p) => p.tag === 'bestseller');
    } else if (typeParam === 'sale') {
      list = list.filter((p) => p.tag === 'sale');
    } else if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (priceRange) {
      const ranges: Record<string, [number, number]> = {
        '999-4999': [0, 4999],
        '5000-9999': [5000, 9999],
        '10000-24999': [10000, 24999],
        'above-25000': [25000, Infinity],
      };
      const r = ranges[priceRange];
      if (r) {
        list = list.filter((p) => p.price >= r[0] && p.price <= r[1]);
      }
    }

    if (queryParam) {
      const q = queryParam.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [typeParam, selectedCategory, priceRange, queryParam, sortBy, liveProducts]);

  const title = typeParam
    ? typeParam === 'new'
      ? 'New Arrivals'
      : typeParam === 'bestseller'
      ? 'Bestsellers'
      : typeParam === 'sale'
      ? 'Sale Items'
      : categories.find((c) => c.slug === typeParam)?.name || 'All Products'
    : queryParam
    ? `Search: "${queryParam}"`
    : 'All Products';

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>{title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <h1 className="serif text-4xl md:text-5xl text-[#1a1410] mb-2">{title}</h1>
        <p className="text-sm text-[#6b5d4c]">
          Discover {filtered.length} exquisite pieces handcrafted with love.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#fbf8f1] border-y border-[rgba(184,137,58,0.18)] sticky top-[60px] md:top-[110px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setFilterOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-[rgba(184,137,58,0.32)] px-4 py-2 text-[11px] font-semibold tracking-[1.5px] uppercase hover:border-[#1a1410]"
          >
            <SlidersHorizontal size={12} className="text-[#b8893a]" />
            Filter
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-[rgba(184,137,58,0.32)] px-4 py-2 text-[11px] tracking-[0.5px] outline-none cursor-pointer"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Most Loved</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="serif text-2xl text-[#1a1410] mb-3">No products found</p>
            <p className="text-sm text-[#6b5d4c] mb-6">
              Try adjusting your filters or browse other collections.
            </p>
            <Link href="/collections" className="luxury-btn">View All Products</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="text-center text-[11px] text-[#9a8c75] italic mt-8">
              Showing all {filtered.length} results
            </div>
          </>
        )}
      </section>

      {/* Filter Sidebar */}
      {filterOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm"
          onClick={() => setFilterOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-white z-[201] transition-transform duration-300 flex flex-col ${
          filterOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-5 py-5 border-b border-[rgba(184,137,58,0.18)] flex items-center justify-between">
          <h3 className="display text-sm tracking-[3px] uppercase">Filters</h3>
          <button onClick={() => setFilterOpen(false)} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-6">
            <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-3 font-semibold">
              Category
            </div>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('')}
                className={`block w-full text-left text-sm py-1.5 ${
                  !selectedCategory ? 'text-[#b8893a] font-semibold' : 'text-[#1a1410]'
                }`}
              >
                All Categories
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setSelectedCategory(c.slug)}
                  className={`block w-full text-left text-sm py-1.5 ${
                    selectedCategory === c.slug ? 'text-[#b8893a] font-semibold' : 'text-[#1a1410]'
                  }`}
                >
                  {c.name} <span className="text-[#9a8c75] text-xs">({c.count})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-3 font-semibold">
              Price Range
            </div>
            <div className="space-y-2">
              {[
                { val: '', label: 'All Prices' },
                { val: '999-4999', label: 'Under ₹5,000' },
                { val: '5000-9999', label: '₹5,000 - ₹10,000' },
                { val: '10000-24999', label: '₹10,000 - ₹25,000' },
                { val: 'above-25000', label: 'Above ₹25,000' },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setPriceRange(p.val)}
                  className={`block w-full text-left text-sm py-1.5 ${
                    priceRange === p.val ? 'text-[#b8893a] font-semibold' : 'text-[#1a1410]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[rgba(184,137,58,0.18)] grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setSelectedCategory('');
              setPriceRange('');
            }}
            className="py-3 border border-[#1a1410] text-[10px] tracking-[2px] uppercase font-semibold"
          >
            Clear All
          </button>
          <button
            onClick={() => setFilterOpen(false)}
            className="py-3 bg-[#1a1410] text-[#e8d49b] text-[10px] tracking-[2px] uppercase font-semibold"
          >
            Apply
          </button>
        </div>
      </aside>

      <Footer />
    </main>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CollectionsContent />
    </Suspense>
  );
}