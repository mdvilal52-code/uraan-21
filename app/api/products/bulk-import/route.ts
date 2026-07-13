import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbBulkInsertProducts } from '@/lib/productsDb';
import type { Product } from '@/data/jewelleryData';
import { MAX_LEN, tooLong } from '@/lib/security/validate';
import { logAudit } from '@/lib/audit';
import { currentApiAdmin } from '@/lib/security/guard';

const MAX_ROWS = 500;
const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2 MB — generous for a 500-row product CSV.

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Hand-rolled CSV parser (no dependency): supports quoted fields containing
// commas / newlines, and "" as an escaped quote inside a quoted field.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let sawAny = false;
  const len = text.length;
  let i = 0;
  while (i < len) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      sawAny = true;
      i++;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      sawAny = true;
      i++;
      continue;
    }
    if (ch === '\r') {
      i++;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      sawAny = true;
      i++;
      continue;
    }
    field += ch;
    sawAny = true;
    i++;
  }
  if (field.length > 0 || row.length > 0 || sawAny) {
    row.push(field);
    rows.push(row);
  }
  // Drop fully blank trailing rows (common with a trailing newline).
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function truthy(value: string | undefined): boolean {
  if (value === undefined) return true; // default: in stock
  const v = value.trim().toLowerCase();
  return v === '' || v === 'true' || v === 'yes' || v === '1' || v === 'y';
}

const VALID_TAGS = new Set(['new', 'bestseller', 'sale', 'soldout']);

// Parses the CSV into Product objects. Rows missing a name or a valid price
// are skipped and counted as failed rather than aborting the whole import.
function rowsToProducts(rows: string[][]): { products: Product[]; failed: number } {
  if (rows.length === 0) return { products: [], failed: 0 };
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const dataRows = rows.slice(1);
  const idx = (name: string) => header.indexOf(name);

  const col = {
    name: idx('name'),
    slug: idx('slug'),
    category: idx('category'),
    price: idx('price'),
    oldPrice: idx('oldprice'),
    description: idx('description'),
    material: idx('material'),
    weight: idx('weight'),
    purity: idx('purity'),
    stockQuantity: idx('stockquantity'),
    sku: idx('sku'),
    tag: idx('tag'),
    inStock: idx('instock'),
  };

  const base = 'P' + Date.now().toString(36).toUpperCase();
  const products: Product[] = [];
  let failed = 0;

  dataRows.forEach((cells, i) => {
    const get = (colIdx: number): string | undefined => (colIdx >= 0 ? (cells[colIdx] ?? '').trim() : undefined);

    const name = get(col.name) || '';
    const priceRaw = get(col.price);
    const price = priceRaw !== undefined ? Number(priceRaw) : NaN;

    if (!name || tooLong(name, MAX_LEN.short) || !Number.isFinite(price) || price <= 0) {
      failed++;
      return;
    }

    const description = get(col.description) || '';
    const material = get(col.material) || '';
    const category = get(col.category) || 'necklaces';
    const slugSrc = get(col.slug) || name;
    if (
      tooLong(description, MAX_LEN.text) ||
      tooLong(material, MAX_LEN.short) ||
      tooLong(category, MAX_LEN.short) ||
      tooLong(slugSrc, MAX_LEN.short)
    ) {
      failed++;
      return;
    }

    const oldPriceRaw = get(col.oldPrice);
    const stockRaw = get(col.stockQuantity);
    const tagRaw = get(col.tag)?.toLowerCase();

    products.push({
      id: `${base}-${i}`,
      name,
      slug: slugify(slugSrc),
      category,
      price,
      oldPrice: oldPriceRaw ? Number(oldPriceRaw) || undefined : undefined,
      image: '',
      description,
      material,
      weight: get(col.weight) || undefined,
      purity: get(col.purity) || undefined,
      inStock: truthy(get(col.inStock)),
      rating: 5,
      reviewCount: 0,
      stockQuantity: stockRaw ? Number(stockRaw) || 0 : 0,
      lowStockThreshold: 5,
      sku: get(col.sku) || undefined,
      tag: tagRaw && VALID_TAGS.has(tagRaw) ? (tagRaw as Product['tag']) : undefined,
      status: 'published',
    });
  });

  return { products, failed };
}

// POST → bulk CSV import (admin only). Accepts either:
//   - application/json: { csv: string }
//   - multipart/form-data: a `file` field containing the CSV
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Connect a database (Supabase) to import products.' },
      { status: 400 }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_CSV_BYTES) {
    return NextResponse.json({ ok: false, error: 'File is too large.' }, { status: 413 });
  }

  const contentType = request.headers.get('content-type') || '';
  let csv: string;
  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: 'No CSV file provided.' }, { status: 400 });
      }
      csv = await file.text();
    } else {
      const body = await request.json();
      csv = String(body?.csv || '');
    }
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (!csv.trim()) {
    return NextResponse.json({ ok: false, error: 'CSV file is empty.' }, { status: 400 });
  }
  if (csv.length > MAX_CSV_BYTES) {
    return NextResponse.json({ ok: false, error: 'File is too large.' }, { status: 413 });
  }

  const rows = parseCsv(csv);
  const dataRowCount = Math.max(0, rows.length - 1);
  if (dataRowCount > MAX_ROWS) {
    return NextResponse.json(
      { ok: false, error: `Too many rows (${dataRowCount}). Please import at most ${MAX_ROWS} products at a time.` },
      { status: 400 }
    );
  }
  if (dataRowCount === 0) {
    return NextResponse.json({ ok: false, error: 'No data rows found in the CSV.' }, { status: 400 });
  }

  const { products, failed: parseFailed } = rowsToProducts(rows);
  if (products.length === 0) {
    return NextResponse.json({ ok: false, error: 'No valid rows to import (name and price are required).' }, { status: 400 });
  }

  const result = await dbBulkInsertProducts(products);
  const inserted = result.inserted;
  const failed = result.failed + parseFailed;

  const admin = await currentApiAdmin();
  await logAudit({ actorEmail: admin?.email, actorRole: admin?.role, action: 'product_bulk_imported', metadata: { count: inserted } });

  return NextResponse.json({ ok: true, inserted, failed });
}
