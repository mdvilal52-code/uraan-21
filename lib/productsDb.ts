// Server-side product catalogue persistence (Supabase). Returns null / false
// when the DB is not configured so callers fall back to the bundled catalogue.
import { getSupabase } from './supabase';
import { products as seedProducts, type Product, type ProductVariant } from '@/data/jewelleryData';

type Row = {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  price: number;
  old_price: number | null;
  image: string | null;
  images: string[] | null;
  description: string | null;
  material: string | null;
  weight: string | null;
  purity: string | null;
  tag: string | null;
  in_stock: boolean;
  rating: number | null;
  review_count: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  alt_texts: string[] | null;
  variants: ProductVariant[] | null;
  seo_title: string | null;
  seo_description: string | null;
  making_charge: number | null;
  use_dynamic_pricing: boolean | null;
  sku: string | null;
  barcode: string | null;
  status: string | null;
  featured: boolean | null;
  trending: boolean | null;
  deleted_at: string | null;
};

function toProduct(r: Row): Product {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug || r.id,
    category: r.category || '',
    price: r.price,
    oldPrice: r.old_price ?? undefined,
    image: r.image || '',
    images: r.images && r.images.length ? r.images : undefined,
    description: r.description || '',
    tag: (r.tag as Product['tag']) || undefined,
    material: r.material || '',
    weight: r.weight || undefined,
    purity: r.purity || undefined,
    inStock: r.in_stock,
    rating: r.rating ?? 5,
    reviewCount: r.review_count ?? 0,
    stockQuantity: r.stock_quantity ?? 0,
    lowStockThreshold: r.low_stock_threshold ?? 5,
    altTexts: r.alt_texts && r.alt_texts.length ? r.alt_texts : undefined,
    variants: r.variants && r.variants.length ? r.variants : undefined,
    seoTitle: r.seo_title || undefined,
    seoDescription: r.seo_description || undefined,
    makingCharge: r.making_charge ?? undefined,
    useDynamicPricing: r.use_dynamic_pricing ?? false,
    sku: r.sku || undefined,
    barcode: r.barcode || undefined,
    status: (r.status as Product['status']) || undefined,
    featured: r.featured ?? false,
    trending: r.trending ?? false,
    deletedAt: r.deleted_at || undefined,
  };
}

function fullRow(p: Product) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug || p.id,
    category: p.category || null,
    price: Math.round(p.price),
    old_price: p.oldPrice ? Math.round(p.oldPrice) : null,
    image: p.image || null,
    images: p.images || [],
    description: p.description || null,
    material: p.material || null,
    weight: p.weight || null,
    purity: p.purity || null,
    tag: p.tag || null,
    in_stock: p.inStock,
    rating: p.rating ?? 5,
    review_count: p.reviewCount ?? 0,
    stock_quantity: p.stockQuantity ?? 0,
    low_stock_threshold: p.lowStockThreshold ?? 5,
    alt_texts: p.altTexts || [],
    variants: p.variants || [],
    seo_title: p.seoTitle || null,
    seo_description: p.seoDescription || null,
    making_charge: p.makingCharge ?? null,
    use_dynamic_pricing: p.useDynamicPricing ?? false,
    sku: p.sku || null,
    barcode: p.barcode || null,
    status: p.status || 'published',
    featured: p.featured ?? false,
    trending: p.trending ?? false,
  };
}

// Parses a free-text weight field like "24g" or "24 g" into grams. Returns 0
// when it can't be parsed so dynamic pricing degrades to just the making
// charge rather than throwing.
function parseGrams(weight: string | undefined): number {
  if (!weight) return 0;
  const n = parseFloat(weight);
  return Number.isFinite(n) ? n : 0;
}

export function computeDynamicPrice(p: Product, goldRatePerGram: number): number {
  const grams = parseGrams(p.weight);
  return Math.round(grams * goldRatePerGram + (p.makingCharge || 0));
}

// Overrides `price` with the live gold-rate calculation for any product that
// opted into dynamic pricing, leaving the stored `price` column untouched in
// the DB (it's kept as a fallback/MRP-like base). Only fetches the gold rate
// when at least one product actually needs it.
async function withDynamicPricing(list: Product[]): Promise<Product[]> {
  if (!list.some((p) => p.useDynamicPricing)) return list;
  const rate = await dbGetGoldRate();
  return list.map((p) => (p.useDynamicPricing ? { ...p, price: computeDynamicPrice(p, rate) } : p));
}

