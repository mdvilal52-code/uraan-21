import { NextResponse } from 'next/server';
import { dbUpdateProduct, dbSoftDeleteProduct } from '@/lib/productsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { Product } from '@/data/jewelleryData';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';
import { logAudit } from '@/lib/audit';
import { currentApiAdmin } from '@/lib/security/guard';

// PATCH → update a product (admin only).
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Connect a database (Supabase) to save products.' },
      { status: 400 }
    );
  }

  let body: Partial<Product>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const lengthError = checkLengths({
    Name: { value: body.name ?? '', max: MAX_LEN.short },
    Slug: { value: body.slug ?? '', max: MAX_LEN.short },
    Category: { value: body.category ?? '', max: MAX_LEN.short },
    Description: { value: body.description ?? '', max: MAX_LEN.text },
    Material: { value: body.material ?? '', max: MAX_LEN.short },
    SKU: { value: body.sku ?? '', max: MAX_LEN.short },
    Barcode: { value: body.barcode ?? '', max: MAX_LEN.short },
    'SEO title': { value: body.seoTitle ?? '', max: MAX_LEN.short },
    'SEO description': { value: body.seoDescription ?? '', max: MAX_LEN.text },
  });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  const result = await dbUpdateProduct(params.id, body);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || 'Could not update product.' }, { status: 502 });
  }

  const admin = await currentApiAdmin();
  await logAudit({ actorEmail: admin?.email, actorRole: admin?.role, action: 'product_updated', target: params.id, metadata: { fields: Object.keys(body) } });

  return NextResponse.json({ ok: true });
}

// DELETE → soft-delete a product (admin only). The row is kept with
// deleted_at set so it can be restored from the admin "Deleted" tab.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const ok = await dbSoftDeleteProduct(params.id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not delete product.' }, { status: 502 });
  }

  const admin = await currentApiAdmin();
  await logAudit({ actorEmail: admin?.email, actorRole: admin?.role, action: 'product_deleted', target: params.id });

  return NextResponse.json({ ok: true });
}
