'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Database, HardDrive, FileText } from 'lucide-react';
import { type BlogPost, getPosts, deletePost } from '@/lib/blog';

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [configured, setConfigured] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setPosts(data.posts as BlogPost[]);
        return;
      }
    } catch {
      /* ignore — use local fallback */
    }
    setConfigured(false);
    setPosts(getPosts());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`Delete post "${post.title}"?`)) return;
    if (configured) {
      await fetch(`/api/blog/id/${post.id}`, { method: 'DELETE' });
      await load();
    } else {
      deletePost(post.id);
      setPosts(getPosts());
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Blog</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {posts.length} posts · {posts.filter((p) => p.published).length} published
            <StorageBadge configured={configured} />
          </p>
        </div>
        <Link
          href="/admin/blog/add"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
        >
          <Plus size={14} /> New Post
        </Link>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">Title</th>
              <th className="text-left py-3 px-4 font-semibold">Slug</th>
              <th className="text-left py-3 px-4 font-semibold">Author</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Updated</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 font-medium text-[#1a1410]">
                    <FileText size={14} className="text-[#b8893a]" /> {p.title}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#6b5d4c]">/{p.slug}</td>
                <td className="py-3 px-4 text-[#6b5d4c]">{p.author || '—'}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${
                      p.published ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-[#9a8c75]">
                  {new Date(p.updatedAt).toLocaleDateString('en-IN')}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/blog/edit/${p.id}`} aria-label="Edit" className="text-[#6b5d4c] hover:text-[#b8893a]">
                      <Edit2 size={14} />
                    </Link>
                    <button onClick={() => handleDelete(p)} aria-label="Delete" className="text-[#6b5d4c] hover:text-[#7a2e2e]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">No posts yet. Write your first one.</div>
        )}
      </div>
    </div>
  );
}

function StorageBadge({ configured }: { configured: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
        configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
      }`}
      title={configured ? 'Saved to your database' : 'Stored in this browser only — run supabase/schema.sql to sync'}
    >
      {configured ? <Database size={11} /> : <HardDrive size={11} />}
      {configured ? 'Database' : 'This browser'}
    </span>
  );
}
