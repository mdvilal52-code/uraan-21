'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, User, Menu, X, Loader2 } from 'lucide-react';
import NotificationBell from './NotificationBell';

type TopbarProps = {
  onMenuClick?: () => void;
};

// Matches the JSON shape returned by /api/admin/search — kept local rather
// than imported from the API route, same convention as AuditLogRow in
// app/admin/audit-log/page.tsx.
type SearchResult = {
  type: string;
  label: string;
  sublabel?: string;
  href: string;
};

const DEBOUNCE_MS = 280;

export default function Topbar({ onMenuClick }: TopbarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Debounced fetch against the global search API. A ref-based request id
  // guards against out-of-order responses (a slow earlier request resolving
  // after a faster later one) overwriting fresher results.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      const myId = ++requestId.current;
      fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (requestId.current !== myId) return; // superseded by a newer keystroke
          if (data.ok) {
            setResults((data.results || []) as SearchResult[]);
            setOpen(true);
          }
        })
        .catch(() => {
          /* keep whatever is already shown */
        })
        .finally(() => {
          if (requestId.current === myId) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeAndReset = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <header className="bg-white border-b border-[rgba(184,137,58,0.18)] py-3 px-4 md:px-6 flex items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden w-9 h-9 -ml-1 rounded-full grid place-items-center hover:bg-[#fbf8f1] text-[#1a1410] flex-shrink-0"
        >
          <Menu size={20} />
        </button>

        <div ref={rootRef} className="relative flex items-center gap-2 flex-1 min-w-0">
          <Search size={14} className="text-[#9a8c75] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
          {loading && <Loader2 size={13} className="text-[#9a8c75] flex-shrink-0 animate-spin" />}
          {!loading && query && (
            <button
              type="button"
              onClick={closeAndReset}
              aria-label="Clear search"
              className="text-[#9a8c75] hover:text-[#1a1410] flex-shrink-0"
            >
              <X size={13} />
            </button>
          )}

          {open && (
            <div
              role="listbox"
              aria-label="Search results"
              className="absolute left-0 top-full mt-2 w-[92vw] max-w-sm sm:w-96 bg-white border border-[rgba(184,137,58,0.18)] shadow-[0_12px_40px_rgba(122,90,31,0.18)] rounded-lg overflow-hidden z-[100] max-h-[70vh] overflow-y-auto"
            >
              {results.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#9a8c75]">
                  {loading ? 'Searching…' : `No results for "${query.trim()}"`}
                </div>
              ) : (
                <ul>
                  {results.map((r, idx) => (
                    <li key={`${r.type}-${r.href}-${idx}`}>
                      <Link
                        href={r.href}
                        onClick={closeAndReset}
                        className="block px-4 py-2.5 border-b border-[rgba(184,137,58,0.08)] last:border-b-0 hover:bg-[#fbf8f1]"
                      >
                        <div className="text-[9px] tracking-[1px] uppercase text-[#b8893a] font-semibold">
                          {r.type}
                        </div>
                        <div className="text-sm text-[#1a1410] truncate">{r.label}</div>
                        {r.sublabel && (
                          <div className="text-xs text-[#6b5d4c] truncate">{r.sublabel}</div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <NotificationBell />
        <div className="flex items-center gap-2 pl-3 border-l border-[rgba(184,137,58,0.18)]">
          <div className="w-9 h-9 rounded-full bg-[#b8893a]/10 grid place-items-center text-[#b8893a]">
            <User size={16} />
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-semibold text-[#1a1410]">Admin</div>
            <div className="text-[10px] text-[#9a8c75]">admin@omgauriputra.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}
