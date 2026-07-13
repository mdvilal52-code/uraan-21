'use client';

import { useEffect, useState } from 'react';
import { Search, ScrollText, ChevronDown } from 'lucide-react';

type AuditLogRow = {
  id: number;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

const PAGE_SIZE = 50;

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = async (nextOffset: number, replace: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(nextOffset) });
      if (actionFilter) params.set('action', actionFilter);
      if (debouncedSearch) params.set('q', debouncedSearch);
      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.ok) {
        setLogs((prev) => (replace ? data.logs : [...prev, ...data.logs]));
        setHasMore((data.logs || []).length === PAGE_SIZE);
        setOffset(nextOffset);
      }
    } catch {
      /* keep whatever is already shown */
    } finally {
      setLoading(false);
    }
  };

  // Debounce the free-text search before it hits the server, so typing
  // doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Re-fetch from the server (resetting pagination back to offset 0, same as
  // changing actionFilter already did) whenever the action filter or the
  // debounced search term changes — this is what makes search see the FULL
  // dataset instead of only whatever page happens to already be in `logs`.
  useEffect(() => {
    load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, debouncedSearch]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (l.actorEmail || '').toLowerCase().includes(q) ||
      (l.target || '').toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q)
    );
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  return (
    <div>
      <div className="mb-6">
        <h1 className="serif text-3xl text-[#1a1410] mb-1 flex items-center gap-2">
          <ScrollText size={26} className="text-[#b8893a]" /> Audit Log
        </h1>
        <p className="text-sm text-[#6b5d4c]">Every recorded admin action — who changed what, when.</p>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] p-4 mb-5 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={14} className="text-[#9a8c75]" />
          <input
            type="text"
            placeholder="Search by admin email, action, or target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-[rgba(184,137,58,0.32)] px-3 py-1.5 text-xs outline-none cursor-pointer"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{actionLabel(a)}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] tracking-[1.5px] uppercase text-[#9a8c75] border-b border-[rgba(184,137,58,0.18)]">
              <th className="text-left py-3 px-4 font-semibold">When</th>
              <th className="text-left py-3 px-4 font-semibold">Admin</th>
              <th className="text-left py-3 px-4 font-semibold">Role</th>
              <th className="text-left py-3 px-4 font-semibold">Action</th>
              <th className="text-left py-3 px-4 font-semibold">Target</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} className="border-b border-[rgba(184,137,58,0.1)]">
                <td className="py-3 px-4 text-xs text-[#6b5d4c] whitespace-nowrap">{formatWhen(l.createdAt)}</td>
                <td className="py-3 px-4 text-[#1a1410]">{l.actorEmail || '—'}</td>
                <td className="py-3 px-4 text-xs text-[#9a8c75] uppercase">{l.actorRole || '—'}</td>
                <td className="py-3 px-4 font-medium text-[#1a1410]">{actionLabel(l.action)}</td>
                <td className="py-3 px-4 text-xs text-[#6b5d4c] break-all">{l.target || '—'}</td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-[#9a8c75] text-sm">
                  No audit entries yet — connect a database and start making changes in the panel.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          onClick={() => load(offset + PAGE_SIZE, false)}
          disabled={loading}
          className="mt-4 mx-auto flex items-center gap-2 px-5 py-2.5 border border-[rgba(184,137,58,0.32)] text-[11px] tracking-[1.5px] uppercase font-semibold hover:bg-[#fbf8f1] disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load more'} <ChevronDown size={14} />
        </button>
      )}
    </div>
  );
}
