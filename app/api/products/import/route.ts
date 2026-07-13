import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isAdminRequest } from '@/lib/adminApi';
import { dbCountProducts, dbImportSeed } from '@/lib/productsDb';

// POST → import the bundled catalogue into the database (admin only). No-op if
// the catalogue already has products, so it can't create duplicates.
export async function POST() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, configured: false, error: 'Connect a database (Supabase) first.' },
      { status: 400 }
    );
  }

  const count = await dbCountProducts();
  if (count && count > 0) {
    return NextResponse.json({ ok: true, imported: 0, message: 'Catalogue already has products.' });
  }

  const imported = await dbImportSeed();
  return NextResponse.json({ ok: true, imported });
}
