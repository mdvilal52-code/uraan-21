import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// Admin-only configuration diagnostic. Reports ONLY booleans + sanitized DB
// error messages — never any secret, key, or value — so it is safe to open in
// the browser. Purpose: pinpoint env-var name/value mistakes that stop the
// database from connecting (e.g. NEXT_PUBLIC_SUPABASE_URL set but SUPABASE_URL
// missing, or the anon key used in place of the service_role key).
//
// Usage: log in to the admin panel, then open /api/admin/health and read the
// "diagnosis" line.
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  // Which exact env-var names the code can see (true/false only — no values).
  const env = {
    // What the DATA layer (leads / orders / products) actually reads:
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    // What the AUTH layer reads (URL here is also accepted as a fallback above):
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    // Common WRONG names — if any of these is true, you used the wrong name:
    SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    SUPABASE_KEY: Boolean(process.env.SUPABASE_KEY),
    SUPABASE_SECRET: Boolean(process.env.SUPABASE_SECRET),
    SUPABASE_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_KEY),
    SUPABASE_SERVICE_ROLE: Boolean(process.env.SUPABASE_SERVICE_ROLE),
  };

  // Live connectivity test — proves the URL + key actually work, without
  // returning any data or secret.
  const db: { configured: boolean; querySucceeded: boolean; error?: string } = {
    configured: isSupabaseConfigured(),
    querySucceeded: false,
  };
  const sb = getSupabase();
  if (sb) {
    try {
      const { error } = await sb.from('leads').select('*', { count: 'exact', head: true });
      db.querySucceeded = !error;
      if (error) db.error = error.message;
    } catch (e) {
      db.error = e instanceof Error ? e.message : 'unknown error';
    }
  }

  // Plain-language verdict so it is obvious what to fix.
  let diagnosis: string;
  if (!env.SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL) {
    diagnosis =
      'Supabase URL missing. Add SUPABASE_URL (Project URL) in Vercel → Production → and redeploy.';
  } else if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    diagnosis =
      'Service key missing. Add SUPABASE_SERVICE_ROLE_KEY — the service_role key from ' +
      'Supabase → Settings → API — in Vercel → Production → and redeploy.';
  } else if (!db.querySucceeded) {
    diagnosis =
      'Env vars are present but the DB query failed (' + (db.error || 'unknown') +
      '). Usually the WRONG key (use service_role, NOT anon) or the schema/leads table was never created.';
  } else {
    diagnosis = 'Supabase connected OK — the data layer is working.';
  }

  return NextResponse.json({
    ok: true,
    diagnosis,
    db,
    env,
    whatsapp: {
      WHATSAPP_TOKEN: Boolean(process.env.WHATSAPP_TOKEN),
      WHATSAPP_PHONE_NUMBER_ID: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      WHATSAPP_LEAD_TEMPLATE: Boolean(process.env.WHATSAPP_LEAD_TEMPLATE),
      WHATSAPP_ORDER_TEMPLATE: Boolean(process.env.WHATSAPP_ORDER_TEMPLATE),
      WHATSAPP_CAMPAIGN_TEMPLATE: Boolean(process.env.WHATSAPP_CAMPAIGN_TEMPLATE),
      WHATSAPP_VERIFY_TOKEN: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      WHATSAPP_APP_SECRET: Boolean(process.env.WHATSAPP_APP_SECRET),
      ADMIN_WHATSAPP_NUMBER: Boolean(process.env.ADMIN_WHATSAPP_NUMBER),
      NEXT_PUBLIC_WHATSAPP_NUMBER: Boolean(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
    },
  });
}
