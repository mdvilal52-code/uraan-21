'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageCircle, Database, HardDrive, ShoppingCart, Clock } from 'lucide-react';
import { type AbandonedCart, getAbandonedCarts } from '@/lib/abandonedCarts';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/abandoned-carts');
      const data = await res.json();
      if (res.ok && data.configured) {
        setConfigured(true);
        setCarts(data.carts as AbandonedCart[]);
        return;
      }
    } catch {
      /* ignore — use local fallback */
    } finally {
      setLoading(false);
    }
    setConfigured(false);
    setCarts(getAbandonedCarts());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemind = async (cart: AbandonedCart) => {
    setSendingId(cart.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/abandoned-carts/${cart.id}/remind`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: 'success', text: `Reminder sent to ${cart.name || cart.phone}.` });
        await load();
      } else {
        setMessage({ type: 'error', text: data.error || 'Could not send reminder.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSendingId(null);
    }
  };

  const unrecoveredCount = carts.filter((c) => !c.recovered).length;
  const recoveredCount = carts.length - unrecoveredCount;
  const recoveryRate = carts.length > 0 ? Math.round((recoveredCount / carts.length) * 100) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1">Abandoned Carts</h1>
          <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
            {carts.length} carts · {unrecoveredCount} not recovered
            {carts.length > 0 && (
              <span className="font-semibold text-[#3d6b5a]">· {recoveryRate}% recovery rate</span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
                configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
              }`}
              title={configured ? 'Live from your database' : 'Stored in this browser only — connect a database to sync'}
            >
              {configured ? <Database size={11} /> : <HardDrive size={11} />}
              {configured ? 'Database' : 'This browser'}
            </span>
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-5 px-4 py-3 text-sm border ${
            message.type === 'success'
              ? 'bg-[#3d6b5a]/10 text-[#3d6b5a] border-[#3d6b5a]/30'
              : 'bg-[#7a2e2e]/10 text-[#7a2e2e] border-[#7a2e2e]/30'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
              <th className="text-left py-3 px-4 font-semibold">Customer</th>
              <th className="text-left py-3 px-4 font-semibold">Items</th>
              <th className="text-left py-3 px-4 font-semibold">Total</th>
              <th className="text-left py-3 px-4 font-semibold">Age</th>
              <th className="text-left py-3 px-4 font-semibold">Status</th>
              <th className="text-right py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((c) => (
              <tr key={c.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40">
                <td className="py-3 px-4">
                  <div className="font-medium text-[#1a1410]">{c.name || 'Unknown'}</div>
                  <div className="text-[11px] text-[#6b5d4c]">{c.phone || c.email || '—'}</div>
                </td>
                <td className="py-3 px-4 text-[#6b5d4c]">
                  <div className="flex items-center gap-1.5">
                    <ShoppingCart size={12} className="text-[#b8893a]" />
                    {c.items.reduce((sum, i) => sum + (i.quantity || 1), 0)} item(s)
                  </div>
                  <div className="text-[10px] text-[#9a8c75] truncate max-w-[220px]">
                    {c.items.map((i) => i.name).join(', ')}
                  </div>
                </td>
                <td className="py-3 px-4 font-semibold text-[#b8893a]">₹{c.total.toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 text-[#6b5d4c]">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} /> {timeAgo(c.createdAt)}
                  </div>
                  {c.remindedAt && (
                    <div className="text-[10px] text-[#9a8c75]">Reminded {timeAgo(c.remindedAt)}</div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${
                      c.recovered ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#7a2e2e]/10 text-[#7a2e2e]'
                    }`}
                  >
                    {c.recovered ? 'Recovered' : 'Not recovered'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleRemind(c)}
                      disabled={c.recovered || !c.phone || sendingId === c.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#16796F] text-white text-[10px] tracking-[1px] uppercase font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <MessageCircle size={12} /> {sendingId === c.id ? 'Sending…' : 'Send Reminder'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && carts.length === 0 && (
          <div className="text-center py-12 text-sm text-[#6b5d4c]">
            No abandoned carts yet — they&apos;ll appear when a customer starts checkout without finishing.
          </div>
        )}
      </div>
    </div>
  );
}
