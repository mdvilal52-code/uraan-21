// Shared types + helpers for WhatsApp/Email bulk campaigns. Sending itself
// works without Supabase — it calls the WhatsApp/email senders directly, both
// of which are already graceful no-ops when unconfigured (see
// lib/whatsappServer.ts / lib/email.ts). Only the campaign_logs HISTORY
// requires a database (lib/campaignsDb.ts) — there is no browser localStorage
// fallback for that history since it's an admin audit trail, not a flow that
// needs to work fully offline.

export type CampaignChannel = 'whatsapp' | 'email';

export type CampaignRecipient = {
  phone?: string;
  email?: string;
  name?: string;
};

export type CampaignLog = {
  id: number;
  channel: CampaignChannel;
  subject?: string;
  message: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdBy?: string;
  createdAt: string;
};

// Simple {{name}} placeholder replacement — falls back to "there" when the
// recipient has no name on file.
export function personalize(message: string, name?: string): string {
  return message.replace(/\{\{\s*name\s*\}\}/gi, name?.trim() || 'there');
}

// Minimal HTML wrapper so a plain-text campaign message renders reasonably in
// an email client (Resend just wants an `html` string — see lib/email.ts).
export function htmlWrap(message: string): string {
  const escaped = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<div style="font-family:Georgia,serif;color:#1a1410;line-height:1.6;white-space:pre-wrap;">${escaped}</div>`;
}
