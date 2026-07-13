import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetProducts, dbGetDeletedProducts, dbInsertProduct } from '@/lib/productsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { products as seed, type Product } from '@/data/jewelleryData';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';
import { logAudit } from '@/lib/audit';
import { currentApiAdmin } from '@/lib/security/guard';

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// GET → public product list. Database when configured, else the bundled
// catalogue. (Storefront keeps the bundled catalogue if the DB is empty.)
// Admin-only query params:
//   ?deleted=1        → only soft-deleted products (for the admin "Deleted" tab)
//   ?includeDeleted=1 → active + soft-deleted products
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wantDeletedOnly = searchParams.get('deleted') === '1';
  const wantIncludeDeleted = searchParams.get('includeDeleted') === '1';

  if ((wantDeletedOnly || wantIncludeDeleted) && !(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, products: wantDeletedOnly ? [] : seed });
  }

  if (wantDeletedOnly) {
    const deleted = await dbGetDeletedProducts();
    return NextResponse.json({ ok: true, configured: true, products: deleted || [] });
  }

  const products = await dbGetProducts({ includeDeleted: wantIncludeDeleted });
  return NextResponse.json({ ok: true, configured: true, products: products || [] });
}

// POST → create a product (admin only).
export async function POST(request: Request) {
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

  if (!body.name || !body.price) {
    return NextResponse.json({ ok: false, error: 'Name and price are required.' }, { status: 400 });
  }
  const lengthError = checkLengths({
    Name: { value: String(body.name), max: MAX_LEN.short },
    Slug: { value: String(body.slug ?? ''), max: MAX_LEN.short },
    Category: { value: String(body.category ?? ''), max: MAX_LEN.short },
    Description: { value: String(body.description ?? ''), max: MAX_LEN.text },
    Material: { value: String(body.material ?? ''), max: MAX_LEN.short },
    SKU: { value: String(body.sku ?? ''), max: MAX_LEN.short },
    Barcode: { value: String(body.barcode ?? ''), max: MAX_LEN.short },
    'SEO title': { value: String(body.seoTitle ?? ''), max: MAX_LEN.short },
    'SEO description': { value: String(body.seoDescription ?? ''), max: MAX_LEN.text },
  });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  const product: Product = {
    id: body.id || 'P' + Date.now().toString(36).toUpperCase(),
    name: body.name,
    slug: body.slug ? slugify(body.slug) : slugify(body.name),
    category: body.category || 'necklaces',
    price: Number(body.price),
    oldPrice: body.oldPrice ? Number(body.oldPrice) : undefined,
    image: body.image || '',
    images: body.images || undefined,
    description: body.description || '',
    tag: body.tag || undefined,
    material: body.material || '',
    weight: body.weight || undefined,
    purity: body.purity || undefined,
    inStock: body.inStock ?? true,
    rating: body.rating ?? 5,
    reviewCount: body.reviewCount ?? 0,
    stockQuantity: body.stockQuantity !== undefined ? Number(body.stockQuantity) : 0,
    lowStockThreshold: body.lowStockThreshold !== undefined ? Number(body.lowStockThreshold) : 5,
    altTexts: body.altTexts || undefined,
    variants: body.variants || undefined,
    seoTitle: body.seoTitle || undefined,
    seoDescription: body.seoDescription || undefined,
    makingCharge: body.makingCharge !== undefined && body.makingCharge !== null ? Number(body.makingCharge) : undefined,
    useDynamicPricing: body.useDynamicPricing ?? false,
    sku: body.sku || undefined,
    barcode: body.barcode || undefined,
    status: body.status === 'draft' ? 'draft' : 'published',
    featured: body.featured ?? false,
    trending: body.trending ?? false,
  };

  const result = await dbInsertProduct(product);
  if (!result.data) {
    return NextResponse.json({ ok: false, error: result.error || 'Could not save product.' }, { status: 502 });
  }
  const saved = result.data;

  const admin = await currentApiAdmin();
  await logAudit({ actorEmail: admin?.email, actorRole: admin?.role, action: 'product_created', target: saved.id, metadata: { name: saved.name } });

  return NextResponse.json({ ok: true, configured: true, product: saved });
}
