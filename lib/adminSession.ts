// Resolves the currently signed-in admin (Supabase Auth) and their RBAC role
// from admin_users, using the service-role client. Returns null when there is
// no valid Supabase admin session. Used by API guards for role enforcement.
import { createServerSupabase } from './supabase/server';
import { isSupabaseAuthConfigured } from './supabase/config';
import { getSupabase } from './supabase';
import { isRole, type Role } from './rbac';

export type CurrentAdmin = { email: string; role: Role };

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  if (!isSupabaseAuthConfigured()) return null;
  try {
    const sb = createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user?.email) return null;

    const service = getSupabase();
    if (!service) return null;

    const { data } = await service
      .from('admin_users')
      .select('role,status')
      .ilike('email', user.email)
      .maybeSingle();

    if (!data || data.status !== 'active') return null;
    return { email: user.email, role: isRole(data.role) ? data.role : 'staff' };
  } catch {
    return null;
  }
}
