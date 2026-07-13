// Server-side campaign log persistence (Supabase). Returns null when the DB is
// not configured — sending still works (see app/api/campaigns/send/route.ts),
// only the history is skipped.
import { getSupabase } from './supabase';
import type { CampaignChannel, CampaignLog } from './campaigns';

type Row = {
  id: number;
  channel: string;
  subject: string | null;
  message: string;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  created_by: string | null;
  created_at: string;
};

function toLog(r: Row): CampaignLog {
  return {
    id: r.id,
    channel: (r.channel === 'email' ? 'email' : 'whatsapp') as CampaignChannel,
    subject: r.subject || undefined,
    message: r.message,
    recipientCount: r.recipient_count,
    sentCount: r.sent_count,
    failedCount: r.failed_count,
    createdBy: r.created_by || undefined,
    createdAt: r.created_at,
  };
}

export async function dbInsertCampaignLog(entry: {
  channel: CampaignChannel;
  subject?: string;
  message: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdBy?: string;
}): Promise<CampaignLog | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('campaign_logs')
    .insert({
      channel: entry.channel,
      subject: entry.subject || null,
      message: entry.message,
      recipient_count: entry.recipientCount,
      sent_count: entry.sentCount,
      failed_count: entry.failedCount,
      created_by: entry.createdBy || null,
    })
    .select()
    .single();
  if (error) {
    console.error('[campaignsDb] insert:', error.message);
    return null;
  }
  return toLog(data as Row);
}

export async function dbGetCampaignLogs(): Promise<CampaignLog[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('campaign_logs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[campaignsDb] list:', error.message);
    return null;
  }
  return (data as Row[]).map(toLog);
}
