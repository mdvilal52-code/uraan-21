// Browser-persisted abandoned-cart store (localStorage) — mirrors lib/coupons.ts
// so the admin panel has something to show even without a backend. There's no
// compelling seed data for this feature (an empty cart list is the honest
// starting state), so it starts empty and fills in as the demo store captures
// checkouts locally (best effort only — the real capture path is the
// /api/abandoned-carts route, which is server/DB-backed).

export type AbandonedCartItem = { name: string; quantity: number; price: number };

export type AbandonedCart = {
  id: number;
  name?: string;
  phone?: string;
  email?: string;
  items: AbandonedCartItem[];
  total: number;
  remindedAt?: string;
  recovered: boolean;
  createdAt: string;
};

const KEY = 'ogp_abandoned_carts';

function read(): AbandonedCart[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AbandonedCart[]) : null;
  } catch {
    return null;
  }
}

function write(list: AbandonedCart[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getAbandonedCarts(): AbandonedCart[] {
  return read() || [];
}

export function addAbandonedCart(input: {
  name?: string;
  phone?: string;
  email?: string;
  items: AbandonedCartItem[];
  total: number;
}): AbandonedCart {
  const list = getAbandonedCarts();
  const cart: AbandonedCart = {
    id: Date.now(),
    name: input.name?.trim() || undefined,
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    items: input.items,
    total: input.total,
    recovered: false,
    createdAt: new Date().toISOString(),
  };
  write([cart, ...list]);
  return cart;
}

export function markReminded(id: number): void {
  write(getAbandonedCarts().map((c) => (c.id === id ? { ...c, remindedAt: new Date().toISOString() } : c)));
}

export function markRecovered(phoneOrId: string | number): void {
  write(
    getAbandonedCarts().map((c) =>
      c.id === phoneOrId || (typeof phoneOrId === 'string' && c.phone === phoneOrId)
        ? { ...c, recovered: true }
        : c
    )
  );
}
