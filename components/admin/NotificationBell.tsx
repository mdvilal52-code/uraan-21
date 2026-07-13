'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell, X, Check, Trash2, ShoppingCart, UserPlus, Wallet, XCircle,
  PackageMinus, PackageX, Star, Mail, Send, LogIn, ShieldAlert,
  RefreshCw, MessageCircle, MailCheck, Database, AlertTriangle, Rocket,
  CheckCheck, Loader2,
} from 'lucide-react';
import {
  type AdminNotification, type NotificationType,
  formatUnreadCount, relativeTime,
} from '@/lib/notifications';

const POLL_MS = 30_000;
const PAGE_SIZE = 20;

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  new_order: ShoppingCart,
  new_customer: UserPlus,
  payment_received: Wallet,
  order_cancelled: XCircle,
  low_stock: PackageMinus,
  out_of_stock: PackageX,
  new_review: Star,
  contact_form: Mail,
  newsletter_subscriber: Send,
  admin_login: LogIn,
  failed_login: ShieldAlert,
  crm_sync: RefreshCw,
  whatsapp_campaign: MessageCircle,
  email_campaign: MailCheck,
  backup_completed: Database,
  system_error: AlertTriangle,
  deployment_completed: Rocket,
};

const TYPE_COLOR: Record<NotificationType, string> = {
  new_order: '#3d6b5a',
  new_customer: '#3d6fa8',
  payment_received: '#3d6b5a',
  order_cancelled: '#7a2e2e',
  low_stock: '#b8893a',
  out_of_stock: '#7a2e2e',
  new_review: '#b8893a',
  contact_form: '#3d6fa8',
  newsletter_subscriber: '#2e6b5e',
  admin_login: '#6b5d4c',
  failed_login: '#7a2e2e',
  crm_sync: '#5b4a8a',
  whatsapp_campaign: '#16796F',
  email_campaign: '#3d6fa8',
  backup_completed: '#6b5d4c',
  system_error: '#7a2e2e',
  deployment_completed: '#5b4a8a',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false); // stays true briefly during the close transition
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [configured, setConfigured] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFirstPage = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/notifications?limit=${PAGE_SIZE}`);
      const data = await res.json();
      if (!res.ok || !data.ok) return;
      setConfigured(data.configured !== false);
      setItems((data.notifications || []) as AdminNotification[]);
      setHasMore((data.notifications || []).length >= PAGE_SIZE);
      if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
    } catch {
      /* keep last-known state — the bell must never crash the admin panel */
    }
  }, []);

  // Poll for new notifications / unread count regardless of open state, so
  // the badge updates without a manual refresh.
  useEffect(() => {
    loadFirstPage();
    const id = setInterval(loadFirstPage, POLL_MS);
    return () => clearInterval(id);
  }, [loadFirstPage]);

  const openPanel = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setRendered(true);
    setLoading(true);
    loadFirstPage().finally(() => setLoading(false));
    // Next tick so the enter transition actually animates from the closed state.
    requestAnimationFrame(() => setOpen(true));
  };

  const closePanel = useCallback(() => {
    setOpen(false);
    closeTimer.current = setTimeout(() => setRendered(false), 250);
  }, []);

  const toggle = () => (open ? closePanel() : openPanel());

  // Click outside + Escape to close.
  useEffect(() => {
    if (!rendered) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closePanel();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
        return;
      }
      // Minimal focus trap: keep Tab cycling within the panel while open.
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [rendered, closePanel]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || items.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = items[items.length - 1].createdAt;
      const res = await fetch(`/api/admin/notifications?limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest)}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        const more = (data.notifications || []) as AdminNotification[];
        setItems((prev) => [...prev, ...more]);
        setHasMore(more.length >= PAGE_SIZE);
      }
    } catch {
      /* leave list as-is */
    } finally {
      setLoadingMore(false);
    }
  };

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMore();
  };

  const markRead = async (id: string, isRead: boolean) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead } : n)));
    setUnreadCount((c) => Math.max(0, c + (isRead ? -1 : 1)));
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead }),
      });
    } catch {
      /* optimistic update stands even if the sync fails silently */
    }
  };

  const remove = async (id: string) => {
    const wasUnread = items.find((n) => n.id === id)?.isRead === false;
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: 'DELETE' });
    } catch {
      /* already removed from view */
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch('/api/admin/notifications/read-all', { method: 'PATCH' });
    } catch {
      /* best-effort */
    }
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications? This cannot be undone.')) return;
    setItems([]);
    setUnreadCount(0);
    try {
      await fetch('/api/admin/notifications/clear', { method: 'DELETE' });
    } catch {
      /* best-effort */
    }
  };

  const badgeText = useMemo(() => formatUnreadCount(unreadCount), [unreadCount]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative w-9 h-9 rounded-full grid place-items-center hover:bg-[#fbf8f1]"
      >
        <Bell size={16} />
        {badgeText && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#7a2e2e] text-white text-[9px] font-bold grid place-items-center leading-none">
            {badgeText}
          </span>
        )}
      </button>

      {rendered && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Notifications"
          className={`absolute right-0 sm:right-0 -right-2 top-full mt-2 w-[92vw] max-w-sm sm:w-96 bg-white border border-[rgba(184,137,58,0.18)] shadow-[0_12px_40px_rgba(122,90,31,0.18)] rounded-lg overflow-hidden z-[100] transition-all duration-[250ms] ease-out origin-top-right ${
            open ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }`}
        >
          {/* Sticky header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(184,137,58,0.18)] sticky top-0 bg-white z-10">
            <h3 className="display text-xs tracking-[2px] uppercase text-[#1a1410]">
              Notifications {unreadCount > 0 && <span className="text-[#b8893a]">({unreadCount})</span>}
            </h3>
            <div className="flex items-center gap-3">
              {items.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] tracking-[0.5px] uppercase text-[#b8893a] font-semibold hover:underline flex items-center gap-1"
                  title="Mark all read"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={closePanel} aria-label="Close" className="text-[#6b5d4c] hover:text-[#1a1410]">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto" onScroll={onScroll}>
            {loading ? (
              <div className="p-3 space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-[#f0ece1] flex-shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2.5 bg-[#f0ece1] rounded w-2/3" />
                      <div className="h-2 bg-[#f0ece1] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !configured || items.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Bell size={28} className="mx-auto mb-2 text-[#b8893a]/40" />
                <p className="text-sm text-[#6b5d4c]">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const Icon = TYPE_ICON[n.type] || Bell;
                  const color = TYPE_COLOR[n.type] || '#6b5d4c';
                  return (
                    <li
                      key={n.id}
                      role="menuitem"
                      className={`flex gap-3 px-4 py-3 border-b border-[rgba(184,137,58,0.08)] last:border-b-0 ${
                        n.isRead ? '' : 'bg-[#fbf8f1]'
                      } ${n.priority === 'critical' ? 'border-l-2 border-l-[#7a2e2e]' : n.priority === 'high' ? 'border-l-2 border-l-[#b8893a]' : ''}`}
                    >
                      <div
                        className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
                        style={{ backgroundColor: `${color}1a`, color }}
                      >
                        <Icon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-[#1a1410]">{n.title}</p>
                          {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[#7a2e2e] mt-1 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-[#6b5d4c] mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] text-[#9a8c75]">{relativeTime(n.createdAt)}</span>
                          {n.link && (
                            <a href={n.link} className="text-[10px] text-[#b8893a] font-semibold hover:underline">
                              Open
                            </a>
                          )}
                          <button
                            onClick={() => markRead(n.id, !n.isRead)}
                            aria-label={n.isRead ? 'Mark unread' : 'Mark read'}
                            className="text-[10px] text-[#6b5d4c] hover:text-[#3d6b5a] flex items-center gap-0.5 ml-auto"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            onClick={() => remove(n.id)}
                            aria-label="Delete notification"
                            className="text-[10px] text-[#6b5d4c] hover:text-[#7a2e2e] flex items-center gap-0.5"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
                {loadingMore && (
                  <li className="py-3 flex items-center justify-center text-[#9a8c75]">
                    <Loader2 size={14} className="animate-spin" />
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Sticky footer */}
          {items.length > 0 && (
            <div className="px-4 py-2.5 border-t border-[rgba(184,137,58,0.18)] sticky bottom-0 bg-white flex justify-center">
              <button
                onClick={clearAll}
                className="text-[10px] tracking-[1px] uppercase text-[#7a2e2e] font-semibold hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
