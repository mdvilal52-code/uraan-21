// Approximate request location from Vercel's edge geo headers (no external
// service needed). Used for location-based login alerts (#24).
export type GeoInfo = { city?: string; region?: string; country?: string };

export function getGeo(req: Request): GeoInfo {
  const h = req.headers;
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
