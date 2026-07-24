// Approximate request location from edge/CDN geo headers injected by the
// reverse proxy or CDN in front of this app. No external service is needed.
// Multiple header formats are detected in priority order so the function
// returns the best available data regardless of hosting platform:
//
//   1. x-nf-geo        — base64-encoded JSON blob (used by some CDNs/proxies)
//   2. cf-ipcountry    — separate ISO-3166-1 alpha-2 country code header
//      cf-ipcity / cf-region — matching city/region headers
//   3. x-vercel-ip-*   — URL-encoded separate headers (used by some edge nodes)
//
// On a bare VPS behind plain Nginx none of these headers will be present and
// getGeo() returns {} — that is the correct, graceful fallback. The feature
// still works: security alerts just won't include a city/country line.
export type GeoInfo = { city?: string; region?: string; country?: string };

function fromBase64JsonGeoHeader(h: Headers): GeoInfo | null {
  const raw = h.get('x-nf-geo');
  if (!raw) return null;
  try {
    const g = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    return {
      city: g.city || undefined,
      region: g.subdivision?.name || undefined,
      country: g.country?.name || g.country?.code || undefined,
    };
  } catch {
    return null;
  }
}

function fromSeparateCountryHeaders(h: Headers): GeoInfo | null {
  const country = h.get('cf-ipcountry');
  if (!country || country === 'XX') return null;
  return {
    city: h.get('cf-ipcity') || undefined,
    region: h.get('cf-region') || undefined,
    country,
  };
}

function fromUrlEncodedGeoHeaders(h: Headers): GeoInfo | null {
  const dec = (v: string | null) => {
    if (!v) return undefined;
    try { return decodeURIComponent(v); } catch { return v; }
  };
  const city = dec(h.get('x-vercel-ip-city'));
  const region = dec(h.get('x-vercel-ip-country-region'));
  const country = h.get('x-vercel-ip-country') || undefined;
  if (!city && !country) return null;
  return { city, region, country };
}

export function getGeo(req: Request): GeoInfo {
  const h = req.headers;
  return (
    fromBase64JsonGeoHeader(h) ??
    fromSeparateCountryHeaders(h) ??
    fromUrlEncodedGeoHeaders(h) ??
    {}
  );
}

export function geoLabel(g: GeoInfo): string {
  return [g.city, g.region, g.country].filter(Boolean).join(', ') || 'Unknown location';
}
