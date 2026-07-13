// Audit + security-event logging (Supabase). Every function is fail-safe: it
// never throws, so logging can never break the request it is recording. When
// the DB is not configured the calls are silent no-ops.
import { getSupabase } from './supabase';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

export type AuditEntry = {
  actorEmail?: string;
  actorRole?: string;
  action: string;
  target?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('audit_logs').insert({
      actor_email: entry.actorEmail?.toLowerCase() || null,
      actor_role: entry.actorRole || null,
      action: entry.action,
      target: entry.target || null,
      ip: entry.ip || null,
      user_agent: entry.userAgent || null,
      metadata: entry.metadata || {},
    });
  } catch {
    /* logging must never break the caller */
  }
}

export type AuditLogRow = {
  id: number;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

// Recent admin activity for the dashboard "Activity Feed" / a dedicated Audit
// Log page. Fail-safe: returns null when unconfigured or on any DB error.
export async function getAuditLogs(opts?: {
  limit?: number;
  offset?: number;
  action?: string;
  actorEmail?: string;
  search?: string;
}): Promise<AuditLogRow[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    let query = sb
      .from('audit_logs')
      .select('id, actor_email, actor_role, action, target, metadata, created_at')
      .order('created_at', { ascending: false })
      .range(opts?.offset || 0, (opts?.offset || 0) + (opts?.limit || 50) - 1);
    if (opts?.action) query = query.eq('action', opts.action);
    if (opts?.actorEmail) query = query.ilike('actor_email', opts.actorEmail);
    // Free-text search across the audit log's full dataset (not just already
    // loaded pages) — strip characters that are structurally significant to
    // PostgREST's or=(...) filter list (comma separates conditions,
    // parentheses group them) so the raw term can't break the filter we build.
    const term = opts?.search?.replace(/[,()%]/g, ' ').trim();
    if (term) {
      const like = `%${term}%`;
      query = query.or(`actor_email.ilike.${like},target.ilike.${like},action.ilike.${like}`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((r) => ({
      id: r.id as number,
      actorEmail: r.actor_email as string | null,
      actorRole: r.actor_role as string | null,
      action: r.action as string,
      target: r.target as string | null,
      metadata: (r.metadata as Record<string, unknown>) || {},
      createdAt: r.created_at as string,
    }));
  } catch {
    return null;
  }
}

export type SecurityEvent = {
  type: string; // login_failed, login_blocked, account_locked, new_device, suspicious, ...
  severity?: SecuritySeverity;
  email?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
};

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from('security_events').insert({
      type: event.type,
      severity: event.severity || 'info',
      email: event.email?.toLowerCase() || null,
      ip: event.ip || null,
      user_agent: event.userAgent || null,
      metadata: event.metadata || {},
    });
  } catch {
    /* never throw */
  }
}
