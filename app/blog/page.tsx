'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Sparkles, ChevronRight, Calendar, User } from 'lucide-react';
import type { BlogPost } from '@/lib/blog';

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/blog');
        const data = await res.json();
        if (res.ok) setPosts((data.posts || []) as BlogPost[]);
      } catch {
        /* keep empty */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-7xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>Journal</span>
      </div>

      <section className="text-center px-4 pt-6 pb-10 max-w-3xl mx-auto">
        <p className="serif italic text-[#b8893a] text-sm tracking-[2px] mb-2">— The Om Gauri Putra Journal —</p>
        <h1 className="serif text-4xl md:text-6xl text-[#1a1410] mb-4">
          Stories in <em className="gold-text">Gold &amp; Stone</em>
        </h1>
        <div className="luxury-divider"><Sparkles size={10} /></div>
        <p className="text-sm text-[#6b5d4c] mt-4">
          Jewellery care guides, craftsmanship stories, and everything Rudraksh &amp; gems.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        {!loaded ? (
          <div className="py-20 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-sm text-[#6b5d4c]">
            No articles published yet — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group block border border-[rgba(184,137,58,0.18)] hover:shadow-[0_12px_40px_rgba(122,90,31,0.12)] transition-all"
              >
                <div
                  className="aspect-[16/10] bg-cover bg-center bg-[#f8f2e6]"
                  style={{ backgroundImage: `url(${p.coverImage || '/images/necklace.jpg'})` }}
                />
                <div className="p-5">
                  <h2 className="serif text-xl text-[#1a1410] mb-2 group-hover:text-[#b8893a] transition-colors">
                    {p.title}
                  </h2>
                  {p.excerpt && <p className="text-sm text-[#6b5d4c] leading-relaxed mb-3 line-clamp-3">{p.excerpt}</p>}
                  <div className="flex items-center gap-3 text-[10px] tracking-[1px] uppercase text-[#9a8c75]">
                    {p.author && (
                      <span className="flex items-center gap-1">
                        <User size={11} /> {p.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar size={11} /> {new Date(p.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] tracking-[1.5px] uppercase font-semibold text-[#b8893a]">
                    Read More <ChevronRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