// GET → active (non-deleted) products by default. Pass includeDeleted to also
// return soft-deleted rows (used by the admin "Deleted" tab, alongside
// dbGetDeletedProducts() which returns ONLY the deleted ones).
export async function dbGetProducts(opts: { includeDeleted?: boolean } = {}): Promise<Product[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  let query = sb.from('products').select('*').order('created_at', { ascending: true });
  if (!opts.includeDeleted) query = query.is('deleted_at', null);
  const { data, error } = await query;
  if (error) {
    console.error('[productsDb] list:', error.message);
    return null;
  }
  const list = (data as Row[]).map(toProduct);
  return withDynamicPricing(list);
}

// Looks up specific products by id (checkout/payment server-side pricing —
// never trust a client-supplied price/name, always re-derive from here).
// Soft-deleted and draft products are excluded so they can't be "bought".
export async function dbGetProductsByIds(ids: string[]): Promise<Product[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  if (!ids.length) return [];
  const { data, error } = await sb.from('products').select('*').in('id', ids).is('deleted_at', null);
  if (error) {
    console.error('[productsDb] listByIds:', error.message);
    return null;
  }
  const list = (data as Row[]).map(toProduct).filter((p) => p.status !== 'draft');
  return withDynamicPricing(list);
}

export async function dbGetDeletedProducts(): Promise<Product[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('products')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) {
    console.error('[productsDb] listDeleted:', error.message);
    return null;
  }
  return (data as Row[]).map(toProduct);
}

export async function dbInsertProduct(p: Product): Promise<{ data: Product; error?: never } | { data: null; error: string }> {
  const sb = getSupabase();
  if (!sb) return { data: null, error: 'Database not configured.' };
  const row = fullRow(p);
  let { data, error } = await sb.from('products').insert(row).select().single();
  // Slug unique-constraint violation → retry once with a disambiguating suffix.
  if (error?.code === '23505' && error.message.includes('slug')) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const retried = await sb.from('products').insert({ ...row, slug: `${row.slug}-${suffix}` }).select().single();
    data = retried.data;
    error = retried.error;
  }
  if (error) {
    console.error('[productsDb] insert:', error.message);
    return { data: null, error: error.message };
  }
  return { data: toProduct(data as Row) };
}

// Only the provided fields are updated, so rating / reviews / images set
// elsewhere are preserved when the admin form doesn't include them.
export async function dbUpdateProduct(id: string, p: Partial<Product>): Promise<{ ok: true } | { ok: false; error: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: 'Database not configured.' };
  const patch: Record<string, unknown> = {};
  if (p.name !== undefined) patch.name = p.name;
  if (p.slug !== undefined) patch.slug = p.slug;
  if (p.category !== undefined) patch.category = p.category;
  if (p.price !== undefined) patch.price = Math.round(p.price);
  if (p.oldPrice !== undefined) patch.old_price = p.oldPrice ? Math.round(p.oldPrice) : null;
  if (p.image !== undefined) patch.image = p.image;
  if (p.images !== undefined) patch.images = p.images;
  if (p.description !== undefined) patch.description = p.description;
  if (p.material !== undefined) patch.material = p.material;
  if (p.weight !== undefined) patch.weight = p.weight || null;
  if (p.purity !== undefined) patch.purity = p.purity || null;
  if (p.tag !== undefined) patch.tag = p.tag || null;
  if (p.inStock !== undefined) patch.in_stock = p.inStock;
  if (p.rating !== undefined) patch.rating = p.rating;
  if (p.reviewCount !== undefined) patch.review_count = p.reviewCount;
  if (p.stockQuantity !== undefined) patch.stock_quantity = p.stockQuantity;
  if (p.lowStockThreshold !== undefined) patch.low_stock_threshold = p.lowStockThreshold;
  if (p.altTexts !== undefined) patch.alt_texts = p.altTexts;
  if (p.variants !== undefined) patch.variants = p.variants;
  if (p.seoTitle !== undefined) patch.seo_title = p.seoTitle || null;
  if (p.seoDescription !== undefined) patch.seo_description = p.seoDescription || null;
  if (p.makingCharge !== undefined) patch.making_charge = p.makingCharge ?? null;
  if (p.useDynamicPricing !== undefined) patch.use_dynamic_pricing = p.useDynamicPricing;
  if (p.sku !== undefined) patch.sku = p.sku || null;
  if (p.barcode !== undefined) patch.barcode = p.barcode || null;
  if (p.status !== undefined) patch.status = p.status || 'published';
  if (p.featured !== undefined) patch.featured = p.featured;
  if (p.trending !== undefined) patch.trending = p.trending;

  const { error } = await sb.from('products').update(patch).eq('id', id);
  if (error) {
    console.error('[productsDb] update:', error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Hard delete — kept for completeness, but the admin UI now uses
// dbSoftDeleteProduct so products can be restored.
export async function dbDeleteProduct(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) {
    console.error('[productsDb] delete:', error.message);
    return false;
  }
  return true;
}

export async function dbSoftDeleteProduct(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  if (error) {
    console.error('[productsDb] softDelete:', error.message);
    return false;
  }
  return true;
}

export async function dbRestoreProduct(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('products').update({ deleted_at: null }).eq('id', id);
  if (error) {
    console.error('[productsDb] restore:', error.message);
    return false;
  }
  return true;
}

export async function dbCountProducts(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { count, error } = await sb.from('products').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('[productsDb] count:', error.message);
    return null;
  }
  return count ?? 0;
}

