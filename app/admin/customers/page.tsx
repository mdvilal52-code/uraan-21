'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, X, Mail, Phone, Users, IndianRupee, TrendingUp,
  Database, HardDrive, StickyNote,
} from 'lucide-react';
import type { Customer } from '@/lib/customersDb';
import type { Order } from '@/lib/orders';
import { getStatusColor } from '@/lib/orders';
import type { Address } from '@/lib/addresses';

type NoteEntry = { id: number; note: string; createdBy?: string; createdAt: string };

const SEGMENT_STYLES: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600',
  repeat: 'bg-[#b8893a]/10 text-[#b8893a]',
  'high-value': 'bg-[#3d6b5a]/10 text-[#3d6b5a]',
};

const TIER_STYLES: Record<string, string> = {
  Bronze: 'bg-[#9a8c75]/10 text-[#6b5d4c]',
  Silver: 'bg-gray-400/10 text-gray-600',
  Gold: 'bg-[#b8893a]/15 text-[#b8893a]',
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (res.ok) {
        setConfigured(Boolean(data.configured));
        setCustomers((data.customers || []) as Customer[]);
      }
    } catch {
      /* keep empty state */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Customers</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {filtered.length} of {customers.length} customers
            <span
              className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
                configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
              }`}
              title={
                configured
                  ? 'Derived live from your orders database'
                  : 'Connect a database to see real customers, derived from orders'
              }
            >
              {configured ? <Database size={11} /> : <HardDrive size={11} />}
              {configured ? 'Live' : 'No database'}
            </span>
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">Total Customers</div>
            <Users size={15} className="text-[#1a1410]" />
          </div>
          <div className="stat-value text-[#1a1410]">{customers.length}</div>
        </div>
        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">Total Revenue</div>
            <IndianRupee size={15} className="text-[#b8893a]" />
          </div>
          <div className="stat-value text-[#b8893a]">₹{totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="stat-label">Avg Order Value</div>
            <TrendingUp size={15} className="text-[#3d6b5a]" />
          </div>
          <div className="stat-value text-[#3d6b5a]">₹{avgOrderValue.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-2">
        <Search size={14} className="text-[#9a8c75]" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">Name</th>
              <th className="text-left py-3 px-4 font-semibold">Phone</th>
              <th className="text-left py-3 px-4 font-semibold">Email</th>
              <th className="text-left py-3 px-4 font-semibold">Orders</th>
              <th className="text-left py-3 px-4 font-semibold">Total Spent</th>
              <th className="text-left py-3 px-4 font-semibold">Segment</th>
              <th className="text-left py-3 px-4 font-semibold">Loyalty</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40 cursor-pointer"
              >
                <td className="py-3 px-4 font-medium text-[#1a1410]">{c.name || '—'}</td>
                <td className="py-3 px-4 text-[#6b5d4c]">{c.phone || '—'}</td>
                <td className="py-3 px-4 text-[#6b5d4c]">{c.email || '—'}</td>
                <td className="py-3 px-4 text-[#1a1410]">{c.orderCount}</td>
                <td className="py-3 px-4 font-semibold text-[#b8893a]">
                  ₹{c.totalSpent.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold capitalize ${SEGMENT_STYLES[c.segment]}`}
                  >
                    {c.segment.replace('-', ' ')}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${TIER_STYLES[c.loyaltyTier]}`}>
                    {c.loyaltyTier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">
            {configured
              ? 'No customers yet — they will appear once orders come in.'
              : 'Connect a database to see real customers, derived from your orders.'}
          </div>
        )}
      </div>

      {selected && <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const encodedKey = encodeURIComponent(customer.phone || customer.email || customer.id);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, notesRes] = await Promise.all([
        fetch(`/api/customers/${encodedKey}`),
        fetch(`/api/customers/${encodedKey}/notes`),
      ]);
      const detail = await detailRes.json();
      if (detail.ok) setOrders((detail.orders || []) as Order[]);
      const notesData = await notesRes.json();
      if (notesData.ok) setNotes((notesData.notes || []) as NoteEntry[]);
    } catch {
      /* ignore — leave empty */
    } finally {
      setLoading(false);
    }
  }, [encodedKey]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!customer.email) return;
    fetch(`/api/addresses?email=${encodeURIComponent(customer.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) setAddresses((data.addresses || []) as Address[]);
      })
      .catch(() => {
        /* saved addresses are supplementary — leave empty on failure */
      });
  }, [customer.email]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const note = noteText.trim();
    if (!note) return;
    setSaving(true);
    try {
      await fetch(`/api/customers/${encodedKey}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      setNoteText('');
      await loadDetail();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[rgba(184,137,58,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-[rgba(184,137,58,0.18)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#b8893a]/10 grid place-items-center text-[#b8893a] font-semibold">
              {(customer.name || '?')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h2 className="serif text-2xl text-[#1a1410]">{customer.name || 'Unknown'}</h2>
              <p className="text-xs text-[#9a8c75] capitalize">
                {customer.segment.replace('-', ' ')} · {customer.loyaltyTier}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[#6b5d4c] hover:text-[#1a1410] p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-1">
            {customer.email && (
              <div className="text-sm text-[#6b5d4c] flex items-center gap-2">
                <Mail size={13} /> {customer.email}
              </div>
            )}
            {customer.phone && (
              <div className="text-sm text-[#6b5d4c] flex items-center gap-2">
                <Phone size={13} /> {customer.phone}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#fbf8f1] p-4 text-center">
              <div className="serif text-2xl font-bold text-[#1a1410]">{customer.orderCount}</div>
              <div className="text-[10px] tracking-[1px] uppercase text-[#9a8c75] mt-1">Orders</div>
            </div>
            <div className="bg-[#fbf8f1] p-4 text-center">
              <div className="serif text-2xl font-bold text-[#b8893a]">
                ₹{customer.totalSpent.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] tracking-[1px] uppercase text-[#9a8c75] mt-1">Total Spent</div>
            </div>
          </div>

          <div>
            <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Order History</h3>
            {loading ? (
              <p className="text-sm text-[#6b5d4c]">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-[#6b5d4c]">No orders found.</p>
            ) : (
              <div className="divide-y divide-[rgba(184,137,58,0.12)] border border-[rgba(184,137,58,0.18)]">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 p-3">
                    <div>
                      <div className="text-xs font-medium text-[#1a1410]">{o.id}</div>
                      <div className="text-[10px] text-[#9a8c75]">{o.date}</div>
                    </div>
                    <div className="text-sm font-semibold text-[#1a1410]">₹{o.amount.toLocaleString('en-IN')}</div>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {addresses.length > 0 && (
            <div>
              <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Saved Addresses</h3>
              <div className="space-y-2">
                {addresses.map((a) => (
                  <div key={a.id} className="bg-[#fbf8f1] border border-[rgba(184,137,58,0.12)] p-3 text-xs text-[#1a1410]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] tracking-[1px] uppercase font-semibold px-1.5 py-0.5 bg-white text-[#b8893a]">
                        {a.addressType}
                      </span>
                      {a.isDefault && <span className="text-[9px] text-[#3d6b5a] font-semibold">Default</span>}
                    </div>
                    <p className="font-semibold">{a.fullName} · {a.mobile}</p>
                    <p className="text-[#6b5d4c] mt-0.5">
                      {a.houseNo}, {a.street}
                      {a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} - {a.pincode}, {a.country}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2 flex items-center gap-1.5">
              <StickyNote size={12} /> Notes
            </h3>
            {notes.length > 0 && (
              <div className="space-y-2 mb-3">
                {notes.map((n) => (
                  <div key={n.id} className="bg-[#fbf8f1] border border-[rgba(184,137,58,0.12)] p-3 text-xs text-[#1a1410]">
                    <p>{n.note}</p>
                    <p className="text-[10px] text-[#9a8c75] mt-1">
                      {n.createdBy ? `${n.createdBy} · ` : ''}
                      {new Date(n.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddNote} className="flex gap-2 items-start">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this customer..."
                className="luxury-input flex-1"
              />
              <button
                type="submit"
                disabled={saving || !noteText.trim()}
                className="px-4 py-2 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410] disabled:opacity-60"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
