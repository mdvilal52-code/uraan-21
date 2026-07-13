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
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  localStorage.setItem(SESSION_KEY, email);
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
  localStorage.setItem(SESSION_KEY, email);
  return { ok: true };
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
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
