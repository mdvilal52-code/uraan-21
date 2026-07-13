'use client';

import { useEffect, useState } from 'react';
import AnalyticsCard from '@/components/admin/AnalyticsCards';
import { RevenueChart, OrdersChart, CategoryChart } from '@/components/admin/RevenueChart';
import { IndianRupee, ShoppingCart, Users, Package, TrendingUp, ExternalLink, BarChart3 } from 'lucide-react';
import type { DashboardAnalytics } from '@/lib/analyticsDb';

const EMPTY_STATS = {
  totalRevenue: 0, totalOrders: 0, totalCustomers: 0, productsSold: 0,
  revenueChange: 0, ordersChange: 0, customersChange: 0, productsChange: 0,
  conversionRate: 0,
};

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        const json = await res.json();
        if (res.ok && json.configured && json.analytics) setAnalytics(json.analytics);
      } catch {
        /* keep empty state */
      }
    })();
  }, []);

  const stats = analytics || EMPTY_STATS;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1">Analytics</h1>
        <p className="text-sm text-[#6b5d4c]">Deep insights into your business performance.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} change={stats.revenueChange} color="gold" />
        <AnalyticsCard title="Total Orders" value={stats.totalOrders} icon={ShoppingCart} change={stats.ordersChange} color="green" />
        <AnalyticsCard title="Customers" value={stats.totalCustomers} icon={Users} change={stats.customersChange} color="blue" />
        <AnalyticsCard title="Products Sold" value={stats.productsSold} icon={Package} change={stats.productsChange} color="red" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <RevenueChart data={analytics?.monthlyRevenue} />
        <OrdersChart data={analytics?.weeklyOrders} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <CategoryChart data={analytics?.categorySales} />

        {/* Top Products */}
        <div className="lg:col-span-2 bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410]">Top Products</h3>
              <p className="text-[10px] text-[#9a8c75] mt-1">Best performers by revenue, all-time</p>
            </div>
            <TrendingUp className="text-[#b8893a]" size={18} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)]">
                  <th className="text-left py-2 font-semibold">Product</th>
                  <th className="text-left py-2 font-semibold">Sales</th>
                  <th className="text-left py-2 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.topProducts || []).map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(184,137,58,0.1)]">
                    <td className="py-3">
                      <div className="font-medium text-[#1a1410]">{p.name}</div>
                      <div className="text-[10px] text-[#9a8c75]">{p.id}</div>
                    </td>
                    <td className="py-3 font-semibold text-[#1a1410]">{p.sales}</td>
                    <td className="py-3 font-semibold text-[#b8893a]">₹{p.revenue.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
                {(!analytics || analytics.topProducts.length === 0) && (
                  <tr><td colSpan={3} className="py-6 text-center text-[#9a8c75] text-sm">No sales yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conversion + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410] mb-1">Leads → Orders Conversion</h3>
          <p className="text-[10px] text-[#9a8c75] mb-4">
            Approximation (orders ÷ total leads captured) — this store doesn&apos;t track site visitors, so it isn&apos;t a true visitor-conversion rate.
          </p>
          <div className="serif text-4xl text-[#b8893a]">{stats.conversionRate}%</div>
        </div>

        <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
          <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410] mb-1 flex items-center gap-2">
            <BarChart3 size={16} className="text-[#b8893a]" /> Traffic Sources
          </h3>
          {gaId ? (
            <>
              <p className="text-[10px] text-[#9a8c75] mb-4">Google Analytics 4 is connected — full source/medium, sessions and real-time visitor breakdowns live in the GA4 dashboard (this panel doesn&apos;t duplicate Google&apos;s reporting).</p>
              <a
                href="https://analytics.google.com/analytics/web/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[rgba(184,137,58,0.32)] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1]"
              >
                Open Google Analytics <ExternalLink size={12} />
              </a>
            </>
          ) : (
            <p className="text-[10px] text-[#9a8c75] mt-1">
              Not connected yet. Set <code className="text-[#b8893a]">NEXT_PUBLIC_GA_MEASUREMENT_ID</code> (see the environment variables guide) to start tracking visitor traffic — this card will link straight to your GA4 dashboard once it&apos;s live.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
