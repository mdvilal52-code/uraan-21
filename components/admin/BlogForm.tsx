'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { type BlogPost, addPost, updatePost, slugify } from '@/lib/blog';

type BlogFormProps = {
  initialPost?: BlogPost;
  mode?: 'add' | 'edit';
};

export default function BlogForm({ initialPost, mode = 'add' }: BlogFormProps) {
  const router = useRouter();
  const [configured, setConfigured] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: initialPost?.title || '',
    slug: initialPost?.slug || '',
    excerpt: initialPost?.excerpt || '',
    content: initialPost?.content || '',
    coverImage: initialPost?.coverImage || '',
    seoTitle: initialPost?.seoTitle || '',
    seoDescription: initialPost?.seoDescription || '',
    author: initialPost?.author || '',
    published: initialPost?.published ?? false,
  });

  // Determine whether a database is connected, so submit knows whether to hit
  // the API or fall back to the browser-local store (mirrors lib/coupons.ts).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/blog');
        const data = await res.json();
        if (res.ok) setConfigured(Boolean(data.configured));
      } catch {
        /* keep configured=false */
      }
    })();
  }, []);

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      excerpt: form.excerpt.trim(),
      content: form.content,
      coverImage: form.coverImage.trim(),
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      author: form.author.trim(),
      published: form.published,
    };

    try {
      if (configured) {
        const url = mode === 'add' ? '/api/blog' : `/api/blog/id/${initialPost?.id}`;
        const res = await fetch(url, {
          method: mode === 'add' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert(data.error || 'Could not save post.');
          setSubmitting(false);
          return;
        }
      } else {
        if (mode === 'add') addPost(payload);
        else if (initialPost) updatePost(initialPost.id, payload);
      }
      router.push('/admin/blog');
      router.refresh();
    } catch {
      alert('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 md:p-6">
      <h2 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-5 pb-3 border-b border-[rgba(184,137,58,0.18)]">
        {mode === 'add' ? 'New Post' : 'Edit Post'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="luxury-label">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="luxury-input"
            placeholder="e.g., How to Care for 22K Gold Jewellery"
          />
        </div>

        <div>
          <label className="luxury-label">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setForm({ ...form, slug: e.target.value });
            }}
            className="luxury-input"
            placeholder="auto-generated-from-title"
          />
        </div>

        <div>
          <label className="luxury-label">Author</label>
          <input
            type="text"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            className="luxury-input"
            placeholder="e.g., Om Gauri Putra Team"
          />
        </div>

        <div className="md:col-span-2">
          <label className="luxury-label">Excerpt</label>
          <input
            type="text"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            className="luxury-input"
            placeholder="Short summary shown on the blog listing page"
          />
        </div>

        <div className="md:col-span-2">
          <label className="luxury-label">Content *</label>
          <textarea
            required
            rows={12}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="luxury-input font-mono text-xs"
            placeholder="Write your post content here (plain text / line breaks)..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="luxury-label">Cover Image URL</label>
          <input
            type="text"
            value={form.coverImage}
            onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            className="luxury-input"
            placeholder="/images/blog/cover.jpg"
          />
        </div>

        <div>
          <label className="luxury-label">SEO Title</label>
          <input
            type="text"
            value={form.seoTitle}
            onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
            className="luxury-input"
          />
        </div>

        <div>
          <label className="luxury-label">SEO Description</label>
          <input
            type="text"
            value={form.seoDescription}
            onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
            className="luxury-input"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="published"
            checked={form.published}
            onChange={(e) => setForm({ ...form, published: e.target.checked })}
            className="accent-[#b8893a]"
          />
          <label htmlFor="published" className="text-xs text-[#1a1410] cursor-pointer">
            Published (visible on the public blog)
          </label>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60"
        >
          <Save size={14} /> {submitting ? 'Saving…' : 'Save Post'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/blog')}
          className="px-6 py-2.5 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
