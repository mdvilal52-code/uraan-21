// Server-only OpenStreetMap Nominatim client. Calls go through our own API
// routes (never straight from the browser) so we can set a proper
// identifying User-Agent, as Nominatim's usage policy requires, and keep a
// single choke point for the "please don't hammer us" rate limit.
// https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'OmGauriPutraJewellery/1.0 (checkout address lookup)';

export type GeoAddress = {
  line1: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  displayName: string;
  lat: number;
  lon: number;
};

type NominatimAddress = {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
  'ISO3166-2-lvl4'?: string;
};

// Nominatim sometimes omits `address.state` for India's union territories
// (Delhi, Chandigarh, ...) even though it always includes the ISO subdivision
// code — this fills the gap for the country this storefront actually ships in.
const IN_ISO_STATE: Record<string, string> = {
  'IN-DL': 'Delhi',
  'IN-CH': 'Chandigarh',
  'IN-PY': 'Puducherry',
  'IN-AN': 'Andaman and Nicobar Islands',
  'IN-DN': 'Dadra and Nagar Haveli and Daman and Diu',
  'IN-JK': 'Jammu and Kashmir',
  'IN-LA': 'Ladakh',
  'IN-LD': 'Lakshadweep',
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

function toGeoAddress(r: NominatimResult): GeoAddress {
  const a = r.address || {};
  const line1 = [a.house_number, a.road].filter(Boolean).join(' ') || a.neighbourhood || a.suburb || '';
  const area = a.suburb || a.quarter || a.neighbourhood || a.city_district || '';
  const city = a.city || a.town || a.village || a.county || '';
  const isoState = a['ISO3166-2-lvl4'] ? IN_ISO_STATE[a['ISO3166-2-lvl4']] : undefined;
  const state = a.state || a.state_district || isoState || '';
  return {
    line1,
    area,
    city,
    state,
    pincode: a.postcode || '',
    country: a.country || '',
    displayName: r.display_name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  };
}

async function nominatimFetch(path: string): Promise<Response> {
  return fetch(`${NOMINATIM_BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
    // Nominatim responses for a given coordinate/query don't change minute to
    // minute — a short cache takes real load off their free public instance.
    next: { revalidate: 300 },
  });
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoAddress | null> {
  const res = await nominatimFetch(
    `/reverse?lat=${lat}&lon=${lon}&format=jsonv2&addressdetails=1&zoom=18`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimResult | { error: string };
  if ('error' in data) return null;
  return toGeoAddress(data);
}

export async function searchAddress(query: string): Promise<GeoAddress[]> {
  const res = await nominatimFetch(
    `/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=6&countrycodes=in`
  );
  if (!res.ok) return [];
  const data = (await res.json()) as NominatimResult[];
  return data.map(toGeoAddress);
}
