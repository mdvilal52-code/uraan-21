// Canonical list of admin sections — the single source of truth for both the
// Sidebar and the command palette (lib/hotkeys.ts), so the two can never
// drift out of sync with each other.
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Grid3x3, Image as ImageIcon, Star, Ticket, Settings, UserCog, Gem,
  Contact, Home, ShieldCheck, RotateCcw, ShoppingBag, Megaphone,
  Newspaper, ScrollText, Share2, HardDrive, type LucideIcon,
} from 'lucide-react';
import type { Role } from './rbac';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  minRole: Role;
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, minRole: 'staff' },
  { href: '/admin/products', label: 'Products', icon: Package, minRole: 'admin' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, minRole: 'staff' },
  { href: '/admin/returns', label: 'Returns / RMA', icon: RotateCcw, minRole: 'staff' },
  { href: '/admin/leads', label: 'CRM / Leads', icon: Contact, minRole: 'staff' },
  { href: '/admin/customers', label: 'Customers', icon: Users, minRole: 'staff' },
  { href: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: ShoppingBag, minRole: 'staff' },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone, minRole: 'admin' },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, minRole: 'admin' },
  { href: '/admin/categories', label: 'Categories', icon: Grid3x3, minRole: 'admin' },
  { href: '/admin/banners', label: 'Banners', icon: ImageIcon, minRole: 'admin' },
  { href: '/admin/blog', label: 'Blog / CMS', icon: Newspaper, minRole: 'admin' },
  { href: '/admin/reviews', label: 'Reviews', icon: Star, minRole: 'admin' },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket, minRole: 'admin' },
  { href: '/admin/users', label: 'Admin Users', icon: UserCog, minRole: 'super_admin' },
  { href: '/admin/social', label: 'Social Media', icon: Share2, minRole: 'admin' },
  { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText, minRole: 'admin' },
  { href: '/admin/backups', label: 'Backups', icon: HardDrive, minRole: 'super_admin' },
  { href: '/admin/security', label: 'Security', icon: ShieldCheck, minRole: 'staff' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, minRole: 'super_admin' },
];

// Re-exported for the two icons Sidebar also needs for non-nav rows
// (Home = "Back to Store", Gem = logo mark).
export { Home, Gem };
