import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbUpdateAddress, dbDeleteAddress } from '@/lib/addressesDb';
import { validateAddress, type AddressInput, type AddressType } from '@/lib/addresses';
import { normalizePhone } from '@/lib/phone';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ADDRESS_TYPES: AddressType[] = ['Home', 'Work', 'Other'];

// PATCH /api/addresses/:id → full replace (the client always submits the
// complete address, including for a "Set as Default" quick action — it
// already has the row in state). email in the body is the ownership check:
// a caller can only ever update a row for the email it claims (see
// schema.sql's comment on user_addresses for why there's no real session).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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

  const address = await dbUpdateAddress(params.id, email, input);
  if (!address) {
    return NextResponse.json({ ok: false, error: 'Address not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, address });
}

// DELETE /api/addresses/:id?email=... → same ownership check as PATCH.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase() || '';
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'A valid email is required.' }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Address storage is not configured yet.' }, { status: 503 });
  }
  const deleted = await dbDeleteAddress(params.id, email);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: 'Address not found.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
