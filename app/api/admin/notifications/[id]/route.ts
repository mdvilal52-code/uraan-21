import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbMarkRead, dbDeleteNotification } from '@/lib/notificationsDb';
import { requireRole } from '@/lib/security/guard';

// PATCH /api/admin/notifications/:id → { isRead: boolean }. Any signed-in admin.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole('staff');
  if ('error' in guard) return guard.error;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Notifications are not configured yet.' }, { status: 503 });
  }
  const isRead = body.isRead !== false; // default true — the common case is "mark read"
  const ok = await dbMarkRead(params.id, isRead);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not update notification.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/notifications/:id → admin only (destructive).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Notifications are not configured yet.' }, { status: 503 });
  }
  const ok = await dbDeleteNotification(params.id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not delete notification.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
