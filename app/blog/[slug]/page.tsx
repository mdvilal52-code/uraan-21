'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import { Calendar, User, ChevronRight } from 'lucide-react';
import type { BlogPost } from '@/lib/blog';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/blog/${encodeURIComponent(slug)}`);
        const data = await res.json();
        setPost(res.ok && data.ok ? (data.post as BlogPost) : null);
      } catch {
        setPost(null);
      }
    })();
  }, [slug]);

  if (post === undefined) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="py-32 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">Loading…</div>
      </main>
    );
  }
  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <CartDrawer />

      <div className="max-w-4xl mx-auto px-4 py-3 text-[11px] text-[#9a8c75]">
        <Link href="/" className="text-[#b8893a] font-medium">Home</Link>
        <span className="mx-2 opacity-50">›</span>
        <Link href="/blog" className="text-[#b8893a] font-medium">Journal</Link>
        <span className="mx-2 opacity-50">›</span>
        <span>{post.title}</span>
      </div>

      <article className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="serif text-3xl md:text-5xl text-[#1a1410] mb-4 leading-tight">{post.title}</h1>
        <div className="flex items-center gap-4 text-[11px] tracking-[1px] uppercase text-[#9a8c75] mb-6">
          {post.author && (
            <span className="flex items-center gap-1.5">
              <User size={12} /> {post.author}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar size={12} />
            {new Date(post.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {post.coverImage && (
          <div
            className="aspect-[16/9] bg-cover bg-center bg-[#f8f2e6] mb-8"
            style={{ backgroundImage: `url(${post.coverImage})` }}
          />
        )}

        <div className="text-sm md:text-base text-[#3a2f24] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="mt-10 pt-6 border-t border-[rgba(184,137,58,0.18)]">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-[11px] tracking-[1.5px] uppercase font-semibold text-[#b8893a] hover:underline">
            <ChevronRight size={12} className="rotate-180" /> Back to Journal
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  );
}
