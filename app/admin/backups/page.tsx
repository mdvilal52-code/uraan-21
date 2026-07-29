'use client';

import { useCallback, useEffect, useState } from 'react';
import { HardDrive, Database, RefreshCw, Trash2, RotateCcw, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

type BackupManifest = {
  id: string;
  type: 'manual' | 'scheduled' | 'safety';
  label?: string;
  createdAt: string;
  createdBy?: string;
  database: { ok: boolean; bytes: number; error?: string } | null;
  storage: { ok: boolean; buckets: string[]; fileCount: number; bytes: number; error?: string } | null;
  sizeBytes: number;
};

type ConfigStatus = {
  pgDumpAvailable: boolean;
  dbConfigured: boolean;
  storageConfigured: boolean;
  dir: string;
};

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const TYPE_LABEL: Record<BackupManifest['type'], string> = {
  manual: 'Manual',
  scheduled: 'Scheduled',
  safety: 'Safety (pre-destructive-action)',
};

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupManifest[]>([]);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<BackupManifest | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BackupManifest | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backups');
      const data = await res.json();
      if (res.ok && data.ok) {
        setBackups(data.backups);
        setStatus(data.status);
      }
    } catch {
      /* keep whatever is already shown */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const backupNow = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/backups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || 'Backup failed.');
      }
      await load();
    } catch {
      setError('Backup failed — network error.');
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      const res = await fetch(`/api/admin/backups/${pendingDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error || 'Delete failed.');
      setPendingDelete(null);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const confirmRestore = async () => {
    if (!pendingRestore || restoreConfirmText !== 'RESTORE') return;
    setBusyId(pendingRestore.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/backups/${pendingRestore.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESTORE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) setError(data.error || 'Restore failed.');
      setPendingRestore(null);
      setRestoreConfirmText('');
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const notConfigured = status && (!status.pgDumpAvailable || !status.dbConfigured);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="serif text-3xl text-[#1a1410] mb-1 flex items-center gap-2">
            <HardDrive size={26} className="text-[#b8893a]" /> Backups
          </h1>
          <p className="text-sm text-[#6b5d4c]">Database + Storage backups. Restores create a safety backup first, automatically.</p>
        </div>
        <button
          onClick={backupNow}
          disabled={creating || Boolean(notConfigured)}
          className="px-4 py-2 bg-[#1a1410] text-white text-[10px] tracking-[1.5px] uppercase font-semibold hover:bg-[#2a2015] disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={13} className={creating ? 'animate-spin' : ''} /> {creating ? 'Backing up…' : 'Backup Now'}
        </button>
      </div>

      {status && (
        <div className={`mb-5 p-4 border text-sm flex items-start gap-2 ${notConfigured ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}>
          {notConfigured ? <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />}
          <div>
            {notConfigured ? (
              <>
                <p className="font-semibold mb-1">Backups are not fully configured — nothing has actually run yet.</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {!status.pgDumpAvailable && <li><code>pg_dump</code> is not installed on this server (install <code>postgresql-client</code>).</li>}
                  {!status.dbConfigured && <li><code>SUPABASE_DB_URL</code> is not set (Supabase → Project Settings → Database → Connection string).</li>}
                  {!status.storageConfigured && <li><code>SUPABASE_URL</code> / <code>SUPABASE_SERVICE_ROLE_KEY</code> not set — Storage bucket sync will be skipped.</li>}
                </ul>
              </>
            ) : (
              <p>Backups are configured. Writing to <code>{status.dir}</code> on this server.{!status.storageConfigured && ' Storage bucket sync is skipped (Supabase not configured).'}</p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-5 p-3 border border-red-300 bg-red-50 text-red-800 text-sm flex items-center gap-2">
          <XCircle size={15} /> {error}
        </div>
      )}

      <div className="bg-white border border-[rgba(184,137,58,0.18)] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(184,137,58,0.18)] text-left text-[10px] tracking-[1.5px] uppercase text-[#9a8c75]">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Database</th>
              <th className="px-4 py-3">Storage</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">By</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#9a8c75]">Loading…</td></tr>
            ) : backups.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#9a8c75]">No backups yet.</td></tr>
            ) : (
              backups.map((b) => (
                <tr key={b.id} className="border-b border-[rgba(184,137,58,0.1)] last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatWhen(b.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{TYPE_LABEL[b.type]}</span>
                    {b.label && <div className="text-[11px] text-[#9a8c75]">{b.label}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {b.database?.ok ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={13} /> {formatBytes(b.database.bytes)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-700" title={b.database?.error}><XCircle size={13} /> Failed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {b.storage ? (
                      b.storage.ok ? (
                        <span className="text-[#6b5d4c]">{b.storage.fileCount} files ({formatBytes(b.storage.bytes)})</span>
                      ) : (
                        <span className="text-amber-700" title={b.storage.error}>Partial</span>
                      )
                    ) : (
                      <span className="text-[#c9beac]">Skipped</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatBytes(b.sizeBytes)}</td>
                  <td className="px-4 py-3 text-xs text-[#9a8c75]">{b.createdBy || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setPendingRestore(b)}
                        disabled={!b.database?.ok || busyId === b.id}
                        className="text-[#b8893a] hover:text-[#8a6425] disabled:opacity-30 flex items-center gap-1 text-xs"
                        title="Restore this backup"
                      >
                        <RotateCcw size={13} /> Restore
                      </button>
                      <button
                        onClick={() => setPendingDelete(b)}
                        disabled={busyId === b.id}
                        className="text-red-700 hover:text-red-900 disabled:opacity-30 flex items-center gap-1 text-xs"
                        title="Permanently delete this backup"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-[#9a8c75]">
        Retention: every backup from the last <code>BACKUP_RETENTION_DAILY</code> days (default 30) is kept, then one
        per month for <code>BACKUP_RETENTION_MONTHLY</code> months (default 12) — the rest is pruned automatically
        after each scheduled backup. Delete here removes the backup from disk immediately and permanently.
      </p>

      {/* Delete confirmation */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPendingDelete(null)}>
          <div className="bg-white max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif text-xl text-[#1a1410] mb-2">Delete this backup?</h3>
            <p className="text-sm text-[#6b5d4c] mb-4">
              This permanently removes {formatWhen(pendingDelete.createdAt)} ({TYPE_LABEL[pendingDelete.type]}) from disk. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPendingDelete(null)} className="px-4 py-2 text-xs uppercase tracking-wide text-[#6b5d4c]">Cancel</button>
              <button onClick={confirmDelete} disabled={busyId === pendingDelete.id} className="px-4 py-2 bg-red-700 text-white text-xs uppercase tracking-wide disabled:opacity-50">
                {busyId === pendingDelete.id ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore confirmation */}
      {pendingRestore && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => { setPendingRestore(null); setRestoreConfirmText(''); }}>
          <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif text-xl text-[#1a1410] mb-2 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-700" /> Restore database?
            </h3>
            <p className="text-sm text-[#6b5d4c] mb-3">
              This overwrites the LIVE database with the backup from {formatWhen(pendingRestore.createdAt)}. A safety
              backup of the current database is taken first, automatically — but this is still the most destructive
              action in the admin panel. Type <strong>RESTORE</strong> to confirm.
            </p>
            <input
              value={restoreConfirmText}
              onChange={(e) => setRestoreConfirmText(e.target.value)}
              placeholder="RESTORE"
              className="w-full h-10 px-3 border border-[rgba(184,137,58,0.3)] text-sm mb-4 focus:outline-none focus:border-[#b8893a]"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setPendingRestore(null); setRestoreConfirmText(''); }} className="px-4 py-2 text-xs uppercase tracking-wide text-[#6b5d4c]">Cancel</button>
              <button
                onClick={confirmRestore}
                disabled={restoreConfirmText !== 'RESTORE' || busyId === pendingRestore.id}
                className="px-4 py-2 bg-red-700 text-white text-xs uppercase tracking-wide disabled:opacity-50"
              >
                {busyId === pendingRestore.id ? 'Restoring…' : 'Restore now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {!status?.storageConfigured && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#9a8c75]">
          <Database size={13} /> Storage bucket sync needs <code>SUPABASE_URL</code> + <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </div>
      )}
    </div>
  );
}
