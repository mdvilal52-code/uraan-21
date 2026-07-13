'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import OrderTable from '@/components/admin/OrderTable';
import { orders as demoOrders, type Order, type OrderStatus, getStatusColor } from '@/lib/orders';
import { whatsappLink, orderUpdateMessage } from '@/lib/whatsapp';
import { Search, Database, HardDrive, X, MessageCircle, FileText, RotateCcw } from 'lucide-react';

export default function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [data, setData] = useState<Order[]>(demoOrders);
  const [configured, setConfigured] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);

  // Prefer real orders from the database; fall back to the demo data.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/orders');
        const json = await res.json();
        if (res.ok && json.configured) {
          setConfigured(true);
          setData(json.orders as Order[]);
        }
      } catch {
        /* keep demo data */
      }
    })();
  }, []);

  const filtered = data.filter((o) => {
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered.reduce(
    (sum, o) => (o.status !== 'Cancelled' ? sum + o.amount : sum),
    0
  );

  const handleView = (id: string) => {
    setSelected(data.find((o) => o.id === id) || null);
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    setData((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
    if (configured) {
      await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    }
  };

  const handleOrderUpdated = (id: string, patch: Partial<Order>) => {
    setData((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, ...patch } : prev));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Orders</h1>
        <p className="text-sm text-[#6b5d4c] flex items-center gap-2 flex-wrap">
          {filtered.length} orders · Revenue: ₹{totalRevenue.toLocaleString('en-IN')}
          <span
            className={`inline-flex items-center gap-1 text-[10px] tracking-[1px] uppercase px-2 py-0.5 ${
              configured ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
            }`}
            title={configured ? 'Live orders from your database' : 'Sample data — connect a database to see real orders'}
          >
            {configured ? <Database size={11} /> : <HardDrive size={11} />}
            {configured ? 'Live' : 'Sample data'}
          </span>
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: 'Pending', value: 'Pending', color: 'text-[#7a2e2e]' },
          { label: 'Processing', value: 'Processing', color: 'text-[#b8893a]' },
          { label: 'Shipped', value: 'Shipped', color: 'text-blue-600' },
          { label: 'Delivered', value: 'Delivered', color: 'text-[#3d6b5a]' },
          { label: 'Cancelled', value: 'Cancelled', color: 'text-gray-600' },
        ].map((s, i) => {
          const count = data.filter((o) => o.status === s.value).length;
          return (
            <button
              key={i}
              onClick={() => setStatusFilter(s.value)}
              className="bg-white border border-[rgba(184,137,58,0.18)] p-3 text-center hover:border-[#b8893a]"
            >
              <div className={`stat-value ${s.color}`}>{count}</div>
              <div className="stat-label mt-1">
                {s.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={14} className="text-[#9a8c75]" />
          <input
            type="text"
            placeholder="Search by customer or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[rgba(184,137,58,0.32)] px-3 py-1.5 text-xs outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <OrderTable orders={filtered} onView={handleView} onStatusChange={handleStatusChange} />

      {selected && (
        <OrderDetailModal
          order={selected}
          configured={configured}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

function OrderDetailModal({
  order,
  configured,
  onClose,
  onStatusChange,
  onOrderUpdated,
}: {
  order: Order;
  configured: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onOrderUpdated: (id: string, patch: Partial<Order>) => void;
}) {
  const [notes, setNotes] = useState(order.notes || '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [courier, setCourier] = useState(order.courier || '');
  const [trackingSaving, setTrackingSaving] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundSaving, setRefundSaving] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  // Reset the local editing state whenever a different order is opened.
  useEffect(() => {
    setNotes(order.notes || '');
    setTrackingNumber(order.trackingNumber || '');
    setCourier(order.courier || '');
    setShowRefundForm(false);
    setRefundReason('');
    setRefundError(null);
    const remaining = Math.max(0, order.amount - (order.refundAmount || 0));
    setRefundAmount(remaining ? String(remaining) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const saveNotes = async () => {
    if (!configured || notesSaving) return;
    if (notes === (order.notes || '')) return;
    setNotesSaving(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      onOrderUpdated(order.id, { notes });
    } finally {
      setNotesSaving(false);
    }
  };

  const saveTracking = async () => {
    if (!configured || trackingSaving) return;
    setTrackingSaving(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackingNumber, courier }),
      });
      onOrderUpdated(order.id, { trackingNumber, courier });
    } finally {
      setTrackingSaving(false);
    }
  };

  const remainingRefundable = Math.max(0, order.amount - (order.refundAmount || 0));

  const submitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) {
      setRefundError('Enter a valid refund amount.');
      return;
    }
    setRefundSaving(true);
    setRefundError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, reason: refundReason || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setRefundError(json.error || 'Could not process refund.');
        return;
      }
      onOrderUpdated(order.id, { refundStatus: json.refundStatus, refundAmount: json.refundAmount });
      setShowRefundForm(false);
      setRefundReason('');
    } catch {
      setRefundError('Could not process refund.');
    } finally {
      setRefundSaving(false);
    }
  };

  const lineItemsTotal = (order.lineItems || []).reduce((sum, li) => sum + li.price * li.quantity, 0);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[rgba(184,137,58,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-[rgba(184,137,58,0.18)]">
          <div>
            <h2 className="serif text-2xl text-[#1a1410]">Order {order.id}</h2>
            <p className="text-xs text-[#9a8c75] mt-1">Placed {order.date}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-[#6b5d4c] hover:text-[#1a1410] p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`inline-block px-3 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
              className="border border-[rgba(184,137,58,0.32)] px-3 py-1.5 text-xs outline-none cursor-pointer"
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div>
              <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Status Timeline</h3>
              <ul className="space-y-2 border-l border-[rgba(184,137,58,0.32)] pl-4">
                {order.statusHistory.map((h, idx) => (
                  <li key={idx} className="text-xs relative text-[#6b5d4c]">
                    <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#b8893a]" />
                    <span className="font-semibold text-[#1a1410]">{h.status}</span>
                    {' · '}
                    {new Date(h.at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · by '}
                    {h.by}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Customer</h3>
            <div className="text-sm text-[#1a1410] font-medium">{order.customer}</div>
            <div className="text-sm text-[#6b5d4c]">{order.email}</div>
            <div className="text-sm text-[#6b5d4c]">{order.phone}</div>
            {order.address && <div className="text-sm text-[#6b5d4c] mt-1">{order.address}</div>}
          </div>

          {/* Itemized line items */}
          <div>
            <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Items</h3>
            {order.lineItems && order.lineItems.length > 0 ? (
              <div className="border border-[rgba(184,137,58,0.18)] overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] tracking-[1px] uppercase text-[#9a8c75] bg-[#fbf8f1] border-b border-[rgba(184,137,58,0.18)]">
                      <th className="text-left py-2 px-3 font-semibold">Item</th>
                      <th className="text-right py-2 px-3 font-semibold">Qty</th>
                      <th className="text-right py-2 px-3 font-semibold">Price</th>
                      <th className="text-right py-2 px-3 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.lineItems.map((li, idx) => (
                      <tr key={idx} className="border-b border-[rgba(184,137,58,0.1)] last:border-0">
                        <td className="py-2 px-3 text-[#1a1410]">{li.name}</td>
                        <td className="py-2 px-3 text-right text-[#6b5d4c]">{li.quantity}</td>
                        <td className="py-2 px-3 text-right text-[#6b5d4c]">₹{li.price.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-3 text-right text-[#1a1410] font-medium">
                          ₹{(li.price * li.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#fbf8f1]">
                      <td colSpan={3} className="py-2 px-3 text-right text-[10px] uppercase tracking-[1px] text-[#9a8c75] font-semibold">
                        Total
                      </td>
                      <td className="py-2 px-3 text-right text-[#1a1410] font-bold">
                        ₹{lineItemsTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="text-sm text-[#6b5d4c]">{order.items} item(s)</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Payment</h3>
              <div className="text-sm text-[#1a1410]">{order.payment || '—'}</div>
              {order.paid !== undefined && (
                <span
                  className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold ${
                    order.paid ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-gray-500/10 text-gray-600'
                  }`}
                >
                  {order.paid ? 'PAID' : 'UNPAID'}
                </span>
              )}
              {order.paymentId && (
                <div className="text-[10px] text-[#9a8c75] mt-1 break-all">{order.paymentId}</div>
              )}
            </div>
            <div>
              <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Summary</h3>
              <div className="text-sm text-[#6b5d4c]">{order.items} item(s)</div>
              <div className="serif text-2xl font-bold text-[#1a1410]">
                ₹{order.amount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Order notes */}
          <div>
            <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Order Notes</h3>
            <textarea
              className="luxury-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder="Internal notes about this order…"
              disabled={!configured}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-[#9a8c75]">{notesSaving ? 'Saving…' : ''}</span>
              <button
                type="button"
                onClick={saveNotes}
                disabled={!configured || notesSaving}
                className="px-4 py-1.5 border border-[#1a1410] text-[10px] tracking-[1.5px] uppercase font-semibold disabled:opacity-40"
              >
                Save Notes
              </button>
            </div>
          </div>

          {/* Tracking */}
          <div>
            <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Tracking</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="luxury-label">Courier</label>
                <input
                  type="text"
                  className="luxury-input"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g., Bluedart"
                  disabled={!configured}
                />
              </div>
              <div>
                <label className="luxury-label">Tracking / AWB Number</label>
                <input
                  type="text"
                  className="luxury-input"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="AWB number"
                  disabled={!configured}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveTracking}
              disabled={!configured || trackingSaving}
              className="mt-2 px-4 py-1.5 border border-[#1a1410] text-[10px] tracking-[1.5px] uppercase font-semibold disabled:opacity-40"
            >
              {trackingSaving ? 'Saving…' : 'Save Tracking'}
            </button>
          </div>

          {/* Refund */}
          {order.paid && (
            <div>
              <h3 className="display text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-2">Refund</h3>
              {order.refundStatus && order.refundStatus !== 'none' && (
                <div className="text-xs text-[#6b5d4c] mb-2 flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${
                      order.refundStatus === 'full' ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-[#b8893a]/10 text-[#b8893a]'
                    }`}
                  >
                    {order.refundStatus === 'full' ? 'Fully Refunded' : 'Partially Refunded'}
                  </span>
                  ₹{(order.refundAmount || 0).toLocaleString('en-IN')} refunded
                </div>
              )}
              {!showRefundForm ? (
                <button
                  type="button"
                  onClick={() => setShowRefundForm(true)}
                  disabled={!configured || remainingRefundable <= 0}
                  className="px-4 py-1.5 border border-[#7a2e2e] text-[#7a2e2e] text-[10px] tracking-[1.5px] uppercase font-semibold disabled:opacity-40"
                >
                  Refund
                </button>
              ) : (
                <form onSubmit={submitRefund} className="border border-[rgba(184,137,58,0.18)] p-3 space-y-2">
                  <div>
                    <label className="luxury-label">Amount (₹)</label>
                    <input
                      type="number"
                      min={1}
                      max={remainingRefundable}
                      className="luxury-input"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="luxury-label">Reason</label>
                    <input
                      type="text"
                      className="luxury-input"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  {refundError && <div className="text-xs text-[#7a2e2e]">{refundError}</div>}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={refundSaving}
                      className="px-4 py-1.5 bg-[#7a2e2e] text-white text-[10px] tracking-[1.5px] uppercase font-semibold disabled:opacity-60"
                    >
                      {refundSaving ? 'Processing…' : 'Confirm Refund'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRefundForm(false)}
                      className="px-4 py-1.5 border border-[#1a1410] text-[10px] tracking-[1.5px] uppercase font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <a
            href={whatsappLink(orderUpdateMessage(order), order.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-5 py-3 bg-[#16796F] text-white text-[11px] tracking-[2px] uppercase font-semibold hover:opacity-90 inline-flex items-center justify-center gap-2"
          >
            <MessageCircle size={14} /> Send update on WhatsApp
          </a>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href={{ pathname: '/admin/returns', query: { orderId: order.id, customer: order.customer, phone: order.phone } }}
              className="px-5 py-3 border border-[#1a1410] text-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] inline-flex items-center justify-center gap-2"
            >
              <RotateCcw size={14} /> Create Return
            </Link>
            <a
              href={`/admin/orders/${order.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 border border-[#1a1410] text-[#1a1410] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#1a1410] hover:text-[#e8d49b] inline-flex items-center justify-center gap-2"
            >
              <FileText size={14} /> Download Invoice
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
