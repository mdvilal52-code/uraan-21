import { NextResponse } from 'next/server';
import { searchAddress } from '@/lib/geo/nominatim';
import { MAX_LEN } from '@/lib/security/validate';

// GET /api/geo/search?q=.. → address/city/pincode/landmark suggestions for the
// checkout location search box. Proxied server-side (see api/geo/reverse).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (q.length < 3) {
    return NextResponse.json({ ok: true, results: [] });
  }
  if (q.length > MAX_LEN.short) {
    return NextResponse.json({ ok: false, error: 'Search text is too long.' }, { status: 400 });
  }

  try {
    const results = await searchAddress(q);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[geo/search]', err);
    return NextResponse.json({ ok: false, error: 'Search failed. Please try again.' }, { status: 502 });
  }
}
