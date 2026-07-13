import { NextResponse } from 'next/server';
import { reverseGeocode } from '@/lib/geo/nominatim';

// GET /api/geo/reverse?lat=..&lon=.. → converts GPS coordinates into a postal
// address (country/state/city/area/street/pincode) for delivery address
// auto-fill. Proxied server-side so we can identify the app to Nominatim's
// free public API per its usage policy, instead of calling it from the browser.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ ok: false, error: 'Invalid coordinates.' }, { status: 400 });
  }

  try {
    const address = await reverseGeocode(lat, lon);
    if (!address) {
      return NextResponse.json({ ok: false, error: 'Could not determine an address for this location.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, address });
  } catch (err) {
    console.error('[geo/reverse]', err);
    return NextResponse.json({ ok: false, error: 'Location lookup failed. Please try again.' }, { status: 502 });
  }
}
