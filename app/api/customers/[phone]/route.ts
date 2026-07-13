import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetCustomerByPhone } from '@/lib/customersDb';

// GET → one customer's profile + full order history (admin only).
export async function GET(_request: Request, { params }: { params: { phone: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Database not configured.' }, { status: 404 });
  }
  const phone = decodeURIComponent(params.phone || '');
  const result = await dbGetCustomerByPhone(phone);
  if (!result) {
    return NextResponse.json({ ok: false, error: 'Customer not found.' }, { status: 404 });
  }
  const { orders, ...customer } = result;
  return NextResponse.json({ ok: true, customer, orders });
}
