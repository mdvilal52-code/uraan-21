'use client';

import { useEffect, useState } from 'react';
import { seedBanners, type Banner } from '@/lib/banners';

// Module-level cache so the homepage promo section shares a single
// /api/banners request. Mirrors hooks/useProducts.ts, including the 5-minute
// TTL and the invalidation hook so admin changes propagate to the storefront
// without waiting out the full TTL (or a hard reload).
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: Banner[] | null = null;
let cachedAt = 0;
let inflight: Promise<Banner[] | null> | null = null;

export function invalidateBannerCache() {
  cached = null;
  cachedAt = 0;
}

function loadBanners(): Promise<Banner[] | null> {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return Promise.resolve(cached);
  if (cached) { cached = null; } // TTL expired — discard stale cache
  if (!inflight) {
    inflight = fetch('/api/banners')
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok && Array.isArray(d.banners) && d.banners.length) {
          cached = d.banners as Banner[];
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

// Live banners from the database, falling back to the bundled set.
export function useBanners(): { banners: Banner[]; loaded: boolean } {
  const [banners, setBanners] = useState<Banner[]>(cached || seedBanners);
  const [loaded, setLoaded] = useState(Boolean(cached));

  useEffect(() => {
    let active = true;
    loadBanners().then((list) => {
      if (!active) return;
      if (list && list.length) setBanners(list);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { banners, loaded };
}
