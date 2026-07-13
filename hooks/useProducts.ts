'use client';

import { useEffect, useState } from 'react';
import { products as seed, type Product } from '@/data/jewelleryData';

// Module-level cache so the many product-consuming components on a page share a
// single /api/products request (and navigations are instant). The 5-minute TTL
// means admin changes propagate to the storefront without a hard browser reload.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: Product[] | null = null;
let cachedAt = 0;
let inflight: Promise<Product[] | null> | null = null;

export function invalidateProductCache() {
  cached = null;
  cachedAt = 0;
}

function loadProducts(): Promise<Product[] | null> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return Promise.resolve(cached);
  if (cached) { cached = null; } // TTL expired — discard stale cache
  if (!inflight) {
    inflight = fetch('/api/products')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.products) && d.products.length) {
          cached = d.products as Product[];
          cachedAt = Date.now();
          return cached;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

// Returns the live product catalogue. Starts with the bundled catalogue so the
// first paint (and SEO) has content, then swaps in the database catalogue once
// /api/products responds. If the DB is off or empty, the bundled catalogue is
// kept, so the storefront never goes blank.
export function useProducts(): { products: Product[]; loaded: boolean } {
  const [products, setProducts] = useState<Product[]>(cached || seed);
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let active = true;
    loadProducts().then((list) => {
      if (!active) return;
      if (list && list.length) setProducts(list);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { products, loaded };
}
