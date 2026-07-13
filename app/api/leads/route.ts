import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetLeads, dbInsertLead } from '@/lib/leadsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { checkLengths, MAX_LEN } from '@/lib/security/validate';
import { normalizePhone } from '@/lib/phone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET → list leads from the database (admin CRM only — contains customer PII).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, leads: [] });
  }
  const leads = await dbGetLeads();
  return NextResponse.json({ ok: true, configured: true, leads: leads || [] });
}

// POST → create a lead (manual add from the CRM, admin only). Public website
// enquiries use /api/lead (singular), which stays open for the contact form.
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();

  if (!name) return NextResponse.json({ ok: false, error: 'Name is required.' }, { status: 400 });
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Valid email is required.' }, { status: 400 });
  }

  const rawPhone = String(body.phone || '').trim();
  const phone = rawPhone ? normalizePhone(rawPhone) || rawPhone : '';
  const message = String(body.message || '').trim();
  const source = String(body.source || 'Website').trim();
  const lengthError = checkLengths({
    Name: { value: name, max: MAX_LEN.short },
    Email: { value: email, max: MAX_LEN.short },
    Message: { value: message, max: MAX_LEN.text },
    Source: { value: source, max: MAX_LEN.short },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false });
  }

  const lead = await dbInsertLead({
    name,
    email,
    phone: phone || undefined,
    message: message || undefined,
    source,
  });

  if (!lead) {
    return NextResponse.json({ ok: false, error: 'Could not save lead.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, configured: true, lead });
}
