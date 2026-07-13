// Shared Supabase Auth config. Reads only the PUBLIC env vars (inlined at build
// for the browser), so it is safe to import from both client and server code.
// When these are absent the whole Supabase Auth path stays dormant and the
// legacy admin login keeps working — nothing changes until you set the keys.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
