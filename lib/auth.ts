// Customer accounts. When Supabase Auth is configured (the production setup),
// email/password sign-up, sign-in and password reset all go through Supabase —
// real server-side accounts, bcrypt hashing, secure sessions and a working
// "reset link to your email" flow. The localStorage store below is kept only as
// a lightweight session/display cache (name/email/phone that the navbar,
// profile, cart and checkout read synchronously) — the same bridge OAuth
// sign-ins already use. When Supabase Auth is NOT configured (local/demo), the
// legacy localStorage-only path takes over so the site still works.
import { createClient } from './supabase/browser';
import { isSupabaseAuthConfigured } from './supabase/config';

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
  joinedOn: string;
}

interface StoredUser extends AuthUser {
  passwordHash: string;
}

const USERS_KEY = 'ogp_users';
const SESSION_KEY = 'ogp_session';

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(`omgauriputra::${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ ok: true; needsConfirmation?: boolean } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();

  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: { full_name: input.name.trim(), phone: input.phone.trim() },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('already') || msg.includes('registered')) {
          return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
        }
        return { ok: false, error: error.message || 'Could not create your account. Please try again.' };
      }
      // Supabase hides "already registered" behind an empty identities array to
      // prevent enumeration — surface a helpful (non-revealing) message.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
      }
      // No session means email confirmation is required before first sign-in.
      if (!data.session) {
        return { ok: true, needsConfirmation: true };
      }
      await loginFromSupabaseUser({ email, name: input.name, phone: input.phone });
      return { ok: true, needsConfirmation: false };
    } catch {
      return { ok: false, error: 'Could not create your account. Please try again.' };
    }
  }

  // Legacy localStorage-only path (Supabase Auth not configured).
  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: 'An account with this email already exists. Please sign in instead.' };
  }
  const user: StoredUser = {
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    joinedOn: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
    passwordHash: await hashPassword(input.password),
  };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  localStorage.setItem(SESSION_KEY, email);
  return { ok: true };
}

export async function loginUser(
  emailRaw: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = emailRaw.trim().toLowerCase();

  if (isSupabaseAuthConfigured()) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('not confirmed')) {
          return { ok: false, error: 'Please confirm your email first — check your inbox for the confirmation link.' };
        }
        // Generic message — never reveal whether the email or password was wrong.
        return { ok: false, error: 'Incorrect email or password. Please try again.' };
      }
      const u = data.user;
      await loginFromSupabaseUser({
        email,
        name: (u?.user_metadata?.full_name as string) || '',
        phone: (u?.user_metadata?.phone as string) || '',
      });
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error. Please try again.' };
    }
  }

  // Legacy localStorage-only path (Supabase Auth not configured).
  const user = readUsers().find((u) => u.email === email);
  if (!user) {
    return { ok: false, error: 'Incorrect email or password. Please try again.' };
  }
  if (user.passwordHash !== (await hashPassword(password))) {
    return { ok: false, error: 'Incorrect email or password. Please try again.' };
  }
  localStorage.setItem(SESSION_KEY, email);
  return { ok: true };
}

// Sends a password-reset link to the account's email (secure server route:
// Resend, falling back to Supabase's built-in email). Always resolves the same
// way regardless of whether the address exists, so callers can't enumerate
// accounts. Only meaningful when Supabase Auth is configured.
export async function requestPasswordReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  try {
    await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    /* stay silent — the UI always shows the same "check your email" state */
  }
}

// Sets a new password using the recovery session established by clicking the
// emailed reset link. Called from the customer /reset-password page.
export async function completePasswordReset(
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseAuthConfigured()) {
    return { ok: false, error: 'Password reset is not available.' };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message || 'Could not update your password.' };
    // Clear the recovery session and the local cache so the user signs in fresh.
    localStorage.removeItem(SESSION_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please try again.' };
  }
}

export async function loginFromSupabaseUser(input: {
  email: string;
  name: string;
  phone: string;
}): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const users = readUsers();
  const existing = users.find((u) => u.email === email);
  if (!existing) {
    const user: StoredUser = {
      name: input.name.trim() || email.split('@')[0],
      email,
      phone: input.phone.trim(),
      joinedOn: new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      // OAuth-verified identity (Google/Facebook via Supabase Auth) has no local
      // password; this hash can never match a real SHA-256(password) digest, so
      // loginUser() correctly rejects password attempts against this account.
      passwordHash: 'oauth',
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  }
  localStorage.setItem(SESSION_KEY, email);
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
  if (isSupabaseAuthConfigured()) {
    // Fire-and-forget: the localStorage session (what getCurrentUser reads) is
    // already cleared, so the UI reflects logout immediately; the Supabase
    // cookie session clears in the background.
    try {
      createClient().auth.signOut();
    } catch {
      /* ignore */
    }
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  const user = readUsers().find((u) => u.email === email);
  if (!user) return null;
  return { name: user.name, email: user.email, phone: user.phone, joinedOn: user.joinedOn };
}

export function passwordIssue(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (!/[a-zA-Z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must contain letters and at least one number.';
  return null;
}

export function passwordStrength(pw: string): { label: string; score: number; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 2) return { label: 'Weak', score, color: '#b91c1c' };
  if (score <= 3) return { label: 'Medium', score, color: '#b8893a' };
  return { label: 'Strong', score, color: '#3d6b5a' };
}
