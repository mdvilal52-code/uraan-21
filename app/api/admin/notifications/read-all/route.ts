import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbMarkAllRead } from '@/lib/notificationsDb';
import { requireRole } from '@/lib/security/guard';

// PATCH /api/admin/notifications/read-all → marks every unread notification
// read. Any signed-in admin.
export async function PATCH() {
  const guard = await requireRole('staff');
  if ('error' in guard) return guard.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Notifications are not configured yet.' }, { status: 503 });
  }
  const ok = await dbMarkAllRead();
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not update notifications.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
