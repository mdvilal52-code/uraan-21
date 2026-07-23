import { NextResponse } from 'next/server';
import { getYouTubeAuthUrl } from '@/lib/social/youtube.service';

export async function GET() {
  const state = crypto.randomUUID();
  const url = getYouTubeAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set('yt_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
