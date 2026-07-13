'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, X, Database, HardDrive, RotateCcw, Repeat } from 'lucide-react';
import {
  type Return,
  type ReturnType,
  type ReturnStatus,
  getReturns,
  addReturn,
  updateReturnStatus,
  getReturnStatusColor,
} from '@/lib/returns';

const RETURN_STATUSES: ReturnStatus[] = ['requested', 'approved', 'rejected', 'refunded', 'replaced'];

const emptyForm = {
  orderId: '',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  reason: '',
  type: 'return' as ReturnType,
};

function ReturnsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Return[]>([]);
  const [configured, setConfigured] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/returns');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setItems(data.returns as Return[]);
        return;
      }
    } catch {
      /* ignore — use the local fallback */
    }
    setConfigured(false);
    setItems(getReturns());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Pre-fill + auto-open the "New Return" form when navigated here from an
  // order's detail modal (Order → Create Return).
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (!orderId) return;
    setForm((f) => ({
      ...f,
      orderId,
      customerName: searchParams.get('customer') || f.customerName,
      customerPhone: searchParams.get('phone') || f.customerPhone,
    }));
    setShowForm(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Seed notes drafts once items load so the textarea starts in sync.
    setNotesDraft((prev) => {
      const next = { ...prev };
      for (const r of items) {
        if (next[r.id] === undefined) next[r.id] = r.adminNotes || '';
      }
      return next;
    });
  }, [items]);

  const openAdd = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId.trim() || !form.customerName.trim() || !form.customerPhone.trim() || !form.reason.trim()) {
      return;
    }
    if (configured) {
      await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      await load();
    } else {
      addReturn(form);
      setItems(getReturns());
    }
    closeForm();
  };

  const handleStatusChange = async (id: string, status: ReturnStatus) => {
    const previous = items.find((r) => r.id === id)?.status;
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    if (configured) {
      // Marking a return "Refunded" triggers a real refund server-side (via
      // Razorpay when paid online) and can genuinely fail — e.g. the order
      // was already fully refunded, or the gateway rejects it — so the
      // optimistic update above must be reverted rather than trusted blind.
      try {
        const res = await fetch(`/api/returns/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = await res.json().catch(() => null);
        if (!data?.ok) {
          setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: previous || r.status } : r)));
          alert(data?.error || 'Could not update this return.');
        }
      } catch {
        setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: previous || r.status } : r)));
        alert('Network error. Please try again.');
      }
    } else {
      updateReturnStatus(id, status);
    }
  };

  const handleSaveNotes = async (id: string) => {
    const adminNotes = notesDraft[id] ?? '';
    if (configured) {
      await fetch(`/api/returns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      await load();
    } else {
      const current = items.find((r) => r.id === id);
      updateReturnStatus(id, current?.status || 'requested', adminNotes);
      setItems(getReturns());
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Returns &amp; Exchanges</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {items.length} requests
            <span
              className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
                configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
              }`}
              title={configured ? 'Saved to your database' : 'Sample data — connect a database to see real returns'}
            >
              {configured ? <Database size={11} /> : <HardDrive size={11} />}
              {configured ? 'Live' : 'Sample data'}
            </span>
          </p>
        </div>
        <button
          onClick={() => (showForm ? closeForm() : openAdd())}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
        >
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Close' : 'New Return'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-[rgba(184,137,58,0.18)] p-5 mb-5">
          <h3 className="display text-sm tracking-[3px] uppercase text-[#1a1410] mb-4">New Return / Exchange</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="luxury-label">Order ID *</label>
              <input
                type="text"
                required
                value={form.orderId}
                onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                className="luxury-input"
                placeholder="e.g., OGP12345678"
              />
            </div>
            <div>
              <label className="luxury-label">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as ReturnType })}
                className="luxury-input"
              >
                <option value="return">Return</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>
            <div>
              <label className="luxury-label">Customer Name *</label>
              <input
                type="text"
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Customer Phone *</label>
              <input
                type="text"
                required
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div>
              <label className="luxury-label">Customer Email</label>
              <input
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                className="luxury-input"
              />
            </div>
            <div className="md:col-span-3">
              <label className="luxury-label">Reason *</label>
              <textarea
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="luxury-input"
                rows={3}
                placeholder="Why is the customer returning/exchanging this order?"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="px-6 py-2 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold">
              Save Request
            </button>
            <button type="button" onClick={closeForm} className="px-6 py-2 border border-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">RMA</th>
              <th className="text-left py-3 px-4 font-semibold">Order</th>
              <th className="text-left py-3 px-4 font-semibold">Customer</th>
              <th className="text-left py-3 px-4 font-semibold">Type</th>
              <th className="text-left py-3 px-4 font-semibold">Reason</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-left py-3 px-4 font-semibold">Admin Notes</th>
              <th className="text-left py-3 px-4 font-semibold">Requested</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40 align-top">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 font-bold text-[#1a1410] tracking-[1px]">
                    {r.type === 'exchange' ? <Repeat size={13} className="text-[#b8893a]" /> : <RotateCcw size={13} className="text-[#b8893a]" />}
                    {r.id}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c]">{r.orderId}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-[#1a1410]">{r.customerName}</div>
                  <div className="text-[10px] text-[#9a8c75]">{r.customerPhone}</div>
                  {r.customerEmail && <div className="text-[10px] text-[#9a8c75]">{r.customerEmail}</div>}
                </td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c] capitalize">{r.type}</td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c] max-w-[220px]">{r.reason}</td>
                <td className="py-3 px-4">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value as ReturnStatus)}
                    className={`text-[11px] font-semibold px-2 py-1 outline-none cursor-pointer border-0 capitalize ${getReturnStatusColor(r.status)}`}
                  >
                    {RETURN_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 min-w-[200px]">
                  <textarea
                    value={notesDraft[r.id] ?? ''}
                    onChange={(e) => setNotesDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    onBlur={() => handleSaveNotes(r.id)}
                    className="luxury-input text-xs"
                    rows={2}
                    placeholder="Internal notes…"
                  />
                </td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c] whitespace-nowrap">
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">No return/exchange requests yet.</div>
        )}
      </div>
    </div>
  );
}

export default function AdminReturnsPage() {
  return (
    <Suspense fallback={null}>
      <ReturnsContent />
    </Suspense>
  );
}
