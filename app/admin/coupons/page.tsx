'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Ticket, Copy, X, Check, Database, HardDrive, UserPlus, Tag, Search } from 'lucide-react';
import {
  type Coupon,
  type CouponType,
  getCoupons,
  addCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
} from '@/lib/coupons';
import { categories } from '@/data/jewelleryData';

const emptyForm = {
  code: '',
  type: 'percent' as CouponType,
  value: 0,
  minOrder: 0,
  usageLimit: 100,
  validUntil: '',
  firstOrderOnly: false,
  category: '',
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [configured, setConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [copied, setCopied] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/coupons');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setCoupons(data.coupons as Coupon[]);
        return;
      }
    } catch {
      /* ignore — use the local fallback */
    }
    setConfigured(false);
    setCoupons(getCoupons());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrder: c.minOrder,
      usageLimit: c.usageLimit,
      validUntil: c.validUntil,
      firstOrderOnly: c.firstOrderOnly,
      category: c.category || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value) || 0,
      minOrder: Number(form.minOrder) || 0,
      usageLimit: Number(form.usageLimit) || 0,
      validUntil: form.validUntil.trim(),
      firstOrderOnly: form.firstOrderOnly,
      category: form.category.trim() || undefined,
    };
    if (configured) {
      if (editingId) {
        await fetch(`/api/coupons/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      await load();
    } else {
      if (editingId) updateCoupon(editingId, payload);
      else addCoupon(form);
      setCoupons(getCoupons());
    }
    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete coupon ${id}?`)) return;
    if (configured) {
      await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      await load();
    } else {
      deleteCoupon(id);
      setCoupons(getCoupons());
    }
  };

  const handleToggle = async (c: Coupon) => {
    if (configured) {
      await fetch(`/api/coupons/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      await load();
    } else {
      toggleCoupon(c.id);
      setCoupons(getCoupons());
    }
  };

  const filtered = coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()));

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied((cur) => (cur === code ? null : cur)), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Coupons</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {filtered.length} coupons · {filtered.filter((c) => c.active).length} active
            <StorageBadge configured={configured} />
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openAdd())}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Close' : 'Add Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 mb-5">
          <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">
            {editingId ? 'Edit Coupon' : 'New Coupon'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="luxury-label">Code *</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="luxury-input"
                placeholder="e.g., SAVE20"
              />
            </div>
            <div>
              <label className="luxury-label">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CouponType })}
                className="luxury-input"
              >
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="luxury-label">Value *</label>
              <input
                type="number"
                required
                min={1}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Min Order (₹)</label>
              <input
                type="number"
                min={0}
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Usage Limit</label>
              <input
                type="number"
                min={1}
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Valid Until *</label>
              <input
                type="text"
                required
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="luxury-input"
                placeholder="e.g., 31 Dec 2026"
              />
            </div>
            <div>
              <label className="luxury-label">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="luxury-input"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-xs text-[#1a1410] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.firstOrderOnly}
                  onChange={(e) => setForm({ ...form, firstOrderOnly: e.target.checked })}
                  className="accent-[#b8893a]"
                />
                First order only
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="px-6 py-2 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold">
              {editingId ? 'Save Changes' : 'Save Coupon'}
            </button>
            <button type="button" onClick={closeForm} className="px-6 py-2 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-2">
        <Search size={14} className="text-[#9a8c75]" />
        <input
          type="text"
          placeholder="Search by coupon code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">Code</th>
              <th className="text-left py-3 px-4 font-semibold">Discount</th>
              <th className="text-left py-3 px-4 font-semibold">Min Order</th>
              <th className="text-left py-3 px-4 font-semibold">Usage</th>
              <th className="text-left py-3 px-4 font-semibold">Valid Until</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Ticket size={14} className="text-[#b8893a]" />
                    <span className="font-bold text-[#1a1410] tracking-[1px]">{c.code}</span>
                    <button onClick={() => copyCode(c.code)} aria-label="Copy" className="text-[#9a8c75] hover:text-[#b8893a]">
                      {copied === c.code ? <Check size={11} className="text-[#3d6b5a]" /> : <Copy size={11} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                    {c.firstOrderOnly && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.5px] bg-blue-500/10 text-blue-600">
                        <UserPlus size={9} /> First order
                      </span>
                    )}
                    {c.category && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.5px] bg-[#b8893a]/10 text-[#b8893a]">
                        <Tag size={9} /> {c.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-[#b8893a]">
                  {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
                </td>
                <td className="py-3 px-4 text-[#6b5d4c]">₹{c.minOrder.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4">
                  <div className="text-xs text-[#1a1410] font-medium">{c.used}/{c.usageLimit}</div>
                  <div className="w-full h-1 bg-[#fbf8f1] mt-1 overflow-hidden rounded-full">
                    <div className="h-full bg-[#b8893a]" style={{ width: `${Math.min(100, (c.used / c.usageLimit) * 100)}%` }} />
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c]">{c.validUntil}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleToggle(c)}
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${
                      c.active ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(c)} aria-label="Edit" className="text-[#6b5d4c] hover:text-[#b8893a]">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} aria-label="Delete" className="text-[#6b5d4c] hover:text-[#7a2e2e]">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">
            {coupons.length === 0 ? 'No coupons yet. Add your first one.' : 'No coupons match your search.'}
          </div>
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
