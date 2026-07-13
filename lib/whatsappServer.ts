// Server-side WhatsApp Business Cloud API (Meta) sender. Runs only inside API
// routes, so the access token never reaches the browser. Mirrors lib/crm.ts:
// it fails gracefully when credentials are not configured, so the site keeps
// working before the integration is wired up.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   WHATSAPP_TOKEN            — permanent/long-lived access token for the app
//   WHATSAPP_PHONE_NUMBER_ID  — the Cloud API phone number id (NOT the number)
//   WHATSAPP_VERIFY_TOKEN     — any secret string; matched during webhook setup
//
// For proactive alerts (e.g. new-lead notifications) sent OUTSIDE WhatsApp's
// 24-hour customer-service window, Meta requires a pre-approved *template*:
//   WHATSAPP_LEAD_TEMPLATE       — approved template name (e.g. new_lead)
//   WHATSAPP_LEAD_TEMPLATE_LANG  — its language code (default en_US)
//
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api

import { normalizePhone } from './phone';

export interface WhatsAppResult {
  ok: boolean;
  configured: boolean;
  error?: string;
}

const GRAPH_VERSION = 'v20.0';

// Low-level sender shared by text + template messages. Fails gracefully:
// returns configured:false (without throwing) when the Cloud API keys are
// absent, so callers can degrade to a wa.me link or just log and move on.
async function postMessage(
  payload: Record<string, unknown>,
  recipient: string
): Promise<WhatsAppResult> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!recipient) {
    return { ok: false, configured: !!(token && phoneNumberId), error: 'Missing recipient number.' };
  }

  // Not wired up yet: log and report unconfigured so callers can degrade
  // gracefully to a wa.me click-to-chat link instead.
  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp] Cloud API not configured — message not sent to', recipient);
    return { ok: true, configured: false };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) return { ok: true, configured: true };

    const detail = await res.text();
    console.error('[WhatsApp] send failed:', res.status, detail);
    return { ok: false, configured: true, error: `WhatsApp error (${res.status})` };
  } catch (err) {
    console.error('[WhatsApp] request error:', err);
    return { ok: false, configured: true, error: 'Could not reach WhatsApp API.' };
  }
}

// Free-form text. NOTE: Meta only delivers this if the recipient messaged the
// business number within the last 24 hours; otherwise use a template (below).
export async function sendWhatsAppText(to: string, message: string): Promise<WhatsAppResult> {
  const recipient = to.replace(/[^0-9]/g, '');
  return postMessage(
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'text',
      text: { preview_url: false, body: message },
    },
    recipient
  );
}

// Pre-approved template message — the only thing that reliably delivers OUTSIDE
// the 24-hour window. `bodyParams` fill the template's {{1}}, {{2}}, … in order
// (their count MUST match the approved template). Params cannot contain newlines.
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string,
  bodyParams: string[] = []
): Promise<WhatsAppResult> {
  const recipient = to.replace(/[^0-9]/g, '');
  const components = bodyParams.length
    ? [{ type: 'body', parameters: bodyParams.map((text) => ({ type: 'text', text })) }]
    : [];
  return postMessage(
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipient,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length ? { components } : {}),
      },
    },
    recipient
  );
}

// ── Admin order notifications ───────────────────────────────────────────────
export interface OrderNotification {
  orderId: string;
  customer: string;
  amount: number;
  payment: string;
  items: { name: string; quantity: number }[];
}

export async function notifyAdminNewOrder(order: OrderNotification): Promise<WhatsAppResult> {
  const templateName = process.env.WHATSAPP_ORDER_TEMPLATE;
  const summary = order.items.map((i) => `${i.name} x${i.quantity}`).join(', ').slice(0, 200);
  const summaryLines = [
    `Order: ${order.orderId}`,
    `Customer: ${order.customer}`,
    `Amount: ₹${order.amount}`,
    `Payment: ${order.payment}`,
    `Items: ${summary}`,
  ];

  if (templateName) {
    const lang = process.env.WHATSAPP_ORDER_TEMPLATE_LANG || 'en_US';
    const params =
      (process.env.WHATSAPP_ORDER_TEMPLATE_VARS ?? '1') === '0'
        ? []
        : [summaryLines.join(' | ').replace(/\s+/g, ' ').trim().slice(0, 900)];
    return sendWhatsAppTemplate(ADMIN_WHATSAPP_NUMBER, templateName, lang, params);
  }

  const text = `🛍️ New Order — Om Gauri Putra\n\n${summaryLines.join('\n')}`;
  return sendWhatsAppText(ADMIN_WHATSAPP_NUMBER, text);
}

