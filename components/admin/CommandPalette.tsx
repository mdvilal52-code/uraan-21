'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Command } from 'lucide-react';
import { ADMIN_NAV_ITEMS } from '@/lib/adminNav';
import { HOTKEYS, CHORD_TIMEOUT_MS, type HotkeyBinding } from '@/lib/hotkeys';

type SearchResult = { type: string; label: string; sublabel?: string; href: string };

type PaletteItem = {
  key: string;
  label: string;
  sublabel?: string;
  href: string;
  group: string;
  shortcut?: string;
};

const DEBOUNCE_MS = 220;

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

// Static entries always shown (before/without a search query): every admin
// section plus the "Create"/"Find" shortcuts, so mouse users get the exact
// same command set as keyboard users.
const STATIC_ITEMS: PaletteItem[] = [
  ...ADMIN_NAV_ITEMS.map((item) => ({
    key: `nav-${item.href}`,
    label: item.label,
    href: item.href,
    group: 'Navigate',
    shortcut: HOTKEYS.find((h) => h.action.kind === 'navigate' && h.action.href === item.href)?.keys,
  })),
  ...HOTKEYS.filter((h) => h.action.kind === 'navigate' && h.id.startsWith('new-')).map((h) => ({
    key: h.id,
    label: h.label,
    href: (h.action as { kind: 'navigate'; href: string }).href,
    group: 'Create',
    shortcut: h.keys,
  })),
];

export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [liveResults, setLiveResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const pendingChord = useRef<{ key: string; at: number } | null>(null);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setScope(null);
    setLiveResults([]);
    setSelected(0);
  }, []);

  const openPalette = useCallback((withScope: string | null = null) => {
    setScope(withScope);
    setOpen(true);
    setSelected(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  // Live search against the same /api/admin/search endpoint the topbar
  // search box uses — one backend, two front doors.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      requestId.current += 1;
      setLiveResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const myId = ++requestId.current;
      fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (requestId.current !== myId) return;
          if (data.ok) setLiveResults((data.results || []) as SearchResult[]);
        })
        .catch(() => {})
        .finally(() => {
          if (requestId.current === myId) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const items: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const live: PaletteItem[] = liveResults
      .filter((r) => !scope || r.type === scope)
      .map((r, i) => ({ key: `live-${i}-${r.href}`, label: r.label, sublabel: r.sublabel, href: r.href, group: r.type }));

    if (scope) return live; // scoped "find X" mode only shows that entity type

    const staticFiltered = q
      ? STATIC_ITEMS.filter((i) => i.label.toLowerCase().includes(q))
      : STATIC_ITEMS;

    return q ? [...live, ...staticFiltered] : staticFiltered;
  }, [query, liveResults, scope]);

  const runAction = useCallback(
    (action: HotkeyBinding['action']) => {
      if (action.kind === 'open-palette') openPalette(null);
      else if (action.kind === 'open-palette-scoped') openPalette(action.scope);
      else if (action.kind === 'navigate') {
        closePalette();
        router.push(action.href);
      }
    },
    [openPalette, closePalette, router]
  );

  const activate = useCallback(
    (item: PaletteItem) => {
      closePalette();
      router.push(item.href);
    },
    [closePalette, router]
  );

  // Global listener: mod+k (always), plus sequential chords (g d, n p, f o…)
  // only when the palette is closed and focus isn't in a text field.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) closePalette();
        else openPalette(null);
        return;
      }

      if (open) {
        if (e.key === 'Escape') {
          e.preventDefault();
          closePalette();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelected((s) => Math.min(s + 1, Math.max(0, items.length - 1)));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelected((s) => Math.max(s - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const item = items[selected];
          if (item) activate(item);
        }
        return;
      }

      // Sequential chords are only live when the palette is closed and the
      // user isn't typing somewhere else on the page.
      if (mod || e.altKey || isTypingTarget(e.target)) return;
      const key = e.key.toLowerCase();
      if (key.length !== 1) return; // ignore Shift/Tab/Arrow keys etc. as chord starters

      const now = Date.now();
      const pending = pendingChord.current;
      if (pending && now - pending.at <= CHORD_TIMEOUT_MS) {
        const match = HOTKEYS.find((h) => h.chord.length === 2 && h.chord[0] === pending.key && h.chord[1] === key);
        pendingChord.current = null;
        if (match) {
          e.preventDefault();
          runAction(match.action);
          return;
        }
      }
      pendingChord.current = { key, at: now };
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, items, selected, activate, runAction, openPalette, closePalette]);

  // Lets a visible UI affordance (Topbar's "⌘K" button) open the palette too,
  // not just the keyboard shortcut.
  useEffect(() => {
    const onCustomOpen = () => openPalette(null);
    window.addEventListener('admin:open-palette', onCustomOpen);
    return () => window.removeEventListener('admin:open-palette', onCustomOpen);
  }, [openPalette]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-start justify-center pt-[12vh] px-4" onClick={closePalette}>
      <div
        className="bg-white w-full max-w-xl rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(184,137,58,0.18)]">
          <Search size={16} className="text-[#9a8c75] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            placeholder={scope ? `Find a ${scope.toLowerCase()}…` : 'Search products, orders, or jump to a section…'}
            autoComplete="off"
            className="flex-1 outline-none text-sm bg-transparent"
          />
          {scope && (
            <span className="text-[9px] tracking-[1px] uppercase text-[#b8893a] font-semibold bg-[#b8893a]/10 px-2 py-1 rounded flex-shrink-0">
              {scope}
            </span>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] text-[#9a8c75] border border-[rgba(184,137,58,0.25)] rounded px-1.5 py-0.5 flex-shrink-0">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && items.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9a8c75]">Searching…</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#9a8c75]">No matches.</div>
          ) : (
            <ul role="listbox">
              {items.map((item, idx) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => activate(item)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left border-b border-[rgba(184,137,58,0.08)] last:border-0 ${
                      idx === selected ? 'bg-[#fbf8f1]' : 'bg-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[9px] tracking-[1px] uppercase text-[#b8893a] font-semibold">{item.group}</div>
                      <div className="text-sm text-[#1a1410] truncate">{item.label}</div>
                      {item.sublabel && <div className="text-xs text-[#6b5d4c] truncate">{item.sublabel}</div>}
                    </div>
                    {idx === selected ? (
                      <CornerDownLeft size={13} className="text-[#9a8c75] flex-shrink-0" />
                    ) : item.shortcut ? (
                      <kbd className="text-[10px] text-[#9a8c75] flex-shrink-0">{item.shortcut}</kbd>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-4 px-4 py-2 border-t border-[rgba(184,137,58,0.18)] text-[10px] text-[#9a8c75]">
          <span className="flex items-center gap-1"><Command size={11} /> K to toggle</span>
          <span>↑↓ to navigate</span>
          <span>↵ to select</span>
        </div>
      </div>
    </div>
  );
}
