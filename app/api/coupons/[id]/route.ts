import { NextResponse } from 'next/server';
import { dbUpdateCoupon, dbDeleteCoupon } from '@/lib/couponsDb';
import { isAdminRequest } from '@/lib/adminApi';
import type { Coupon, CouponType } from '@/lib/coupons';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// PATCH → edit a coupon or toggle its active flag (admin only).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const patch: Partial<Coupon> = {};
  if (body.code !== undefined) patch.code = String(body.code);
  if (body.type !== undefined) patch.type = (String(body.type) === 'flat' ? 'flat' : 'percent') as CouponType;
  if (body.value !== undefined) patch.value = Number(body.value);
  if (body.minOrder !== undefined) patch.minOrder = Number(body.minOrder);
  if (body.usageLimit !== undefined) patch.usageLimit = Number(body.usageLimit);
  if (body.used !== undefined) patch.used = Number(body.used);
  if (body.validUntil !== undefined) patch.validUntil = String(body.validUntil);
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.firstOrderOnly !== undefined) patch.firstOrderOnly = Boolean(body.firstOrderOnly);
  if (body.category !== undefined) patch.category = String(body.category || '').trim() || undefined;

  const lengthError = checkLengths({
    Code: { value: patch.code ?? '', max: MAX_LEN.short },
    'Valid until': { value: patch.validUntil ?? '', max: MAX_LEN.short },
    Category: { value: patch.category ?? '', max: MAX_LEN.short },
  });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  const ok = await dbUpdateCoupon(params.id, patch);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update coupon.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// DELETE → remove a coupon (admin only).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const ok = await dbDeleteCoupon(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not delete coupon.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
