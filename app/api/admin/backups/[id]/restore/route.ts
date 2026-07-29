import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/guard';
import { restoreBackup } from '@/lib/backups';
import { isBodyTooLarge } from '@/lib/security/validate';

// POST /api/admin/backups/:id/restore → overwrites the live database with
// this backup's dump. The single most destructive action in the admin panel,
// so it's Owner-only and requires the caller to type the literal string
// "RESTORE" as confirmation (mirrors the "type DELETE to confirm" pattern
// used for other irreversible actions) — a stray double-click can't trigger it.
// A safety backup of the CURRENT database is taken first, automatically.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole('owner');
  if ('error' in guard) return guard.error;
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }

  let confirm = '';
  try {
    const body = await request.json();
    confirm = String(body?.confirm || '');
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }
  if (confirm !== 'RESTORE') {
    return NextResponse.json({ ok: false, error: 'Type RESTORE to confirm this destructive action.' }, { status: 400 });
  }

  const result = await restoreBackup(params.id, guard.admin.email);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, safetyBackupId: result.safetyBackupId },
      { status: 502 }
    );
  }
  return NextResponse.json({ ok: true, safetyBackupId: result.safetyBackupId });
}
