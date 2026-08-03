// Client-side account store backed by localStorage. Passwords are salted
// and hashed with SHA-256 via Web Crypto before storage, so plain text is
// never persisted. Frontend-only stand-in until a real auth backend exists.

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

// Every touch point below is wrapped in try/catch. Safari Private Browsing,
// storage-blocking in-app browsers (WhatsApp/Instagram), and a full quota
// can all make localStorage throw on read *or* write — previously only
// readUsers() guarded against that, so a blocked/full store crashed the
// register/login/profile pages with an uncaught exception instead of
// degrading gracefully. See lib/usePersistentStorage.ts for the same class
// of fix applied to the cart/wishlist.
const STORAGE_BLOCKED_ERROR =
  'Your browser is blocking saved data (common in Private Browsing or in-app browsers like WhatsApp/Instagram). Please open this site in your regular browser and try again.';

function readUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]): boolean {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  } catch {
    return false;
  }
}

function writeSession(email: string): boolean {
  try {
    localStorage.setItem(SESSION_KEY, email);
    return true;
  } catch {
    return false;
  }
}

function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
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
  if (!writeUsers([...users, user]) || !writeSession(email)) {
    return { ok: false, error: STORAGE_BLOCKED_ERROR };
  }
  return { ok: true };
}

export async function loginUser(
  emailRaw: string,
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = emailRaw.trim().toLowerCase();
  const user = readUsers().find((u) => u.email === email);
  if (!user) {
    return { ok: false, error: 'No account found with this email. Please register first.' };
  }
  if (user.passwordHash !== (await hashPassword(password))) {
    return { ok: false, error: 'Incorrect password. Please try again.' };
  }
  if (!writeSession(email)) {
    return { ok: false, error: STORAGE_BLOCKED_ERROR };
  }
  return { ok: true };
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
    writeUsers([...users, user]);
  }
  writeSession(email);
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to clean up if storage is inaccessible */
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const email = readSession();
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
