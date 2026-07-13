import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetCategories, dbInsertCategory } from '@/lib/categoriesDb';
import { requireRole } from '@/lib/security/guard';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// GET → public category list. Database when configured, else the page falls
// back to the bundled list in the browser store.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, categories: [] });
  }
  const categories = await dbGetCategories();
  if (categories === null) {
    // Configured but the table is missing (run supabase/schema.sql) — let the
    // client fall back to its bundled store instead of showing an empty list.
    return NextResponse.json({ ok: true, configured: false, categories: [] });
  }
  return NextResponse.json({ ok: true, configured: true, categories });
}

// POST → create a category (admin only).
export async function POST(request: Request) {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ ok: false, error: 'Name is required.' }, { status: 400 });

  const description = String(body.description || '').trim();
  const image = String(body.image || '').trim();
  const lengthError = checkLengths({
    Name: { value: name, max: MAX_LEN.short },
    Description: { value: description, max: MAX_LEN.text },
    Image: { value: image, max: MAX_LEN.url },
  });
  if (lengthError) return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });

  const category = await dbInsertCategory({
    name,
    description: description || undefined,
    image: image || undefined,
  });
  if (!category) return NextResponse.json({ ok: false, error: 'Could not save category.' }, { status: 502 });
  return NextResponse.json({ ok: true, configured: true, category });
}
