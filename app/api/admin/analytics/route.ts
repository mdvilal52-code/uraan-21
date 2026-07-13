import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetDashboardAnalytics } from '@/lib/analyticsDb';
import { requireRole } from '@/lib/security/guard';

// GET → real dashboard/analytics numbers (admin only — staff can view).
export async function GET() {
  const guard = await requireRole('staff');
  if ('error' in guard) return guard.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, analytics: null });
  }
  const analytics = await dbGetDashboardAnalytics();
  if (!analytics) {
    return NextResponse.json({ ok: true, configured: false, analytics: null });
  }
  return NextResponse.json({ ok: true, configured: true, analytics });
}
