import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetCampaignLogs } from '@/lib/campaignsDb';

// GET → campaign send history (admin only).
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, logs: [] });
  }
  const logs = await dbGetCampaignLogs();
  return NextResponse.json({ ok: true, configured: true, logs: logs || [] });
}
