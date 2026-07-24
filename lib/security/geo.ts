// Approximate request location from the host's edge geo data (no external
// service needed). Used for location-based login alerts (#24).
// Supports Cloudflare (cf-ipcountry), Netlify (x-nf-geo), and Vercel
// (x-vercel-ip-*) headers so the site keeps working across hosting providers.
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

  // Netlify: base64-encoded JSON blob
  const netlify = fromNetlifyGeoHeader(h);
  if (netlify) return netlify;

  // Vercel: separate headers
  const dec = (v: string | null) => {
    if (!v) return undefined;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  };
  const vercelCity = dec(h.get('x-vercel-ip-city'));
  const vercelRegion = dec(h.get('x-vercel-ip-country-region'));
  const vercelCountry = h.get('x-vercel-ip-country') || undefined;
  if (vercelCity || vercelRegion || vercelCountry) {
    return { city: vercelCity, region: vercelRegion, country: vercelCountry };
  }

  // Cloudflare: two-letter country code only
  const cfCountry = h.get('cf-ipcountry') || undefined;
  if (cfCountry && cfCountry !== 'XX') {
    return { country: cfCountry };
  }

  return {};
}

export function geoLabel(g: GeoInfo): string {
  return [g.city, g.region, g.country].filter(Boolean).join(', ') || 'Unknown location';
}
