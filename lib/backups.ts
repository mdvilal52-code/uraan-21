// Backup engine: Postgres dump (via the Supabase direct-connection string) +
// Supabase Storage bucket sync, written to local disk on the VPS. Like every
// other integration in this app, it fails safe and never fakes success: if
// `pg_dump` isn't installed or SUPABASE_DB_URL isn't set, createBackup()
// returns a clear "not configured" result instead of writing a fake manifest.
//
// Required env vars (see .env.example):
//   SUPABASE_DB_URL   — Project Settings → Database → Connection string (URI,
//                        "Session pooler" or direct connection both work).
//                        This is DIFFERENT from SUPABASE_URL (the REST API
//                        host) — it's a real postgres:// connection string.
//   BACKUP_DIR              — where backups are written (default ./backups)
//   BACKUP_RETENTION_DAILY  — keep every backup from the last N days (default 30)
//   BACKUP_RETENTION_MONTHLY— beyond that, keep 1/month for M months (default 12)
//   BACKUP_STORAGE_BUCKETS  — comma-separated Storage buckets to sync (default
//                             "product-images")
import { execFile, spawn } from 'child_process';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { createGzip, createGunzip } from 'zlib';
import fs from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { logAudit, logSecurityEvent } from './audit';

const execFileAsync = promisify(execFile);

export type BackupType = 'manual' | 'scheduled' | 'safety';

export type BackupManifest = {
  id: string;
  type: BackupType;
  label?: string;
  createdAt: string;
  createdBy?: string;
  database: { ok: boolean; bytes: number; error?: string } | null;
  storage: { ok: boolean; buckets: string[]; fileCount: number; bytes: number; error?: string } | null;
};

export type BackupListItem = BackupManifest & { sizeBytes: number };

function backupDir(): string {
  return process.env.BACKUP_DIR
    ? path.resolve(process.env.BACKUP_DIR)
    : path.join(process.cwd(), 'backups');
}

function storageBuckets(): string[] {
  return (process.env.BACKUP_STORAGE_BUCKETS || 'product-images')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
}

// Backup ids are generated here, never taken from user input, but every path
// built from one is still validated against this shape before touching the
// filesystem — the last line of defence against path traversal.
const ID_RE = /^bk_[0-9]{13}_[a-f0-9]{8}$/;

function newId(): string {
  const rand = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `bk_${Date.now()}_${rand}`;
}

function dirFor(id: string): string {
  if (!ID_RE.test(id)) throw new Error('Invalid backup id.');
  return path.join(backupDir(), id);
}

export type ConfigStatus = {
  pgDumpAvailable: boolean;
  dbConfigured: boolean;
  storageConfigured: boolean;
  dir: string;
};

export async function getBackupConfigStatus(): Promise<ConfigStatus> {
  let pgDumpAvailable = false;
  try {
    await execFileAsync('pg_dump', ['--version']);
    pgDumpAvailable = true;
  } catch {
    pgDumpAvailable = false;
  }
  return {
    pgDumpAvailable,
    dbConfigured: Boolean(process.env.SUPABASE_DB_URL),
    storageConfigured: isSupabaseConfigured(),
    dir: backupDir(),
  };
}

async function dirSizeBytes(dir: string): Promise<number> {
  let total = 0;
  let entries: import('fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += await dirSizeBytes(full);
    else {
      try {
        total += (await fs.stat(full)).size;
      } catch {
        /* file vanished mid-walk — skip */
      }
    }
  }
  return total;
}

