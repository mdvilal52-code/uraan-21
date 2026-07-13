import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';
import { requireRole } from '@/lib/security/guard';

// GET → last 10 admin actions, for the dashboard "Recent Activity" feed.
// Visible to any signed-in admin (staff+) — team coordination, not a security
// screen (see /admin/audit-log + /api/admin/audit-log for the full trail).
export async function GET() {
  const guard = await requireRole('staff');
  if ('error' in guard) return guard.error;

  const logs = await getAuditLogs({ limit: 10 });
  return NextResponse.json({ ok: true, activity: logs || [] });
}
