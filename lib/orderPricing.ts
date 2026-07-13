// Server-side authoritative order pricing. The browser is never trusted for
// what a cart line costs — only for WHICH product ids and quantities the
// customer selected. Price, name and image are always re-derived here from
// the real catalogue (DB when configured, the bundled seed catalogue when
// not — same fallback every other read in this app uses).
import { dbGetProductsByIds } from './productsDb';
import { isSupabaseConfigured } from './supabase';
import { products as seedProducts } from '@/data/jewelleryData';

export const MAX_ORDER_ITEMS = 100;
const FREE_SHIPPING_THRESHOLD = 1999;
const SHIPPING_FEE = 99;

export type CartLine = { id: string; quantity: number };

export type ResolvedLine = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
};

export type ResolveResult =
  | { ok: true; lines: ResolvedLine[]; subtotal: number }
  | { ok: false; error: string };

// Looks up each {id, quantity} against the real catalogue and returns
// server-priced line items. Rejects unknown / out-of-stock ids outright
// rather than silently dropping them, so a customer's total never silently
// shrinks relative to what they think they're buying.
export async function resolveCartLines(raw: unknown): Promise<ResolveResult> {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, error: 'Your cart is empty.' };
  }
  if (raw.length > MAX_ORDER_ITEMS) {
    return { ok: false, error: `Orders are limited to ${MAX_ORDER_ITEMS} items.` };
  }

  const lines: CartLine[] = raw.map((r) => ({
    id: String((r as { id?: unknown })?.id || ''),
    quantity: Math.max(1, Math.min(999, Math.floor(Number((r as { quantity?: unknown })?.quantity) || 1))),
  }));
  if (lines.some((l) => !l.id)) {
    return { ok: false, error: 'Invalid item in cart.' };
  }

  const ids = Array.from(new Set(lines.map((l) => l.id)));
  const catalogue = isSupabaseConfigured()
    ? await dbGetProductsByIds(ids)
    : seedProducts.filter((p) => ids.includes(p.id));

  if (catalogue === null) {
    return { ok: false, error: 'Could not verify your cart. Please try again.' };
  }

  const byId = new Map(catalogue.map((p) => [p.id, p]));
  const resolved: ResolvedLine[] = [];
  for (const line of lines) {
    const product = byId.get(line.id);
    if (!product) {
      return { ok: false, error: 'One of the items in your cart is no longer available.' };
    }
    if (product.inStock === false) {
      return { ok: false, error: `${product.name} is out of stock.` };
    }
    resolved.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: line.quantity,
      image: product.image || undefined,
      category: product.category || undefined,
    });
  }

  const subtotal = resolved.reduce((sum, l) => sum + l.price * l.quantity, 0);
  return { ok: true, lines: resolved, subtotal };
}

export function computeShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
