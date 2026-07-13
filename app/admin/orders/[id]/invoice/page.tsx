'use client';

import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import type { Order } from '@/lib/orders';
import { BUSINESS_NAME, BUSINESS_ADDRESS_INLINE } from '@/lib/business';

// Print-optimized "invoice" — plain HTML/CSS rendered by Next.js. No PDF
// library: the admin clicks Print → Save as PDF in the browser.
export default function InvoicePage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        const data = await res.json();
        if (res.ok && data.ok) {
          setOrder(data.order as Order);
        } else {
          setError(data.error || 'Order not found.');
        }
      } catch {
        setError('Could not load this order.');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) {
    return <div className="p-10 text-center text-sm text-[#6b5d4c]">Loading invoice…</div>;
  }
  if (error || !order) {
    return <div className="p-10 text-center text-sm text-[#7a2e2e]">{error || 'Order not found.'}</div>;
  }

  const lineItems = order.lineItems || [];
  const subtotal = lineItems.length
    ? lineItems.reduce((sum, li) => sum + li.price * li.quantity, 0)
    : order.amount;

  return (
    <div className="min-h-screen bg-white text-[#1a1410]">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto p-6 md:p-10">
        <div className="print:hidden flex justify-end mb-6">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1410] text-[#e8d49b] text-[11px] tracking-[2px] uppercase font-semibold hover:bg-[#b8893a] hover:text-[#1a1410]"
          >
            <Printer size={14} /> Print / Save as PDF
          </button>
        </div>

        <div className="border-b-2 border-[#1a1410] pb-4 mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="serif text-2xl font-bold">{BUSINESS_NAME}</h1>
            <p className="text-xs text-[#6b5d4c] mt-1 max-w-xs">{BUSINESS_ADDRESS_INLINE}</p>
            <p className="text-xs text-[#6b5d4c] mt-1">GSTIN: 07AAAAA0000A1Z5 (placeholder)</p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold tracking-[2px] uppercase">Tax Invoice</h2>
            <p className="text-xs text-[#6b5d4c] mt-1">Order: {order.id}</p>
            <p className="text-xs text-[#6b5d4c]">Date: {order.date}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-1">Bill To</h3>
            <div className="text-sm font-medium">{order.customer}</div>
            {order.address && <div className="text-sm text-[#6b5d4c]">{order.address}</div>}
            <div className="text-sm text-[#6b5d4c]">{order.phone}</div>
            <div className="text-sm text-[#6b5d4c]">{order.email}</div>
          </div>
          <div className="text-right">
            <h3 className="text-[11px] tracking-[2px] uppercase text-[#9a8c75] mb-1">Payment</h3>
            <div className="text-sm">{order.payment || '—'}</div>
            <div className="text-sm text-[#6b5d4c]">{order.paid ? 'Paid' : 'Unpaid'}</div>
          </div>
        </div>

        {lineItems.length > 0 ? (
          <table className="w-full text-sm mb-6 border border-[#1a1410]">
            <thead>
              <tr className="bg-[#fbf8f1] border-b border-[#1a1410]">
                <th className="text-left py-2 px-3 font-semibold">Item</th>
                <th className="text-right py-2 px-3 font-semibold">Qty</th>
                <th className="text-right py-2 px-3 font-semibold">Unit Price</th>
                <th className="text-right py-2 px-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={idx} className="border-b border-[rgba(26,20,16,0.1)]">
                  <td className="py-2 px-3">{li.name}</td>
                  <td className="py-2 px-3 text-right">{li.quantity}</td>
                  <td className="py-2 px-3 text-right">₹{li.price.toLocaleString('en-IN')}</td>
                  <td className="py-2 px-3 text-right">₹{(li.price * li.quantity).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-[#6b5d4c] mb-6">
            Itemized line items are not available for this order ({order.items} item(s)).
          </p>
        )}

        <div className="flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-[#6b5d4c]">Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {!!order.refundAmount && (
              <div className="flex justify-between py-1 text-[#7a2e2e]">
                <span>Refunded</span>
                <span>-₹{order.refundAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-[#1a1410] font-bold text-base mt-1">
              <span>Total</span>
              <span>₹{order.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-[#9a8c75] mt-10 text-center">
          This is a computer-generated invoice from {BUSINESS_NAME} and does not require a signature.
        </p>
      </div>
    </div>
  );
}
