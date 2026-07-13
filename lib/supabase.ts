// Server-only Supabase client. Uses the service-role key, so it must NEVER be
// imported into a client component — only API routes / server code. Like the
// other integrations in this project, everything degrades gracefully: when the
// env vars are absent, isSupabaseConfigured() is false and callers fall back to
// the bundled demo data, so the site keeps working before the DB is set up.
//
// Required env vars (Vercel → Settings → Environment Variables):
//   SUPABASE_URL                — https://<project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY   — Project Settings → API → service_role key

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

// The service client needs the project URL + the secret service_role key. The
// URL is the SAME value as the public NEXT_PUBLIC_SUPABASE_URL, so we accept
// either name — a very common setup mistake is to set only the NEXT_PUBLIC one
// (needed for login) and forget SUPABASE_URL (needed for data). The service_role
// key has no public twin, so it must be set under its exact name.
export function supabaseUrl(): string {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createClient(
      supabaseUrl(),
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return cached;
}
