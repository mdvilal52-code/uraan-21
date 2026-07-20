// Approximate request location from the host's edge geo data (no external
// service needed). Used for location-based login alerts (#24). Netlify's CDN
// attaches a base64-encoded JSON blob (`x-nf-geo`) to every request; Vercel
// instead sends separate `x-vercel-ip-*` headers — both are checked so this
// keeps working if the site ever moves host again.
export type GeoInfo = { city?: string; region?: string; country?: string };

function fromNetlifyGeoHeader(h: Headers): GeoInfo | null {
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

export function getGeo(req: Request): GeoInfo {
  const h = req.headers;
  const netlify = fromNetlifyGeoHeader(h);
  if (netlify) return netlify;

  const dec = (v: string | null) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  return {
    city: dec(h.get('x-vercel-ip-city')),
    region: dec(h.get('x-vercel-ip-country-region')),
    country: h.get('x-vercel-ip-country') || undefined,
  };
}

export function geoLabel(g: GeoInfo): string {
  return [g.city, g.region, g.country].filter(Boolean).join(', ') || 'Unknown location';
}
