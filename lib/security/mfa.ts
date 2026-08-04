// Server-side 2FA (TOTP) step-up enforcement.
//
// Supabase issues a session as soon as the password is verified — that session
// sits at AAL1 (Authenticator Assurance Level 1). The TOTP challenge only
// raises it to AAL2. The login page prompts for the code, but that check lives
// in the browser: an attacker who has the password could call
// signInWithPassword directly and then navigate straight to /admin, skipping
// the client-side prompt entirely. Without a server-side check the enrolled
// second factor would never actually be required.
//
// mfaStepUpRequired() closes that gap. It returns true when the signed-in user
// has a verified TOTP factor (nextLevel === 'aal2') but the current session has
// not stepped up (currentLevel !== 'aal2'). The middleware and the API admin
// resolver treat that as "not authorised yet" and force the code to be entered.
//
// Fails open (returns false) when the AAL can't be determined, so a transient
// Supabase error can never lock every admin out of the panel. Users with no
// verified factor report nextLevel === 'aal1', so they are never affected —
// including during enrollment, when the new factor is still unverified.
import type { SupabaseClient } from '@supabase/supabase-js';

export async function mfaStepUpRequired(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) return false;
    return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
  } catch {
    return false;
  }
}
