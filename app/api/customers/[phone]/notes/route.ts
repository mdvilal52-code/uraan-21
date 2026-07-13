import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbAddCustomerNote, dbGetCustomerNotes } from '@/lib/customerNotesDb';
import { currentApiAdmin } from '@/lib/security/guard';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';

// GET → notes left on a customer (admin only).
export async function GET(_request: Request, { params }: { params: { phone: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, notes: [] });
  }
  const phone = decodeURIComponent(params.phone || '');
  const notes = await dbGetCustomerNotes(phone);
  return NextResponse.json({ ok: true, configured: true, notes: notes || [] });
}

// POST → add a note to a customer (admin only).
export async function POST(request: Request, { params }: { params: { phone: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  const note = String(body.note || '').trim();
  if (!note) {
    return NextResponse.json({ ok: false, error: 'Note is required.' }, { status: 400 });
  }
  const lengthError = checkLengths({ Note: { value: note, max: MAX_LEN.text } });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }
  const phone = decodeURIComponent(params.phone || '');
  const admin = await currentApiAdmin();
  const saved = await dbAddCustomerNote(phone, note, admin?.email);
  if (!saved) {
    return NextResponse.json({ ok: false, error: 'Could not save note.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, configured: true, note: saved });
}
