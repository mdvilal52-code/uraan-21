import { type NextRequest, NextResponse } from 'next/server';
import { getAllConnected, deleteToken, type Platform } from '@/lib/social/tokens';
import { requireRole } from '@/lib/security/guard';

export async function GET() {
  const auth = await requireRole('staff');
  if ('error' in auth) return auth.error;
  const platforms = await getAllConnected();
  return NextResponse.json({ platforms });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole('owner');
  if ('error' in auth) return auth.error;
  const { platform } = await req.json() as { platform: Platform };
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });
  await deleteToken(platform);
  return NextResponse.json({ ok: true });
}