// Sends the CUSTOMER a WhatsApp confirmation right after their order is
// placed. Free-form text only (no template configured for this — Meta only
// delivers it if the customer messaged the business number in the last 24h,
// same known limitation as the post-purchase status-update messages below).
// Best-effort and fail-safe; never throws into the payment/order response.
export async function notifyCustomerOrderPlaced(
  phone: string,
  orderId: string,
  amount: number
): Promise<WhatsAppResult> {
  const text =
    `Thank you for your order! 🙏\n\n` +
    `Order ${orderId} for ₹${amount.toLocaleString('en-IN')} has been placed with Om Gauri Putra.\n` +
    `We'll notify you here as it ships.`;
  return sendWhatsAppText(phone, text);
}

// ── Admin lead notifications ────────────────────────────────────────────────
// Recipient for new-lead WhatsApp alerts. Override per-environment with
// ADMIN_WHATSAPP_NUMBER (digits only, international format, e.g. 91XXXXXXXXXX);
// falls back to the public store number, then to the configured default.
// Server-only — never shipped to the browser. Run through normalizePhone() so
// a value hand-typed into Vercel's env var UI without its country code (e.g.
// "9128596443" instead of "919128596443") still resolves to a deliverable
// recipient; falls back to a bare digit-strip if normalization can't make
// sense of the value, so an already-correct number never breaks.
const ADMIN_WHATSAPP_NUMBER_RAW =
  process.env.ADMIN_WHATSAPP_NUMBER ||
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  '919128596443';
export const ADMIN_WHATSAPP_NUMBER =
  normalizePhone(ADMIN_WHATSAPP_NUMBER_RAW)?.slice(1) ||
  ADMIN_WHATSAPP_NUMBER_RAW.replace(/[^0-9]/g, '');

export interface LeadNotification {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}

// Sends the admin a WhatsApp alert for a newly captured lead. Best-effort and
// fail-safe (returns configured:false when keys are absent) so callers never
// fail the form. Uses an approved template when WHATSAPP_LEAD_TEMPLATE is set
// (delivers outside the 24h window); otherwise falls back to plain text.
export async function notifyAdminNewLead(lead: LeadNotification): Promise<WhatsAppResult> {
  const summaryLines = [
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    ...(lead.phone ? [`Phone: ${lead.phone}`] : []),
    `Source: ${lead.source || 'Website'}`,
    ...(lead.message ? [`Message: ${lead.message}`] : []),
  ];

  const templateName = process.env.WHATSAPP_LEAD_TEMPLATE;
  if (templateName) {
    const lang = process.env.WHATSAPP_LEAD_TEMPLATE_LANG || 'en_US';
    // Static templates (no variable) and Meta's built-in "hello_world" take 0
    // params; set WHATSAPP_LEAD_TEMPLATE_VARS=0 for those. Default is one {{1}}
    // filled with the lead summary (no newlines; capped under Meta's limit).
    const params =
      (process.env.WHATSAPP_LEAD_TEMPLATE_VARS ?? '1') === '0'
        ? []
        : [summaryLines.join(' | ').replace(/\s+/g, ' ').trim().slice(0, 900)];
    return sendWhatsAppTemplate(ADMIN_WHATSAPP_NUMBER, templateName, lang, params);
  }

  const text = `🔔 New lead — Om Gauri Putra\n\n${summaryLines.join('\n')}`;
  return sendWhatsAppText(ADMIN_WHATSAPP_NUMBER, text);
}
