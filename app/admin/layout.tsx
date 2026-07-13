'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Topbar from '@/components/admin/Topbar';
import IdleTimeout from '@/components/admin/IdleTimeout';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // The login page is rendered without the admin chrome (sidebar/topbar).
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex bg-[#fbf8f1] min-h-screen">
      <IdleTimeout />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* min-w-0 lets the content column shrink so wide tables scroll
          inside their own container instead of overflowing the page. */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="admin-ui flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
