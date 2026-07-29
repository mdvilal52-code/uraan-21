'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { ADMIN_NAV_ITEMS, Home, Gem } from '@/lib/adminNav';
import { hasAtLeast, type Role } from '@/lib/rbac';

const menuItems = ADMIN_NAV_ITEMS;

type SidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Role-aware nav: hide entries the current admin can't access (#39-43).
  // Defaults to Owner (show all) until the role loads.
  const [role, setRole] = useState<Role>('owner');
  useEffect(() => {
    (async () => {
      try {
        const me = await (await fetch('/api/admin/me')).json();
        if (me?.admin?.role) setRole(me.admin.role as Role);
      } catch {
        /* keep default */
      }
    })();
  }, []);
  const visibleItems = menuItems.filter((i) => hasAtLeast(role, i.minRole));

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {
      /* ignore — we redirect regardless */
    }
    onClose?.();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Dark backdrop behind the drawer on mobile. */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Off-canvas drawer on mobile, static column on large screens. */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1a1410] text-[#e8d49b] min-h-screen flex flex-col flex-shrink-0 transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-6 border-b border-[#b8893a]/20 flex items-center justify-between">
          <Link href="/admin" onClick={onClose} className="flex items-center gap-2">
            <Gem className="text-[#b8893a]" size={20} />
            <div>
              <div className="display text-sm tracking-[2px] font-semibold text-white">
                OM GAURI
              </div>
              <div className="text-[8px] tracking-[2px] text-[#b8893a] uppercase mt-0.5">
                Admin Panel
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden text-[#e8d49b]/70 hover:text-[#b8893a]"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-all border-l-2 ${
                  isActive
                    ? 'bg-[#b8893a]/10 text-[#b8893a] border-l-[#b8893a]'
                    : 'text-[#e8d49b]/70 border-l-transparent hover:text-[#b8893a] hover:bg-[#b8893a]/5'
                }`}
              >
                <item.icon size={16} />
                <span className="tracking-[0.5px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#b8893a]/20 p-4 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-xs text-[#e8d49b]/70 hover:text-[#b8893a]"
          >
            <Home size={14} />
            <span>Back to Store</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-[#e8d49b]/70 hover:text-[#7a2e2e]"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
