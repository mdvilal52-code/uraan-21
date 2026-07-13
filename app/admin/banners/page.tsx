'use client';

import { useCallback, useEffect, useState } from 'react';
import BannerForm from '@/components/admin/BannerForm';
import { Plus, Edit2, Trash2, Eye, EyeOff, Database, HardDrive, Search } from 'lucide-react';
import {
  type Banner,
  getBanners,
  addBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
} from '@/lib/banners';
import { invalidateBannerCache } from '@/hooks/useBanners';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [configured, setConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | undefined>();
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setBanners(data.banners as Banner[]);
        return;
      }
    } catch {
      /* ignore — use the local fallback */
    }
    setConfigured(false);
    setBanners(getBanners());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete banner ${id}?`)) return;
    if (configured) {
      await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      invalidateBannerCache();
      await load();
    } else {
      deleteBanner(id);
      setBanners(getBanners());
    }
  };

  const handleToggle = async (b: Banner) => {
    if (configured) {
      await fetch(`/api/banners/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !b.active }),
      });
      invalidateBannerCache();
      await load();
    } else {
      toggleBanner(b.id);
      setBanners(getBanners());
    }
  };

  const handleSave = async (data: Omit<Banner, 'id'>) => {
    if (configured) {
      if (editingBanner) {
        await fetch(`/api/banners/${editingBanner.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } else {
        await fetch('/api/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      invalidateBannerCache();
      await load();
    } else {
      if (editingBanner) updateBanner(editingBanner.id, data);
      else addBanner(data);
      setBanners(getBanners());
    }
    setShowForm(false);
    setEditingBanner(undefined);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBanner(undefined);
  };

  const filtered = banners.filter((b) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      (b.subtitle || '').toLowerCase().includes(q)
    );
  });

  if (showForm) {
    return (
      <div>
        <BannerForm
          initialBanner={editingBanner}
          mode={editingBanner ? 'edit' : 'add'}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Banners</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {filtered.length} banners · {filtered.filter((b) => b.active).length} active
            <StorageBadge configured={configured} />
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBanner(undefined);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
        >
          <Plus size={14} /> Add Banner
        </button>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-2">
        <Search size={14} className="text-[#9a8c75]" />
        <input
          type="text"
          placeholder="Search by title or subtitle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((b) => (
          <div key={b.id} className="bg-white border border-[rgba(184,137,58,0.18)] overflow-hidden">
            <div
              className="aspect-video bg-[#f8f2e6] bg-cover bg-center relative"
              style={{ backgroundImage: `url(${b.image})` }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
                <p className="text-[10px] tracking-[2px] uppercase text-[#e8d49b]">{b.position}</p>
                <div className="serif text-2xl mt-1">{b.title}</div>
                <div className="text-xs opacity-80 mt-1">{b.subtitle}</div>
              </div>
              <div className={`absolute top-3 right-3 px-2 py-1 text-[10px] font-semibold ${
                b.active ? 'bg-[#3d6b5a] text-white' : 'bg-gray-500 text-white'
              }`}>
                {b.active ? 'ACTIVE' : 'HIDDEN'}
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="text-xs text-[#6b5d4c]">
                <span className="font-semibold text-[#1a1410]">{b.ctaText}</span> → {b.ctaLink}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(b)}
                  aria-label={b.active ? 'Hide' : 'Show'}
                  className="text-[#6b5d4c] hover:text-[#b8893a] p-1"
                >
                  {b.active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  onClick={() => handleEdit(b)}
                  aria-label="Edit"
                  className="text-[#6b5d4c] hover:text-[#b8893a] p-1"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  aria-label="Delete"
                  className="text-[#6b5d4c] hover:text-[#7a2e2e] p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-[rgba(184,137,58,0.18)] text-center py-12 text-sm text-[#6b5d4c]">
          {banners.length === 0 ? 'No banners yet. Add your first one.' : 'No banners match your search.'}
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
