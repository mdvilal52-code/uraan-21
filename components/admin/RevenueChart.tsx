'use client';

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ChartDataPoint, RevenuePoint } from '@/lib/analyticsDb';

const COLORS = ['#b8893a', '#7a5a1f', '#d4a857', '#3d6b5a', '#7a2e2e', '#1a1410'];

// Shown when a chart has no data yet (clean slate / new store) instead of an
// empty grid, so the dashboard looks intentional rather than broken.
function EmptyChart() {
  return (
    <div className="h-[280px] grid place-items-center text-center">
      <div>
        <p className="text-sm text-[#9a8c75]">No data yet</p>
        <p className="text-[10px] text-[#c2b8a6] mt-1">This fills in as orders come in</p>
      </div>
    </div>
  );
}

export function RevenueChart({ data = [] }: { data?: RevenuePoint[] }) {
  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
      <div className="mb-4">
        <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410]">Revenue Overview</h3>
        <p className="text-[10px] text-[#9a8c75] mt-1">Last 6 months</p>
      </div>
      {data.some((d) => d.revenue > 0) ? (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,137,58,0.15)" />
            <XAxis dataKey="month" stroke="#6b5d4c" style={{ fontSize: 11 }} />
            <YAxis stroke="#6b5d4c" style={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1410', border: '1px solid #b8893a', color: '#e8d49b', fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" stroke="#b8893a" strokeWidth={2.5} dot={{ fill: '#b8893a', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </div>
  );
}

export function OrdersChart({ data = [] }: { data?: ChartDataPoint[] }) {
  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
      <div className="mb-4">
        <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410]">Weekly Orders</h3>
        <p className="text-[10px] text-[#9a8c75] mt-1">Last 7 days</p>
      </div>
      {data.some((d) => d.value > 0) ? (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(184,137,58,0.15)" />
            <XAxis dataKey="label" stroke="#6b5d4c" style={{ fontSize: 11 }} />
            <YAxis stroke="#6b5d4c" style={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#1a1410', border: '1px solid #b8893a', color: '#e8d49b', fontSize: 12 }} />
            <Bar dataKey="value" fill="#b8893a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </div>
  );
}

export function CategoryChart({ data = [] }: { data?: ChartDataPoint[] }) {
  return (
    <div className="bg-white border border-[rgba(184,137,58,0.18)] p-5">
      <div className="mb-4">
        <h3 className="display text-sm tracking-[2px] uppercase text-[#1a1410]">Sales by Category</h3>
        <p className="text-[10px] text-[#9a8c75] mt-1">All-time, by revenue share</p>
      </div>
      {data.length ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ label, value }: { label?: string; value?: number }) => `${label} ${value}%`}
              labelLine={false}
              style={{ fontSize: 10 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: '#1a1410', border: '1px solid #b8893a', color: '#e8d49b', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChart />
      )}
    </div>
  );
}
