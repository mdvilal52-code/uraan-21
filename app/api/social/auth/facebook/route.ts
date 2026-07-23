import { NextResponse } from 'next/server';
import { getFacebookAuthUrl } from '@/lib/social/facebook.service';

export async function GET() {
  const state = crypto.randomUUID();
  const url = getFacebookAuthUrl(state);
  const res = NextResponse.redirect(url);
  res.cookies.set('fb_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return res;
}
