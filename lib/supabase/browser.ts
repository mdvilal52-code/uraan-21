'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Browser Supabase client for Auth sign-in. @supabase/ssr stores the session in
// cookies (not localStorage) so the server and middleware can read it.
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
