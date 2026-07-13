// Server-side "customers" derived from the `orders` table (Supabase). There is
// intentionally NO separate customers table — syncing a second identity table
// from orders would create a duplicate-identity problem (which record wins on
// conflicting name/email edits?). Instead we aggregate orders at query time,
// grouped by phone (falling back to email when phone is blank). Returns null
// when the DB is not configured — there is no browser-local fallback store
// here (customers only exist once real orders do), callers should render an
// empty/"connect a database" state instead.
import { getSupabase } from './supabase';
import type { Order, OrderStatus } from './orders';
import { normalizePhone } from './phone';

export type CustomerSegment = 'new' | 'repeat' | 'high-value';
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold';

export type Customer = {
  id: string; // phone (preferred) or lower-cased email — stable per customer
  name: string;
  email: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  segment: CustomerSegment;
  loyaltyTier: LoyaltyTier;
};

// Segment thresholds, tuned for an SMB jewellery store where a single order
// can range from a few hundred rupees (a rudraksh bead) to several lakhs (a
// bridal set): one order ever = 'new'; 2+ orders with lifetime spend under
// ₹50,000 = a regular 'repeat' buyer; ₹50,000+ lifetime spend = 'high-value'
// regardless of order count, since one large piece can clear that alone.
// Adjust these two numbers as real order volume comes in.
const HIGH_VALUE_THRESHOLD = 50000;

// Loyalty tiers are informational only, shown as a badge in the admin UI —
// there is NO points/redemption engine wired to checkout. Purely a spend-based
// label for the admin's reference when deciding who to prioritise for outreach.
const SILVER_THRESHOLD = 25000;
const GOLD_THRESHOLD = 75000;

function loyaltyTierFor(totalSpent: number): LoyaltyTier {
  if (totalSpent < SILVER_THRESHOLD) return 'Bronze';
  if (totalSpent < GOLD_THRESHOLD) return 'Silver';
  return 'Gold';
}

function segmentFor(orderCount: number, totalSpent: number): CustomerSegment {
  if (totalSpent >= HIGH_VALUE_THRESHOLD) return 'high-value';
  if (orderCount >= 2) return 'repeat';
  return 'new';
}

// Normalizes the phone to E.164 before using it as the grouping key, so two
// orders for the same customer saved in different raw formats (e.g. before
// normalization existed, or "9876543210" vs "+919876543210") still group as
// one customer instead of appearing as two.
function keyFor(phone: string | null | undefined, email: string | null | undefined): string | null {
  const p = normalizePhone(phone) || (phone || '').trim();
  if (p) return p;
  const e = (email || '').trim().toLowerCase();
  return e || null;
}

type ListRow = {
  customer: string;
  email: string | null;
  phone: string | null;
  amount: number;
  status: string;
  created_at: string;
};

export async function dbGetCustomers(): Promise<Customer[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('orders')
    .select('customer,email,phone,amount,status,created_at')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[customersDb] list:', error.message);
    return null;
  }

  type Group = {
    key: string;
    name: string;
    email: string;
    phone: string;
    orderCount: number;
    totalSpent: number;
    firstOrderAt: string;
    lastOrderAt: string;
  };
  const groups = new Map<string, Group>();

  for (const r of data as ListRow[]) {
    const key = keyFor(r.phone, r.email);
    if (!key) continue; // no phone or email — can't identify this customer
    const spendable = r.status !== 'Cancelled' ? Number(r.amount) || 0 : 0;
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, {
        key,
        name: r.customer,
        email: r.email || '',
        phone: r.phone || '',
        orderCount: 1,
        totalSpent: spendable,
        firstOrderAt: r.created_at,
        lastOrderAt: r.created_at,
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpent += spendable;
      // Rows are ascending by date, so the last write wins = most recent order.
      existing.name = r.customer || existing.name;
      existing.email = r.email || existing.email;
      existing.phone = r.phone || existing.phone;
      existing.lastOrderAt = r.created_at;
    }
  }

  const customers: Customer[] = Array.from(groups.values()).map((g) => ({
    id: g.key,
    name: g.name,
    email: g.email,
    phone: g.phone,
    orderCount: g.orderCount,
    totalSpent: g.totalSpent,
    firstOrderAt: g.firstOrderAt,
    lastOrderAt: g.lastOrderAt,
    segment: segmentFor(g.orderCount, g.totalSpent),
    loyaltyTier: loyaltyTierFor(g.totalSpent),
  }));

  customers.sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());
  return customers;
}

// Row shape + mapping copied from lib/ordersDb.ts's toOrder() so a customer's
// order history renders identically to the main Orders admin page.
const STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
function normStatus(s: string): OrderStatus {
  return (STATUSES.includes(s as OrderStatus) ? s : 'Processing') as OrderStatus;
}

type OrderRow = {
  id: string;
  customer: string;
  email: string | null;
  phone: string | null;
  amount: number;
  item_count: number;
  items: { name: string; quantity: number; price: number; image?: string }[] | null;
  status: string;
  payment: string | null;
  payment_id: string | null;
  paid: boolean | null;
  address: string | null;
  created_at: string;
};

function toOrder(r: OrderRow): Order {
  return {
    id: r.id,
    customerId: '',
    customer: r.customer,
    email: r.email || '',
    phone: r.phone || '',
    amount: r.amount,
    items: r.item_count,
    status: normStatus(r.status),
    payment: r.payment || '',
    date: new Date(r.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    address: r.address || undefined,
    paid: Boolean(r.paid),
    paymentId: r.payment_id || undefined,
    lineItems: Array.isArray(r.items) ? r.items : undefined,
  };
}

// Full order history + aggregate for one customer (detail view). `phoneOrKey`
// accepts either a phone number or (for phone-less customers) the lower-cased
// email used as their id.
export async function dbGetCustomerByPhone(
  phoneOrKey: string
): Promise<(Customer & { orders: Order[] }) | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const key = phoneOrKey.trim();
  if (!key) return null;

  const isEmailKey = key.includes('@');
  // Match by the trailing significant digits rather than an exact string —
  // older rows may still hold a raw, un-normalized phone (e.g. "9876543210"
  // instead of "+919876543210"), and a suffix match bridges both formats
  // without requiring a database migration.
  const significantDigits = (normalizePhone(key) || key).replace(/[^0-9]/g, '').slice(-10);
  const { data, error } = isEmailKey
    ? await sb.from('orders').select('*').ilike('email', key).order('created_at', { ascending: false })
    : await sb.from('orders').select('*').like('phone', `%${significantDigits}`).order('created_at', { ascending: false });
  if (error) {
    console.error('[customersDb] byPhone:', error.message);
    return null;
  }
  const rows = (data as OrderRow[]) || [];
  if (!rows.length) return null;

  const orders = rows.map(toOrder);
  const totalSpent = rows.reduce((sum, r) => sum + (r.status !== 'Cancelled' ? Number(r.amount) || 0 : 0), 0);
  const last = rows[0]; // already sorted desc
  const first = rows[rows.length - 1];

  const customer: Customer = {
    id: key,
    name: last.customer,
    email: last.email || '',
    phone: last.phone || '',
    orderCount: rows.length,
    totalSpent,
    firstOrderAt: first.created_at,
    lastOrderAt: last.created_at,
    segment: segmentFor(rows.length, totalSpent),
    loyaltyTier: loyaltyTierFor(totalSpent),
  };

  return { ...customer, orders };
}
