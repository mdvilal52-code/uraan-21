'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="bg-[#87CEEB] px-4 py-3 md:hidden">
      <form onSubmit={handleSubmit} className="relative mx-auto max-w-7xl md:max-w-2xl">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search for products, categories, jewellery..."
          aria-label="Search products"
          className="h-12 w-full rounded-full border border-white/70 bg-white pl-5 pr-14 font-poppins text-sm text-[#1a1410] placeholder-[#6b6b6b] outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute -right-1 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-[#C9932E] text-white shadow-md transition-colors hover:bg-[#b8822a]"
        >
          <Search size={19} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
