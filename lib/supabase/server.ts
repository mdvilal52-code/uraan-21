import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

export { isSupabaseAuthConfigured } from './config';

// Server Supabase client (route handlers / server components / server actions).
// Uses the request cookies so it sees the signed-in admin's session.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // setAll is called from a Server Component (read-only cookies) — the
          // session refresh is handled by the middleware instead; safe to ignore.
        }
      },
    },
  });
}
