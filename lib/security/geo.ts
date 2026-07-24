// Approximate request location from the host's edge geo data (no external
// service needed). Used for location-based login alerts. Multiple CDN/hosting
// providers are checked in order so the function works across any platform:
//   - Netlify: x-nf-geo (base64 JSON blob)
//   - Cloudflare: cf-ipcountry, cf-ipcity, cf-region
//   - Vercel: x-vercel-ip-city / x-vercel-ip-country-region / x-vercel-ip-country
//   - Generic: x-real-ip based (city/region not available, country only)
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

function fromCloudflareHeaders(h: Headers): GeoInfo | null {
  const country = h.get('cf-ipcountry');
  if (!country || country === 'XX') return null;
  return {
    city: h.get('cf-ipcity') || undefined,
    region: h.get('cf-region') || undefined,
    country,
  };
}

export function getGeo(req: Request): GeoInfo {
  const h = req.headers;

  const netlify = fromNetlifyGeoHeader(h);
  if (netlify) return netlify;

  const cloudflare = fromCloudflareHeaders(h);
  if (cloudflare) return cloudflare;

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
  if (vercelCity || vercelCountry) {
    return { city: vercelCity, region: vercelRegion, country: vercelCountry };
  }

  return {};
}

export function geoLabel(g: GeoInfo): string {
  return [g.city, g.region, g.country].filter(Boolean).join(', ') || 'Unknown location';
}
