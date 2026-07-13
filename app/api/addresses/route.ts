import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetAddresses, dbInsertAddress } from '@/lib/addressesDb';
import { validateAddress, type AddressInput, type AddressType } from '@/lib/addresses';
import { normalizePhone } from '@/lib/phone';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_TYPES: AddressType[] = ['Home', 'Work', 'Other'];

// GET /api/addresses?email=... → list saved addresses for that email.
// POST /api/addresses → create one. Neither route has a real authenticated
// session to check (see schema.sql's comment on user_addresses) — the email
// itself is the authorization boundary, matching every other customer-facing
// table in this app (orders, leads, abandoned_carts).
export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, addresses: [] });
  }
  const addresses = await dbGetAddresses(email);
  return NextResponse.json({ ok: true, configured: true, addresses: addresses || [] });
}

export async function POST(request: Request) {
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 });
  }

  const mobile = normalizePhone(String(body.mobile || ''));
  if (!mobile) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid mobile number.' }, { status: 400 });
  }
  const rawAltMobile = String(body.alternateMobile || '').trim();
  const alternateMobile = rawAltMobile ? normalizePhone(rawAltMobile) : null;
  if (rawAltMobile && !alternateMobile) {
    return NextResponse.json({ ok: false, error: 'Please enter a valid alternate mobile number.' }, { status: 400 });
  }

  const addressType = ADDRESS_TYPES.includes(body.addressType as AddressType)
    ? (body.addressType as AddressType)
    : 'Home';

  const input: AddressInput = {
    fullName: String(body.fullName || '').trim(),
    mobile,
    alternateMobile: alternateMobile || undefined,
    houseNo: String(body.houseNo || '').trim(),
    street: String(body.street || '').trim(),
    landmark: String(body.landmark || '').trim() || undefined,
    city: String(body.city || '').trim(),
    state: String(body.state || '').trim(),
    pincode: String(body.pincode || '').trim(),
    country: String(body.country || 'India').trim() || 'India',
    addressType,
    isDefault: Boolean(body.isDefault),
  };

  const validationError = validateAddress(input);
  if (validationError) {
    return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
  }
  const lengthError = checkLengths({
    'Full name': { value: input.fullName, max: MAX_LEN.short },
    'House / Flat No': { value: input.houseNo, max: MAX_LEN.short },
    'Street / Area': { value: input.street, max: MAX_LEN.text },
    Landmark: { value: input.landmark || '', max: MAX_LEN.short },
    City: { value: input.city, max: MAX_LEN.short },
    State: { value: input.state, max: MAX_LEN.short },
    Country: { value: input.country, max: MAX_LEN.short },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Address storage is not configured yet.' }, { status: 503 });
  }

  const address = await dbInsertAddress(email, input);
  if (!address) {
    return NextResponse.json({ ok: false, error: 'Could not save address.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, address });
}
