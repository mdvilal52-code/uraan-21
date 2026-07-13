// Role-Based Access Control. Four ranked roles; higher rank inherits the
// permissions of everything below it. Used by API guards and the admin UI.
export type Role = 'owner' | 'super_admin' | 'admin' | 'staff';

export const ROLES: Role[] = ['owner', 'super_admin', 'admin', 'staff'];

// Higher number = more privilege.
export const ROLE_RANK: Record<Role, number> = {
  owner: 4,
  super_admin: 3,
  admin: 2,
  staff: 1,
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  super_admin: 'Super Admin',
  admin: 'Admin',
  staff: 'Staff',
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as string[]).includes(value);
}

/** True when `role` is at least as privileged as `min`. */
export function hasAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Coarse capability map; extend as features gain finer permissions. */
export const CAPABILITIES = {
  manageTeam: 'super_admin',      // add/remove admins
  manageSecurity: 'super_admin',  // sessions, lockouts, audit
  manageCatalogue: 'admin',       // products, categories, banners, coupons
  manageOrders: 'staff',          // view/update orders, leads
  viewDashboard: 'staff',
} as const satisfies Record<string, Role>;

export function can(role: Role, capability: keyof typeof CAPABILITIES): boolean {
  return hasAtLeast(role, CAPABILITIES[capability]);
}
