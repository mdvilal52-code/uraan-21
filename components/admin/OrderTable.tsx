'use client';

import { Eye, Truck, MessageCircle } from 'lucide-react';
import { Order, OrderStatus, getStatusColor } from '@/lib/orders';
import { whatsappLink, orderUpdateMessage } from '@/lib/whatsapp';

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

type OrderTableProps = {
  orders: Order[];
  onView?: (id: string) => void;
  onStatusChange?: (id: string, status: OrderStatus) => void;
};

export default function OrderTable({ orders, onView, onStatusChange }: OrderTableProps) {
  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)] bg-[#fbf8f1]">
            <th className="text-left py-3 px-4 font-semibold">Order ID</th>
            <th className="text-left py-3 px-4 font-semibold">Customer</th>
            <th className="text-left py-3 px-4 font-semibold">Amount</th>
            <th className="text-left py-3 px-4 font-semibold">Items</th>
            <th className="text-left py-3 px-4 font-semibold">Payment</th>
            <th className="text-left py-3 px-4 font-semibold">Status</th>
            <th className="text-left py-3 px-4 font-semibold">Date</th>
            <th className="text-right py-3 px-4 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-[rgba(184,137,58,0.1)] hover:bg-[#fbf8f1]/40">
              <td className="py-3 px-4 font-medium text-[#1a1410] text-xs">{o.id}</td>
              <td className="py-3 px-4">
                <div className="font-medium text-[#1a1410]">{o.customer}</div>
                <div className="text-[10px] text-[#9a8c75]">{o.email}</div>
              </td>
              <td className="py-3 px-4 font-semibold text-[#1a1410]">
                ₹{o.amount.toLocaleString('en-IN')}
              </td>
              <td className="py-3 px-4 text-[#6b5d4c]">{o.items}</td>
              <td className="py-3 px-4 text-[#6b5d4c]">
                <div>{o.payment}</div>
                {o.paid !== undefined && (
                  <span
                    className={`inline-block mt-1 px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.5px] ${
                      o.paid ? 'bg-[#3d6b5a]/10 text-[#3d6b5a]' : 'bg-gray-500/10 text-gray-600'
                    }`}
                  >
                    {o.paid ? 'PAID' : 'UNPAID'}
                  </span>
                )}
              </td>
              <td className="py-3 px-4">
                {onStatusChange ? (
                  <select
                    value={o.status}
                    onChange={(e) => onStatusChange(o.id, e.target.value as OrderStatus)}
                    className={`text-[11px] font-semibold px-2 py-1 outline-none cursor-pointer border-0 ${getStatusColor(o.status)}`}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(o.status)}`}>
                    {o.status}
                  </span>
                )}
              </td>
              <td className="py-3 px-4 text-xs text-[#6b5d4c]">{o.date}</td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-3">
                  <a
                    href={whatsappLink(orderUpdateMessage(o), o.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Send order update on WhatsApp"
                    title="Send order update on WhatsApp"
                    className="text-[#16796F] hover:opacity-70"
                  >
                    <MessageCircle size={15} />
                  </a>
                  <button
                    onClick={() => onView && onView(o.id)}
                    aria-label="View order"
                    className="text-[#6b5d4c] hover:text-[#b8893a]"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <div className="text-center py-12">
          <Truck className="text-[#9a8c75] mx-auto mb-2" size={32} />
          <p className="text-sm text-[#6b5d4c]">No orders found.</p>
        </div>
      )}
    </div>
  );
}