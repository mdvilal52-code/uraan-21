'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import { searchProducts } from '@/lib/products';
import { useProducts } from '@/hooks/useProducts';
import { Search, X } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const { products: list } = useProducts();
  const results = initialQuery ? searchProducts(initialQuery, list) : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Search</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <h1 className="serif text-4xl text-[#1a1410] mb-2">Search</h1>
        {initialQuery && (
          <p className="text-sm text-[#6b5d4c]">
            {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;<span className="text-[#b8893a] font-semibold">{initialQuery}</span>&rdquo;
          </p>
        )}
      </div>

      {/* Search Bar */}
      <section className="max-w-2xl mx-auto px-4 pb-6">
        <form
          onSubmit={handleSearch}
          className="flex items-center bg-white border-2 border-[#1a1410] px-4 py-2"
        >
          <Search size={18} className="text-[#b8893a] mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jewellery, rudraksh, gems..."
            className="flex-1 outline-none bg-transparent text-sm"
            autoFocus
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Clear" className="text-[#9a8c75] hover:text-[#1a1410]">
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            className="ml-3 px-6 py-2 bg-[#1a1410] text-[#e8d49b] text-[10px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
          >
            Search
          </button>
        </form>

        {!initialQuery && (
          <div className="mt-6 text-center">
            <div className="text-[10px] tracking-[2px] uppercase text-[#9a8c75] mb-3">Popular Searches</div>
            <div className="flex flex-wrap justify-center gap-2">
              {['Necklace', 'Diamond Ring', 'Earrings', 'Rudraksh', 'Bridal Set', 'Gold Chain', 'Pendant', 'Bangle'].map((p) => (
                <button
                  key={p}
                  onClick={() => router.push(`/search?q=${p}`)}
                  className="px-3 py-1 border border-[rgba(184,137,58,0.32)] text-xs hover:bg-[#f8f2e6]"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        {initialQuery && results.length === 0 ? (
          <div className="text-center py-20 bg-[#f8f2e6] border border-[rgba(184,137,58,0.18)]">
            <Search className="text-[#b8893a] mx-auto mb-4" size={48} />
            <p className="serif text-2xl text-[#1a1410] mb-3">No results found</p>
            <p className="text-sm text-[#6b5d4c] mb-6 max-w-md mx-auto">
              Try different keywords or browse our full collection.
            </p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
            >
              Browse All Products
            </Link>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SearchContent />
    </Suspense>
  );
}