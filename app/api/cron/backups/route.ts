import { NextResponse } from 'next/server';
import { createBackup, applyRetention } from '@/lib/backups';

// GET → scheduled backup + retention sweep. Same pattern as
// /api/cron/abandoned-cart-reminders: point any scheduler at this with
// `Authorization: Bearer $CRON_SECRET` (required — fails closed). Example
// crontab entry (once a day at 2am):
//   0 2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
//     https://your-domain.com/api/cron/backups
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: 'CRON_SECRET is not configured — refusing to run.' },
      { status: 401 }
    );
  }
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const result = await createBackup({ type: 'scheduled', createdBy: 'system:cron' });
  const retention = result.ok ? await applyRetention() : { deleted: [] };

  return NextResponse.json({
    ok: result.ok,
    error: result.error,
    backupId: result.manifest?.id,
    retentionDeleted: retention.deleted,
  });
}
