'use client';

import Link from 'next/link';
import BlogForm from '@/components/admin/BlogForm';
import { ChevronRight } from 'lucide-react';

export default function AddBlogPostPage() {
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] text-[#9a8c75] mb-2">
          <Link href="/admin" className="text-[#b8893a] hover:underline">Dashboard</Link>
          <ChevronRight size={12} />
          <Link href="/admin/blog" className="text-[#b8893a] hover:underline">Blog</Link>
          <ChevronRight size={12} />
          <span>New Post</span>
        </div>
        <h1 className="serif text-3xl text-[#1a1410] mb-1">New Post</h1>
        <p className="text-sm text-[#6b5d4c]">Write a new article for the public blog.</p>
      </div>

      <BlogForm mode="add" />
    </div>
  );
}
