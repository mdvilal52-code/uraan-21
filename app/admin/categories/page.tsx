'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Edit2, Trash2, X, Database, HardDrive, Upload, Search } from 'lucide-react';
import {
  type Category,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from '@/lib/categories';
import { invalidateCategoryCache } from '@/hooks/useCategories';

const emptyForm = { name: '', description: '', image: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [configured, setConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = categories.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  });

  // Prefer the database; fall back to the in-browser store when it's off.
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setCategories(data.categories as Category[]);
        return;
      }
    } catch {
      /* ignore — use the local fallback */
    }
    setConfigured(false);
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingSlug(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Category) => {
    setEditingSlug(c.slug);
    setForm({ name: c.name, description: c.description, image: c.image });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSlug(null);
    setForm(emptyForm);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.ok) {
        setForm((f) => ({ ...f, image: data.url }));
      } else {
        alert(data.error || 'Upload failed.');
      }
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
    };
    if (configured) {
      if (editingSlug) {
        await fetch(`/api/categories/${editingSlug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      invalidateCategoryCache();
      await load();
    } else {
      if (editingSlug) updateCategory(editingSlug, payload);
      else addCategory(form);
      invalidateCategoryCache();
      setCategories(getCategories());
    }
    closeForm();
  };

  const handleDelete = async (slug: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    if (configured) {
      await fetch(`/api/categories/${slug}`, { method: 'DELETE' });
      invalidateCategoryCache();
      await load();
    } else {
      deleteCategory(slug);
      invalidateCategoryCache();
      setCategories(getCategories());
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Categories</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {categories.length} active categories
            <StorageBadge configured={configured} />
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openAdd())}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Close' : 'Add Category'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 mb-5">
          <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">
            {editingSlug ? 'Edit Category' : 'New Category'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="luxury-label">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div className="md:col-span-2">
              <label className="luxury-label">Image URL</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="luxury-input"
                  placeholder="/images/necklace.jpg"
                />
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 border border-[rgba(184,137,58,0.32)] text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1] flex items-center gap-2 disabled:opacity-60 whitespace-nowrap"
                >
                  <Upload size={12} /> {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="px-6 py-2 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a]">
              {editingSlug ? 'Save Changes' : 'Save Category'}
            </button>
            <button type="button" onClick={closeForm} className="px-6 py-2 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a8c75]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories…"
          className="luxury-input pl-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.slug} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 group hover:shadow-[0_12px_40px_rgba(122,90,31,0.12)] transition-all">
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-full bg-cover bg-center bg-[#f8f2e6] flex-shrink-0"
                style={{
                  backgroundImage: `url(${c.image})`,
                  boxShadow: 'inset 0 0 0 1px rgba(184,137,58,0.32)',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="serif text-lg text-[#1a1410] font-semibold truncate">{c.name}</div>
                <div className="text-[10px] text-[#9a8c75] tracking-[0.5px] mb-1">/{c.slug}</div>
                <div className="text-xs text-[#6b5d4c] mb-2">{c.description}</div>
                <div className="text-[10px] text-[#b8893a] font-semibold tracking-[1px]">
                  {c.count} Products
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[rgba(184,137,58,0.18)] flex justify-end gap-3">
              <button onClick={() => openEdit(c)} aria-label="Edit" className="text-[#6b5d4c] hover:text-[#b8893a]">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(c.slug, c.name)} aria-label="Delete" className="text-[#6b5d4c] hover:text-[#7a2e2e]">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[rgba(184,137,58,0.18)] text-center py-12 text-sm text-[#6b5d4c]">
          {categories.length === 0 ? 'No categories yet. Add your first one.' : 'No categories match your search.'}
        </div>
      )}
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
