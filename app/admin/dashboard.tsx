'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnalyticsCard from '@/components/admin/AnalyticsCards';
import { RevenueChart, OrdersChart, CategoryChart } from '@/components/admin/RevenueChart';
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle, ListChecks, Activity } from 'lucide-react';
import { orders as demoOrders, getStatusColor } from '@/lib/orders';
import type { DashboardAnalytics } from '@/lib/analyticsDb';
import type { AuditLogRow } from '@/lib/audit';

const EMPTY_STATS = {
  totalRevenue: 0, totalOrders: 0, totalCustomers: 0, productsSold: 0,
  revenueChange: 0, ordersChange: 0, customersChange: 0, productsChange: 0,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [activity, setActivity] = useState<AuditLogRow[]>([]);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const json = await res.json();
        if (res.ok && json.configured && json.analytics) {
          setConfigured(true);
          setAnalytics(json.analytics);
        }
      } catch {
        /* keep the empty/demo state */
      }
      try {
        const res = await fetch('/api/admin/activity');
        const json = await res.json();
        if (res.ok) setActivity(json.activity || []);
      } catch {
        /* no activity feed available yet */
      }
    })();
  }, []);

  const stats = analytics || EMPTY_STATS;
  const recentOrders = configured ? [] : demoOrders.slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Dashboard</h1>
        <p className="text-sm text-[#6b5d4c]">Welcome back, here&apos;s today&apos;s overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} change={stats.revenueChange} color="gold" />
        <AnalyticsCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} change={stats.ordersChange} color="green" />
        <AnalyticsCard title="Customers" value={stats.totalCustomers} icon={Users} change={stats.customersChange} color="blue" />
        <AnalyticsCard title="Products Sold" value={stats.productsSold} icon={Package} change={stats.productsChange} color="red" />
      </div>

      {/* Pending tasks + low stock */}
      {analytics && (analytics.pendingTasks.length > 0 || analytics.lowStockProducts.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
            <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410] mb-4 flex items-center gap-2">
              <ListChecks size={16} className="text-[#b8893a]" /> Pending Tasks
            </h3>
            <div className="space-y-2">
              {analytics.pendingTasks.map((t) => (
                <Link key={t.label} href={t.href} className="flex items-center justify-between px-3 py-2.5 hover:bg-[#fbf8f1] border-b border-[rgba(184,137,58,0.1)] last:border-0">
                  <span className="text-sm text-[#1a1410]">{t.label}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 ${t.count > 0 ? 'bg-[#7a2e2e]/10 text-[#7a2e2e]' : 'bg-[#3d6b5a]/10 text-[#3d6b5a]'}`}>{t.count}</span>
                </Link>
              ))}
            </div>
          </div>

          {analytics.lowStockProducts.length > 0 && (
            <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
              <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410] mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-[#b8893a]" /> Low Stock Alerts
              </h3>
              <div className="space-y-2">
                {analytics.lowStockProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b border-[rgba(184,137,58,0.1)] last:border-0">
                    <span className="text-sm text-[#1a1410]">{p.name}</span>
                    <span className={`text-xs font-semibold ${p.stockQuantity === 0 ? 'text-[#7a2e2e]' : 'text-[#b8893a]'}`}>
                      {p.stockQuantity === 0 ? 'Out of stock' : `${p.stockQuantity} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <RevenueChart data={analytics?.monthlyRevenue} />
        <OrdersChart data={analytics?.weeklyOrders} />
      </div>

      {/* Recent Orders / Recent Activity + Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410] flex items-center gap-2">
                <Activity size={14} className="text-[#b8893a]" /> Recent Activity
              </h3>
              <p className="text-[10px] text-[#9a8c75] mt-1">Latest admin actions across the panel</p>
            </div>
            <Link href="/admin/audit-log" className="text-[10px] tracking-[1.5px] uppercase text-[#b8893a] font-semibold hover:underline">
              View All
            </Link>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-1">
              {activity.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-[rgba(184,137,58,0.1)] last:border-0 text-sm">
                  <span className="text-[#1a1410]">
                    <span className="font-medium">{a.actorEmail || 'System'}</span> — {actionLabel(a.action)}
                    {a.target && <span className="text-[#9a8c75]"> · {a.target}</span>}
                  </span>
                  <span className="text-[10px] text-[#9a8c75] whitespace-nowrap ml-3">{timeAgo(a.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)]">
                    <th className="text-left py-2 font-semibold">Order ID</th>
                    <th className="text-left py-2 font-semibold">Customer</th>
                    <th className="text-left py-2 font-semibold">Amount</th>
                    <th className="text-left py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-[rgba(184,137,58,0.1)]">
                      <td className="py-3 font-medium text-[#1a1410] text-xs">{o.id}</td>
                      <td className="py-3 text-[#1a1410]">{o.customer}</td>
                      <td className="py-3 font-semibold text-[#1a1410]">₹{o.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(o.status)}`}>{o.status}</span>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-[#9a8c75] text-sm">No activity yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <CategoryChart data={analytics?.categorySales} />
      </div>
    </div>
  );
}
