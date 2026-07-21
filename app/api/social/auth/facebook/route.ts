import { NextResponse } from 'next/server';
import { getFacebookAuthUrl } from '@/lib/social/facebook.service';

export async function GET() {
  const state = crypto.randomUUID();
  const url = getFacebookAuthUrl(state);
  return NextResponse.redirect(url);
}
