import { NextResponse } from 'next/server';
import { dbUpdateCategory, dbDeleteCategory } from '@/lib/categoriesDb';
import { requireRole } from '@/lib/security/guard';
import type { Category } from '@/lib/categories';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// PATCH → edit a category (admin only).
export async function PATCH(request: Request, { params }: { params: { slug: string } }) {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const patch: Partial<Category> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.description !== undefined) patch.description = String(body.description).trim();
  if (body.image !== undefined) patch.image = String(body.image).trim();
  if (body.count !== undefined) patch.count = Number(body.count);

  const lengthError = checkLengths({
    Name: { value: patch.name ?? '', max: MAX_LEN.short },
    Description: { value: patch.description ?? '', max: MAX_LEN.text },
    Image: { value: patch.image ?? '', max: MAX_LEN.url },
  });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  const ok = await dbUpdateCategory(params.slug, patch);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update category.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// DELETE → remove a category (admin only).
export async function DELETE(_request: Request, { params }: { params: { slug: string } }) {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;
  const ok = await dbDeleteCategory(params.slug);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not delete category.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
