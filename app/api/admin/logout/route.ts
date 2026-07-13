import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/adminAuth';
import { createServerSupabase, isSupabaseAuthConfigured } from '@/lib/supabase/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Clear the legacy break-glass cookie.
  res.cookies.set(ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  // End the Supabase Auth session too (clears its auth cookies), if configured.
  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = createServerSupabase();
      await supabase.auth.signOut();
    } catch {
      /* nothing to sign out / not configured */
    }
  }

  return res;
}
