// Resolves the currently signed-in admin (Supabase Auth) and their RBAC role
// from admin_users, using the service-role client. Returns null when there is
// no valid Supabase admin session. Used by API guards for role enforcement.
import { createServerSupabase } from './supabase/server';
import { isSupabaseAuthConfigured } from './supabase/config';
import { getSupabase } from './supabase';
import { isRole, type Role } from './rbac';
import { mfaStepUpRequired } from './security/mfa';

export type CurrentAdmin = { email: string; role: Role };

// `enforceMfa` (default true) gates AAL1 sessions behind the TOTP step-up. The
// password-reset completion flow passes false: a recovery session is always
// AAL1, and a 2FA-enabled admin who forgot their password could otherwise never
// reset it (they can't sign in to reach AAL2 in the first place). Email
// possession — proven by clicking the recovery link — is the reset factor there.
export async function getCurrentAdmin(
  options?: { enforceMfa?: boolean }
): Promise<CurrentAdmin | null> {
  const enforceMfa = options?.enforceMfa !== false;
  if (!isSupabaseAuthConfigured()) return null;
  try {
    const sb = createServerSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user?.email) return null;

    // Enforce 2FA server-side: a session that hasn't cleared the TOTP challenge
    // (AAL1 while a verified factor exists) is not treated as an authorised
    // admin, so protected APIs stay closed until the second factor is entered.
    if (enforceMfa && (await mfaStepUpRequired(sb))) return null;

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
