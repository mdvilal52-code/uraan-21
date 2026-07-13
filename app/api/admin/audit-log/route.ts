import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit';
import { requireRole } from '@/lib/security/guard';

// GET → paginated audit trail (who changed what, when). Admin+ only — this is
// the full security-relevant record, unlike the lighter /api/admin/activity
// feed shown to everyone on the dashboard.
export async function GET(request: Request) {
  const guard = await requireRole('admin');
  if ('error' in guard) return guard.error;

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200);
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);
  const action = url.searchParams.get('action') || undefined;
  const actorEmail = url.searchParams.get('actor') || undefined;
  const search = url.searchParams.get('q') || undefined;

  const logs = await getAuditLogs({ limit, offset, action, actorEmail, search });
  return NextResponse.json({ ok: true, logs: logs || [] });
}