// One-click import of the bundled catalogue into the database.
export async function dbImportSeed(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;
  const rows = seedProducts.map(fullRow);
  const { error } = await sb.from('products').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('[productsDb] import:', error.message);
    return 0;
  }
  return rows.length;
}

// Bulk CSV import — upserts by id, so re-importing the same file updates
// existing rows instead of duplicating them.
export async function dbBulkInsertProducts(products: Product[]): Promise<{ inserted: number; failed: number }> {
  const sb = getSupabase();
  if (!sb) return { inserted: 0, failed: products.length };
  if (products.length === 0) return { inserted: 0, failed: 0 };
  const rows = products.map(fullRow);
  const { error } = await sb.from('products').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('[productsDb] bulkInsert:', error.message);
    return { inserted: 0, failed: products.length };
  }
  return { inserted: rows.length, failed: 0 };
}

// Manual stock correction: adjusts stock_quantity (clamped at 0) and records
// the adjustment in inventory_logs for an audit trail. Returns the resulting
// stock/threshold/name so the caller can decide whether to raise a
// low-stock/out-of-stock notification — this comparison didn't exist before.
export async function dbAdjustStock(
  productId: string,
  delta: number,
  reason: string | undefined,
  createdBy: string | undefined
): Promise<{ stock: number; threshold: number; name: string } | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: row, error: fetchError } = await sb
    .from('products')
    .select('stock_quantity, low_stock_threshold, name')
    .eq('id', productId)
    .single();
  if (fetchError || !row) {
    console.error('[productsDb] adjustStock fetch:', fetchError?.message);
    return null;
  }
  const current = row as { stock_quantity: number | null; low_stock_threshold: number | null; name: string };
  const next = Math.max(0, (current.stock_quantity ?? 0) + delta);
  const { error } = await sb.from('products').update({ stock_quantity: next }).eq('id', productId);
  if (error) {
    console.error('[productsDb] adjustStock update:', error.message);
    return null;
  }
  const { error: logError } = await sb.from('inventory_logs').insert({
    product_id: productId,
    delta,
    reason: reason || null,
    created_by: createdBy || null,
  });
  if (logError) {
    // Stock already updated successfully; the log is best-effort.
    console.error('[productsDb] adjustStock log:', logError.message);
  }
  return { stock: next, threshold: current.low_stock_threshold ?? 5, name: current.name };
}

const DEFAULT_GOLD_RATE = 7000;

export async function dbGetGoldRate(): Promise<number> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_GOLD_RATE;
  const { data, error } = await sb
    .from('store_settings')
    .select('value')
    .eq('key', 'gold_rate_per_gram')
    .single();
  if (error || !data) {
    if (error) console.error('[productsDb] getGoldRate:', error.message);
    return DEFAULT_GOLD_RATE;
  }
  const rate = Number(data.value);
  return Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_GOLD_RATE;
}

export async function dbSetGoldRate(rate: number): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('store_settings')
    .upsert({ key: 'gold_rate_per_gram', value: rate, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) {
    console.error('[productsDb] setGoldRate:', error.message);
    return false;
  }
  return true;
}
