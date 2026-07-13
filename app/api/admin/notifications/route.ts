import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { dbGetNotifications, dbGetUnreadCount, dbCreateNotification } from '@/lib/notificationsDb';
import { NOTIFICATION_TITLES, type NotificationPriority, type NotificationType } from '@/lib/notifications';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';
import { requireRole } from '@/lib/security/guard';

const TYPES = Object.keys(NOTIFICATION_TITLES) as NotificationType[];
const PRIORITIES: NotificationPriority[] = ['low', 'normal', 'high', 'critical'];
const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

// GET /api/admin/notifications?before=<iso>&limit=<n> → paginated feed +
// unread count, newest first. Admin only.
export async function GET(request: Request) {
  const guard = await requireRole('staff');
  if ('error' in guard) return guard.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, notifications: [], unreadCount: 0 });
  }
  const url = new URL(request.url);
  const before = url.searchParams.get('before') || undefined;
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(url.searchParams.get('limit')) || PAGE_SIZE));

  const [notifications, unreadCount] = await Promise.all([
    dbGetNotifications(limit, before),
    before ? Promise.resolve(null) : dbGetUnreadCount(),
  ]);

  return NextResponse.json({
    ok: true,
    configured: true,
    notifications: notifications || [],
    unreadCount: unreadCount ?? undefined,
  });
}

// POST /api/admin/notifications → create one manually (admin only). Most
// notifications are created server-side by lib/notify.ts at the actual event
// (new order, payment, etc) — this exists for the admin-facing API surface
// the spec asks for, and for a future "custom announcement" use case.
export async function POST(request: Request) {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const type = TYPES.includes(body.type as NotificationType) ? (body.type as NotificationType) : null;
  if (!type) {
    return NextResponse.json({ ok: false, error: 'A valid notification type is required.' }, { status: 400 });
  }
  const message = String(body.message || '').trim();
  if (!message) {
    return NextResponse.json({ ok: false, error: 'Message is required.' }, { status: 400 });
  }
  const title = String(body.title || '').trim() || NOTIFICATION_TITLES[type];
  const priority = PRIORITIES.includes(body.priority as NotificationPriority)
    ? (body.priority as NotificationPriority)
    : 'normal';
  const link = String(body.link || '').trim() || undefined;

  const lengthError = checkLengths({
    Title: { value: title, max: MAX_LEN.short },
    Message: { value: message, max: MAX_LEN.text },
    Link: { value: link || '', max: MAX_LEN.url },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Notifications are not configured yet.' }, { status: 503 });
  }

  const notification = await dbCreateNotification({ title, message, type, priority, link, actorEmail: guard.admin.email });
  if (!notification) {
    return NextResponse.json({ ok: false, error: 'Could not create notification.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, notification });
}
