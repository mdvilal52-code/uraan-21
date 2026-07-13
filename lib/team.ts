// Browser-persisted admin/staff team store (localStorage), so adding, editing
// and removing team members in the admin panel survive a refresh without a
// backend. Seeded from lib/users — the same pattern used by lib/leads.ts.
import { adminUsers as seedTeam, type User } from '@/lib/users';

export type { User };
export type TeamRole = 'admin' | 'staff';

const KEY = 'ogp_team';

function read(): User[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User[]) : null;
  } catch {
    return null;
  }
}

function write(list: User[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function nextId(list: User[], role: TeamRole): string {
  const prefix = role === 'admin' ? 'A' : 'S';
  const max = list
    .filter((u) => u.id.startsWith(prefix))
    .reduce((m, u) => {
      const n = parseInt(u.id.slice(1), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 0);
  return prefix + String(max + 1).padStart(3, '0');
}

export function getTeam(): User[] {
  const stored = read();
  if (stored) return stored;
  write(seedTeam);
  return seedTeam;
}

export type TeamInput = { name: string; email: string; phone: string; role: TeamRole };

export function addMember(input: TeamInput): User {
  const list = getTeam();
  const member: User = {
    id: nextId(list, input.role),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    city: 'HQ',
    role: input.role,
    orders: 0,
    totalSpent: 0,
    joinedOn: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  };
  write([...list, member]);
  return member;
}

export function updateMember(id: string, patch: Partial<Pick<User, 'name' | 'email' | 'phone' | 'role'>>): void {
  write(getTeam().map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

export function deleteMember(id: string): void {
  write(getTeam().filter((u) => u.id !== id));
}
