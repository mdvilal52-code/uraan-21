import { NextResponse } from 'next/server';
import { getYouTubeAuthUrl } from '@/lib/social/youtube.service';

export async function GET() {
  const state = crypto.randomUUID();
  const url = getYouTubeAuthUrl(state);
  return NextResponse.redirect(url);
}
