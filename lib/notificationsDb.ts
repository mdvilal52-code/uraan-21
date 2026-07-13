// Server-side admin notification persistence (Supabase). Returns null/false
// when the DB is not configured — callers should degrade to an empty feed
// rather than fabricate notifications (this app never uses mock data).
import { getSupabase } from './supabase';
import type { AdminNotification, NotificationPriority, NotificationType } from './notifications';

type Row = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  link: string | null;
  actor_email: string | null;
  created_at: string;
  updated_at: string;
};

function toNotification(r: Row): AdminNotification {
  return {
    id: r.id,
    title: r.title,
    message: r.message,
    type: r.type as NotificationType,
    priority: r.priority as NotificationPriority,
    isRead: r.is_read,
    link: r.link || undefined,
    actorEmail: r.actor_email || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function dbGetNotifications(
  limit: number,
  before?: string
): Promise<AdminNotification[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  let query = sb.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(limit);
  if (before) query = query.lt('created_at', before);
  const { data, error } = await query;
  if (error) {
    console.error('[notificationsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toNotification);
}

export async function dbGetUnreadCount(): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { count, error } = await sb
    .from('admin_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) {
    console.error('[notificationsDb] unreadCount:', error.message);
    return null;
  }
  return count ?? 0;
}

export async function dbCreateNotification(input: {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  actorEmail?: string;
}): Promise<AdminNotification | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('admin_notifications')
    .insert({
      title: input.title,
      message: input.message,
      type: input.type,
      priority: input.priority || 'normal',
      link: input.link || null,
      actor_email: input.actorEmail || null,
    })
    .select()
    .single();
  if (error) {
    console.error('[notificationsDb] create:', error.message);
    return null;
  }
  return toNotification(data as Row);
}

export async function dbMarkRead(id: string, isRead: boolean): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('admin_notifications')
    .update({ is_read: isRead, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    console.error('[notificationsDb] markRead:', error.message);
    return false;
  }
  return true;
}

export async function dbMarkAllRead(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from('admin_notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('is_read', false);
  if (error) {
    console.error('[notificationsDb] markAllRead:', error.message);
    return false;
  }
  return true;
}

export async function dbDeleteNotification(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.from('admin_notifications').delete().eq('id', id);
  if (error) {
    console.error('[notificationsDb] delete:', error.message);
    return false;
  }
  return true;
}

export async function dbClearAll(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  // Supabase requires a filter on delete; this matches every row (created_at
  // is always set) without needing a raw "delete all" escape hatch.
  const { error } = await sb.from('admin_notifications').delete().not('id', 'is', null);
  if (error) {
    console.error('[notificationsDb] clearAll:', error.message);
    return false;
  }
  return true;
}
