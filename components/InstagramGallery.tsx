'use client';

import { useEffect, useState } from 'react';
import { FaInstagram } from 'react-icons/fa';
import { instagramImages } from '@/data/jewelleryData';

const PROFILE_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/omgauriputra';

type Post = { id: string; image: string; permalink: string; caption?: string };

// Curated images shown until the live Instagram feed is connected.
const fallbackPosts: Post[] = instagramImages.map((image, i) => ({
  id: `fallback-${i}`,
  image,
  permalink: PROFILE_URL,
}));

export default function InstagramGallery() {
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);

  useEffect(() => {
    let active = true;
    fetch('/api/instagram')
      .then((r) => r.json())
      .then((data) => {
        if (active && data?.posts?.length) setPosts(data.posts.slice(0, 6));
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-14 px-4 max-w-7xl mx-auto">
      <p className="section-tag-italic">Follow Our Journey</p>
      <h2 className="section-heading">@omgauriputra</h2>
      <div className="luxury-divider">
        <FaInstagram size={10} />
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-6">
        {posts.map((post) => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={post.caption || 'View on Instagram'}
            className="aspect-square bg-[#f8f2e6] relative group overflow-hidden rounded-md"
          >
            <div
              className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
              style={{ backgroundImage: `url(${post.image})` }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <FaInstagram
                className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                size={22}
              />
            </div>
          </a>
        ))}
      </div>

      <div className="text-center mt-7">
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-white text-[11px] tracking-[2px] uppercase font-semibold shadow-[0_6px_16px_rgba(193,53,132,0.35)] bg-gradient-to-r from-[#f7941e] via-[#d6249f] to-[#8a3ab9] hover:brightness-105 transition-all"
        >
          <FaInstagram size={16} /> Follow on Instagram
        </a>
      </div>
    </section>
  );
}
