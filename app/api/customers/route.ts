import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetCustomers } from '@/lib/customersDb';
import { isAdminRequest } from '@/lib/adminApi';

// GET → list customers, derived from the orders table (admin only — PII).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, customers: [] });
  }
  const customers = await dbGetCustomers();
  return NextResponse.json({ ok: true, configured: true, customers: customers || [] });
}
