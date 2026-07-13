// Browser-persisted coupon store (localStorage), so the admin panel's coupon
// add / edit / delete / toggle survive a page refresh without a backend —
// the same demo-friendly pattern used by lib/leads.ts.

export type CouponType = 'percent' | 'flat';

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  usageLimit: number;
  used: number;
  validUntil: string;
  active: boolean;
  // First-order-only + category restrictions (#coupons-l3).
  firstOrderOnly: boolean;
  category?: string; // undefined/empty = applies to all categories
};

const KEY = 'ogp_coupons';

const seedCoupons: Coupon[] = [
  { id: 'CP001', code: 'WELCOME10', type: 'percent', value: 10, minOrder: 999, usageLimit: 1000, used: 245, validUntil: '31 Dec 2026', active: true, firstOrderOnly: false },
  { id: 'CP002', code: 'FESTIVE25', type: 'percent', value: 25, minOrder: 4999, usageLimit: 500, used: 78, validUntil: '15 Nov 2026', active: true, firstOrderOnly: false },
  { id: 'CP003', code: 'FLAT500', type: 'flat', value: 500, minOrder: 2499, usageLimit: 200, used: 56, validUntil: '30 Jun 2026', active: true, firstOrderOnly: false },
  { id: 'CP004', code: 'SUMMER15', type: 'percent', value: 15, minOrder: 1999, usageLimit: 800, used: 800, validUntil: '15 Apr 2026', active: false, firstOrderOnly: false },
  { id: 'CP005', code: 'NEWUSER', type: 'flat', value: 200, minOrder: 999, usageLimit: 5000, used: 1245, validUntil: '31 Dec 2026', active: true, firstOrderOnly: true },
];

function read(): Coupon[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Coupon[]) : null;
  } catch {
    return null;
  }
}

function write(list: Coupon[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function nextId(list: Coupon[]): string {
  const max = list.reduce((m, c) => {
    const n = parseInt(c.id.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return 'CP' + String(max + 1).padStart(3, '0');
}

export function getCoupons(): Coupon[] {
  const stored = read();
  if (stored) return stored;
  write(seedCoupons);
  return seedCoupons;
}

export type CouponInput = {
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  usageLimit: number;
  validUntil: string;
  firstOrderOnly?: boolean;
  category?: string;
};

export function addCoupon(input: CouponInput): Coupon {
  const list = getCoupons();
  const coupon: Coupon = {
    id: nextId(list),
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: Number(input.value) || 0,
    minOrder: Number(input.minOrder) || 0,
    usageLimit: Number(input.usageLimit) || 0,
    used: 0,
    validUntil: input.validUntil.trim(),
    active: true,
    firstOrderOnly: Boolean(input.firstOrderOnly),
    category: input.category?.trim() || undefined,
  };
  write([...list, coupon]);
  return coupon;
}

export function updateCoupon(id: string, patch: Partial<Omit<Coupon, 'id'>>): void {
  write(getCoupons().map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

export function toggleCoupon(id: string): void {
  write(getCoupons().map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
}

export function deleteCoupon(id: string): void {
  write(getCoupons().filter((c) => c.id !== id));
}
