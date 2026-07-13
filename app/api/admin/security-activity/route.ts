import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// GET → recent login attempts + security events for the session/activity
// dashboard (#13, #20). Admin only.
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, configured: false, logins: [], events: [] });
  }
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: true, configured: false, logins: [], events: [] });
  }

  const [logins, events] = await Promise.all([
    sb.from('login_attempts').select('email,ip,user_agent,success,reason,created_at').order('created_at', { ascending: false }).limit(15),
    sb.from('security_events').select('type,severity,email,ip,created_at').order('created_at', { ascending: false }).limit(15),
  ]);

  return NextResponse.json({
    ok: true,
    configured: true,
    logins: logins.data || [],
    events: events.data || [],
  });
}
