import { NextResponse } from 'next/server';
import { dbUpdateBanner, dbDeleteBanner } from '@/lib/bannersDb';
import { isAdminRequest } from '@/lib/adminApi';
import type { Banner, BannerPosition } from '@/lib/banners';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// PATCH → edit a banner or toggle its active flag (admin only).
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
  const patch: Partial<Banner> = {};
  if (body.title !== undefined) patch.title = String(body.title);
  if (body.subtitle !== undefined) patch.subtitle = String(body.subtitle);
  if (body.image !== undefined) patch.image = String(body.image);
  if (body.ctaText !== undefined) patch.ctaText = String(body.ctaText);
  if (body.ctaLink !== undefined) patch.ctaLink = String(body.ctaLink);

  const lengthError = checkLengths({
    Title: { value: patch.title ?? '', max: MAX_LEN.short },
    Subtitle: { value: patch.subtitle ?? '', max: MAX_LEN.text },
    Image: { value: patch.image ?? '', max: MAX_LEN.url },
    'CTA text': { value: patch.ctaText ?? '', max: MAX_LEN.short },
    'CTA link': { value: patch.ctaLink ?? '', max: MAX_LEN.url },
  });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  if (body.position !== undefined) {
    const pos = String(body.position);
    patch.position = (['hero', 'middle', 'footer'].includes(pos) ? pos : 'hero') as BannerPosition;
  }
  if (body.active !== undefined) patch.active = Boolean(body.active);

  const ok = await dbUpdateBanner(params.id, patch);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update banner.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// DELETE → remove a banner (admin only).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const ok = await dbDeleteBanner(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not delete banner.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
