import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/security/guard';
import { deleteBackup } from '@/lib/backups';

// DELETE /api/admin/backups/:id → permanently removes the backup from disk
// (not a soft-hide). Super Admin+ only.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole('super_admin');
  if ('error' in guard) return guard.error;

  const result = await deleteBackup(params.id, guard.admin.email);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