export async function listBackups(): Promise<BackupListItem[]> {
  const dir = backupDir();
  let entries: import('fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const items: BackupListItem[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !ID_RE.test(entry.name)) continue;
    const full = path.join(dir, entry.name);
    try {
      const raw = await fs.readFile(path.join(full, 'manifest.json'), 'utf8');
      const manifest = JSON.parse(raw) as BackupManifest;
      const sizeBytes = await dirSizeBytes(full);
      items.push({ ...manifest, sizeBytes });
    } catch {
      /* a directory without a readable manifest isn't a backup we can list */
    }
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function dumpDatabase(destDir: string): Promise<BackupManifest['database']> {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return null;
  const outFile = path.join(destDir, 'database.sql.gz');
  try {
    // --clean --if-exists makes the dump safe to restore over an existing
    // database (drops each object before recreating it) instead of erroring
    // out on the first "already exists".
    const child = spawn('pg_dump', [dbUrl, '--no-owner', '--no-privileges', '--clean', '--if-exists', '-F', 'p'], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stderr = '';
    child.stderr.on('data', (c) => {
      stderr += c.toString();
    });
    const gzip = createGzip();
    const out = createWriteStream(outFile);
    const done = pipeline(child.stdout, gzip, out);
    const exit = new Promise<number>((resolve, reject) => {
      child.on('error', reject);
      child.on('close', resolve);
    });
    const [code] = await Promise.all([exit, done]);
    if (code !== 0) {
      return { ok: false, bytes: 0, error: stderr.slice(0, 2000) || `pg_dump exited with code ${code}` };
    }
    const { size } = await fs.stat(outFile);
    return { ok: true, bytes: size };
  } catch (err) {
    return { ok: false, bytes: 0, error: err instanceof Error ? err.message : 'pg_dump failed.' };
  }
}

async function syncStorage(destDir: string): Promise<BackupManifest['storage']> {
  const sb = getSupabase();
  if (!sb) return null;
  const buckets = storageBuckets();
  let fileCount = 0;
  let bytes = 0;
  const errors: string[] = [];
  for (const bucket of buckets) {
    try {
      const { data: files, error } = await sb.storage.from(bucket).list('', { limit: 1000 });
      if (error) throw error;
      const bucketDir = path.join(destDir, 'storage', bucket);
      await fs.mkdir(bucketDir, { recursive: true });
      for (const file of files || []) {
        if (!file.name || file.id === null) continue; // skip "folders" (no id)
        const { data: blob, error: dlErr } = await sb.storage.from(bucket).download(file.name);
        if (dlErr || !blob) continue;
        const buf = Buffer.from(await blob.arrayBuffer());
        await fs.writeFile(path.join(bucketDir, file.name), buf);
        fileCount++;
        bytes += buf.byteLength;
      }
    } catch (err) {
      errors.push(`${bucket}: ${err instanceof Error ? err.message : 'sync failed'}`);
    }
  }
  return { ok: errors.length === 0, buckets, fileCount, bytes, error: errors.join('; ') || undefined };
}

export async function createBackup(opts: {
  type: BackupType;
  label?: string;
  createdBy?: string;
}): Promise<{ ok: boolean; manifest?: BackupManifest; error?: string }> {
  const status = await getBackupConfigStatus();
  if (!status.pgDumpAvailable || !status.dbConfigured) {
    const missing = [
      !status.pgDumpAvailable && 'pg_dump is not installed on this server',
      !status.dbConfigured && 'SUPABASE_DB_URL is not set',
    ]
      .filter(Boolean)
      .join('; ');
    return { ok: false, error: `Backups are not configured yet: ${missing}.` };
  }

  const id = newId();
  const dir = dirFor(id);
  await fs.mkdir(dir, { recursive: true });

  const [database, storage] = await Promise.all([dumpDatabase(dir), syncStorage(dir)]);

  const manifest: BackupManifest = {
    id,
    type: opts.type,
    label: opts.label,
    createdAt: new Date().toISOString(),
    createdBy: opts.createdBy,
    database,
    storage,
  };
  await fs.writeFile(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const ok = Boolean(database?.ok);
  await logAudit({
    actorEmail: opts.createdBy,
    action: 'backup_created',
    target: id,
    metadata: { type: opts.type, label: opts.label, dbOk: database?.ok ?? false, storageOk: storage?.ok ?? null },
  });
  if (!ok) {
    await logSecurityEvent({
      type: 'backup_failed',
      severity: 'critical',
      email: opts.createdBy,
      metadata: { id, error: database?.error },
    });
  }

  return { ok, manifest, error: ok ? undefined : database?.error };
}

export async function deleteBackup(id: string, actor?: string): Promise<{ ok: boolean; error?: string }> {
  let dir: string;
  try {
    dir = dirFor(id);
  } catch {
    return { ok: false, error: 'Invalid backup id.' };
  }
  try {
    await fs.access(dir);
  } catch {
    return { ok: false, error: 'Backup not found.' };
  }
  await fs.rm(dir, { recursive: true, force: true });
  await logAudit({ actorEmail: actor, action: 'backup_deleted', target: id });
  return { ok: true };
}

export async function restoreBackup(
  id: string,
  actor?: string
): Promise<{ ok: boolean; error?: string; safetyBackupId?: string }> {
  let dir: string;
  try {
    dir = dirFor(id);
  } catch {
    return { ok: false, error: 'Invalid backup id.' };
  }
  const dumpFile = path.join(dir, 'database.sql.gz');
  try {
    await fs.access(dumpFile);
  } catch {
    return { ok: false, error: 'This backup has no database dump to restore.' };
  }

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) return { ok: false, error: 'SUPABASE_DB_URL is not set — cannot restore.' };

  // Any destructive action (restore included) auto-creates a safety backup
  // FIRST, so a bad restore is itself recoverable.
  const safety = await createBackup({ type: 'safety', label: `pre-restore of ${id}`, createdBy: actor });
  if (!safety.ok) {
    return { ok: false, error: `Refusing to restore: could not create a safety backup first (${safety.error}).` };
  }

  try {
    const psql = spawn('psql', [dbUrl], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    psql.stderr.on('data', (c) => {
      stderr += c.toString();
    });
    const gunzip = createGunzip();
    const fileIn = createReadStream(dumpFile);
    const feed = pipeline(fileIn, gunzip, psql.stdin);
    const exit = new Promise<number>((resolve, reject) => {
      psql.on('error', reject);
      psql.on('close', resolve);
    });
    const [code] = await Promise.all([exit, feed]);
    if (code !== 0) {
      await logSecurityEvent({
        type: 'backup_restore_failed',
        severity: 'critical',
        email: actor,
        metadata: { id, error: stderr.slice(0, 2000) },
      });
      return { ok: false, error: stderr.slice(0, 2000) || `psql exited with code ${code}`, safetyBackupId: safety.manifest?.id };
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Restore failed.',
      safetyBackupId: safety.manifest?.id,
    };
  }

  await logAudit({ actorEmail: actor, action: 'backup_restored', target: id, metadata: { safetyBackupId: safety.manifest?.id } });
  await logSecurityEvent({ type: 'backup_restored', severity: 'critical', email: actor, metadata: { id } });
  return { ok: true, safetyBackupId: safety.manifest?.id };
}

// Grandfather-father-son retention: every backup from the last `dailyDays`
// days is kept as-is; beyond that window only the OLDEST backup in each
// remaining calendar month is kept (up to `monthlyMonths` months back).
// Everything else is actually deleted (disk + manifest), not just hidden.
export async function applyRetention(): Promise<{ deleted: string[] }> {
  const dailyDays = Math.max(1, Number(process.env.BACKUP_RETENTION_DAILY) || 30);
  const monthlyMonths = Math.max(0, Number(process.env.BACKUP_RETENTION_MONTHLY) || 12);

  const backups = await listBackups();
  const now = Date.now();
  const dailyCutoff = now - dailyDays * 24 * 60 * 60 * 1000;
  const monthlyCutoff = new Date(now);
  monthlyCutoff.setMonth(monthlyCutoff.getMonth() - monthlyMonths);

  const keep = new Set<string>();
  const monthlyKeeper = new Map<string, BackupListItem>(); // "YYYY-MM" -> oldest backup that month

  for (const b of backups) {
    const created = new Date(b.createdAt).getTime();
    if (created >= dailyCutoff) {
      keep.add(b.id);
      continue;
    }
    if (created < monthlyCutoff.getTime()) continue; // outside the retention window entirely
    const monthKey = b.createdAt.slice(0, 7);
    const current = monthlyKeeper.get(monthKey);
    if (!current || created < new Date(current.createdAt).getTime()) {
      monthlyKeeper.set(monthKey, b);
    }
  }
  for (const b of monthlyKeeper.values()) keep.add(b.id);

  const toDelete = backups.filter((b) => !keep.has(b.id));
  for (const b of toDelete) {
    await deleteBackup(b.id, 'system:retention');
  }
  return { deleted: toDelete.map((b) => b.id) };
}
