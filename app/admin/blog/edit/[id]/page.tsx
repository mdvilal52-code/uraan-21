'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogForm from '@/components/admin/BlogForm';
import { type BlogPost, getPosts } from '@/lib/blog';
import { ChevronRight } from 'lucide-react';

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/blog/id/${id}`);
        const data = await res.json();
        if (res.ok && data.ok) {
          setPost(data.post as BlogPost);
          return;
        }
      } catch {
        /* fall through to local store */
      }
      setPost(getPosts().find((p) => p.id === id) || null);
    })();
  }, [id]);

  if (post === undefined) {
    return (
      <div className="py-20 text-center text-sm text-[#9a8c75] tracking-[2px] uppercase">
        Loading…
      </div>
    );
  }
  if (!post) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] text-[#9a8c75] mb-2">
          <Link href="/admin" className="text-[#b8893a] hover:underline">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/admin/blog" className="text-[#b8893a] hover:underline">Blog</Link>
          <ChevronRight size={12} />
          <span>Edit</span>
        </div>
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Edit Post</h1>
        <p className="text-sm text-[#6b5d4c]">
          Updating: <span className="font-semibold text-[#1a1410]">{post.title}</span>
        </p>
      </div>

      <BlogForm mode="edit" initialPost={post} />
    </div>
  );
}
