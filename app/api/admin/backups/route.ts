import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/guard';
import { listBackups, createBackup, getBackupConfigStatus } from '@/lib/backups';
import { isBodyTooLarge, MAX_LEN, tooLong } from '@/lib/security/validate';

// GET /api/admin/backups → list every backup on disk + whether the backup
// system is configured (pg_dump installed, SUPABASE_DB_URL set). Super Admin+
// only — backups can contain the full customer/order database.
export async function GET() {
  const guard = await requireRole('super_admin');
  if ('error' in guard) return guard.error;
  const [backups, status] = await Promise.all([listBackups(), getBackupConfigStatus()]);
  return NextResponse.json({ ok: true, backups, status });
}

// POST /api/admin/backups → "Backup Now" (manual backup).
export async function POST(request: Request) {
  const guard = await requireRole('super_admin');
  if ('error' in guard) return guard.error;
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  let label: string | undefined;
  try {
    const body = await request.json();
    label = typeof body?.label === 'string' ? body.label.trim() : undefined;
    if (label && tooLong(label, MAX_LEN.short)) {
      return NextResponse.json({ ok: false, error: `Label must be at most ${MAX_LEN.short} characters.` }, { status: 400 });
    }
  } catch {
    /* no body / not JSON — label is optional */
  }

  const result = await createBackup({ type: 'manual', label, createdBy: guard.admin.email });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.manifest ? 502 : 400 });
  }
  return NextResponse.json({ ok: true, manifest: result.manifest });
}
