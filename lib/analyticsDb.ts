// Real dashboard/analytics numbers computed from the orders + products tables
// (Supabase). Replaces the old hardcoded-empty stubs in lib/analytics.ts.
// Every function is fail-safe: on any error or when Supabase isn't configured
// it returns null / an empty shape rather than throwing, so the dashboard
// degrades to "no data yet" instead of crashing.
import { getSupabase } from './supabase';

type OrderRow = {
  id: string;
  amount: number;
  status: string;
  items: { name?: string; quantity?: number; price?: number }[] | null;
  item_count: number | null;
  phone: string | null;
  email: string | null;
  created_at: string;
};

export type ChartDataPoint = { label: string; value: number };
export type RevenuePoint = { month: string; revenue: number; orders: number };
export type TopProduct = { id: string; name: string; sales: number; revenue: number };

export type DashboardAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  productsSold: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
  conversionRate: number; // orders / leads, an approximation (no site-traffic tracking wired up)
  monthlyRevenue: RevenuePoint[];
  weeklyOrders: ChartDataPoint[];
  categorySales: ChartDataPoint[];
  topProducts: TopProduct[];
  lowStockProducts: { id: string; name: string; stockQuantity: number; lowStockThreshold: number }[];
  pendingTasks: { label: string; count: number; href: string }[];
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}`;
}
function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'short' });
}
function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

export async function dbGetDashboardAnalytics(): Promise<DashboardAnalytics | null> {
  const sb = getSupabase();
  if (!sb) return null;

  try {
    const { data: orderRows, error } = await sb
      .from('orders')
      .select('id, amount, status, items, item_count, phone, email, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const orders = (orderRows || []) as OrderRow[];
    const live = orders.filter((o) => o.status !== 'Cancelled');

    const totalRevenue = live.reduce((sum, o) => sum + (o.amount || 0), 0);
    const totalOrders = orders.length;
    const productsSold = live.reduce((sum, o) => sum + (o.item_count || 0), 0);

    const customerKeys = new Set<string>();
    for (const o of orders) {
      const key = (o.phone || o.email || '').trim().toLowerCase();
      if (key) customerKeys.add(key);
    }
    const totalCustomers = customerKeys.size;

    // Month-over-month change (current calendar month vs previous).
    const now = new Date();
    const thisMonthKey = monthKey(now);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = monthKey(prevDate);
    const pctChange = (curr: number, prev: number): number => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 1000) / 10;
    };
    let thisMonthRevenue = 0, prevMonthRevenue = 0, thisMonthOrders = 0, prevMonthOrders = 0;
    let thisMonthCustomers = new Set<string>(), prevMonthCustomers = new Set<string>();
    let thisMonthProducts = 0, prevMonthProducts = 0;
    for (const o of orders) {
      const k = monthKey(new Date(o.created_at));
      const custKey = (o.phone || o.email || '').trim().toLowerCase();
      if (k === thisMonthKey) {
        if (o.status !== 'Cancelled') { thisMonthRevenue += o.amount || 0; thisMonthProducts += o.item_count || 0; }
        thisMonthOrders += 1;
        if (custKey) thisMonthCustomers.add(custKey);
      } else if (k === prevMonthKey) {
        if (o.status !== 'Cancelled') { prevMonthRevenue += o.amount || 0; prevMonthProducts += o.item_count || 0; }
        prevMonthOrders += 1;
        if (custKey) prevMonthCustomers.add(custKey);
      }
    }

    // Last 6 months revenue/orders trend.
    const monthlyRevenue: RevenuePoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = monthKey(d);
      const rows = orders.filter((o) => monthKey(new Date(o.created_at)) === k);
      monthlyRevenue.push({
        month: monthLabel(d),
        revenue: rows.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + (o.amount || 0), 0),
        orders: rows.length,
      });
    }

    // Last 7 days order counts.
    const weeklyOrders: ChartDataPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const count = orders.filter((o) => new Date(o.created_at).toDateString() === dayStr).length;
      weeklyOrders.push({ label: dayLabel(d), value: count });
    }

    // Item-level aggregation (name -> qty/revenue) for top products + a
    // best-effort category breakdown (order items only store a name, so we
    // resolve category via a name lookup against the products table).
    const itemAgg = new Map<string, { name: string; sales: number; revenue: number }>();
    for (const o of live) {
      for (const item of o.items || []) {
        if (!item?.name) continue;
        const key = item.name.toLowerCase();
        const entry = itemAgg.get(key) || { name: item.name, sales: 0, revenue: 0 };
        entry.sales += item.quantity || 0;
        entry.revenue += (item.price || 0) * (item.quantity || 0);
        itemAgg.set(key, entry);
      }
    }
    const topEntries = [...itemAgg.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Resolve product id + category for the top items via a single query.
    const { data: productRows } = await sb
      .from('products')
      .select('id, name, category, stock_quantity, low_stock_threshold, deleted_at')
      .is('deleted_at', null);
    const byName = new Map((productRows || []).map((p) => [String(p.name).toLowerCase(), p]));

    const topProducts: TopProduct[] = topEntries.map((e) => ({
      id: (byName.get(e.name.toLowerCase())?.id as string) || e.name.slice(0, 8),
      name: e.name,
      sales: e.sales,
      revenue: e.revenue,
    }));

    const categoryTotals = new Map<string, number>();
    let categoryGrandTotal = 0;
    for (const e of itemAgg.values()) {
      const cat = (byName.get(e.name.toLowerCase())?.category as string) || 'Uncategorised';
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + e.revenue);
      categoryGrandTotal += e.revenue;
    }
    const categorySales: ChartDataPoint[] = [...categoryTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({
        label,
        value: categoryGrandTotal > 0 ? Math.round((value / categoryGrandTotal) * 100) : 0,
      }));

    const lowStockProducts = (productRows || [])
      .filter((p) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 5))
      .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0))
      .slice(0, 10)
      .map((p) => ({
        id: p.id as string,
        name: p.name as string,
        stockQuantity: (p.stock_quantity as number) ?? 0,
        lowStockThreshold: (p.low_stock_threshold as number) ?? 5,
      }));

    // Pending-tasks widget: pull counts other tables can supply; each query is
    // independently guarded so a missing/renamed table can't break the page.
    const pendingTasks: { label: string; count: number; href: string }[] = [];
    const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
    pendingTasks.push({ label: 'Pending orders', count: pendingOrders, href: '/admin/orders' });
    pendingTasks.push({ label: 'Low stock products', count: lowStockProducts.length, href: '/admin/products' });
    try {
      const { count: newLeads } = await sb.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'New');
      pendingTasks.push({ label: 'New leads', count: newLeads || 0, href: '/admin/leads' });
    } catch { /* leads table not reachable — skip this task card */ }
    try {
      const { count: openReturns } = await sb.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'requested');
      pendingTasks.push({ label: 'Open return requests', count: openReturns || 0, href: '/admin/returns' });
    } catch { /* returns table may not exist yet — skip */ }

    let conversionRate = 0;
    try {
      const { count: totalLeads } = await sb.from('leads').select('id', { count: 'exact', head: true });
      conversionRate = totalLeads ? Math.round((totalOrders / totalLeads) * 1000) / 10 : 0;
    } catch { /* leave at 0 */ }

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      productsSold,
      revenueChange: pctChange(thisMonthRevenue, prevMonthRevenue),
      ordersChange: pctChange(thisMonthOrders, prevMonthOrders),
      customersChange: pctChange(thisMonthCustomers.size, prevMonthCustomers.size),
      productsChange: pctChange(thisMonthProducts, prevMonthProducts),
      conversionRate,
      monthlyRevenue,
      weeklyOrders,
      categorySales,
      topProducts,
      lowStockProducts,
      pendingTasks,
    };
  } catch (err) {
    console.error('[analyticsDb] failed:', err);
    return null;
  }
}
