'use client';

import { useEffect, useState } from 'react';
import { categories as seed, type Category } from '@/data/jewelleryData';

// Module-level cache so every category-consuming component shares a single
// /api/categories request. Mirrors hooks/useProducts.ts. The 5-minute TTL
// means admin changes propagate to the storefront without a hard browser reload.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: Category[] | null = null;
let cachedAt = 0;
let inflight: Promise<Category[] | null> | null = null;

export function invalidateCategoryCache() {
  cached = null;
  cachedAt = 0;
}

function loadCategories(): Promise<Category[] | null> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return Promise.resolve(cached);
  if (cached) { cached = null; } // TTL expired — discard stale cache
  if (!inflight) {
    inflight = fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.categories) && d.categories.length) {
          cached = d.categories as Category[];
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

// Live categories from the database, falling back to the bundled list so the
// first paint (and SEO) always has content and the storefront never goes blank.
export function useCategories(): { categories: Category[]; loaded: boolean } {
  const [categories, setCategories] = useState<Category[]>(cached || seed);
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let active = true;
    loadCategories().then((list) => {
      if (!active) return;
      if (list && list.length) setCategories(list);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { categories, loaded };
}
