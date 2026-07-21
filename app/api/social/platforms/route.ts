import { NextResponse } from 'next/server';
import { getAllConnected, deleteToken, type Platform } from '@/lib/social/tokens';

export async function GET() {
  const platforms = await getAllConnected();
  return NextResponse.json({ platforms });
}

export async function DELETE(req: Request) {
  const { platform } = await req.json() as { platform: Platform };
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });
  await deleteToken(platform);
  return NextResponse.json({ ok: true });
}
