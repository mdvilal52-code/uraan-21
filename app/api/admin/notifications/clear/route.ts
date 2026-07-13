import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbClearAll } from '@/lib/notificationsDb';
import { requireRole } from '@/lib/security/guard';

// DELETE /api/admin/notifications/clear → removes every notification. Admin only (destructive).
export async function DELETE() {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Notifications are not configured yet.' }, { status: 503 });
  }
  const ok = await dbClearAll();
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not clear notifications.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
