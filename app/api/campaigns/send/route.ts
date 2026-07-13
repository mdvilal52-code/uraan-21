import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminApi';
import { currentApiAdmin } from '@/lib/security/guard';
import { sendWhatsAppText, sendWhatsAppTemplate } from '@/lib/whatsappServer';
import { sendEmail } from '@/lib/email';
import { dbInsertCampaignLog } from '@/lib/campaignsDb';
import { personalize, htmlWrap, type CampaignChannel, type CampaignRecipient } from '@/lib/campaigns';
import { logAudit } from '@/lib/audit';
import { checkLengths, isBodyTooLarge, MAX_LEN } from '@/lib/security/validate';
import { normalizePhone } from '@/lib/phone';
import { notify } from '@/lib/notify';

const MAX_RECIPIENTS = 500;

// POST → send a WhatsApp or Email campaign to a list of recipients (admin
// only). Loops sequentially — message volumes here are small/SMB-scale, so no
// concurrency control is needed.
export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  if (isBodyTooLarge(request)) {
    return NextResponse.json({ ok: false, error: 'Request too large.' }, { status: 413 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const channel: CampaignChannel = String(body.channel) === 'email' ? 'email' : 'whatsapp';
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  const recipients = Array.isArray(body.recipients) ? (body.recipients as CampaignRecipient[]) : [];

  if (!message) {
    return NextResponse.json({ ok: false, error: 'Message is required.' }, { status: 400 });
  }
  if (channel === 'email' && !subject) {
    return NextResponse.json({ ok: false, error: 'Subject is required for email campaigns.' }, { status: 400 });
  }
  if (!recipients.length) {
    return NextResponse.json({ ok: false, error: 'At least one recipient is required.' }, { status: 400 });
  }
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { ok: false, error: `Campaigns are limited to ${MAX_RECIPIENTS} recipients.` },
      { status: 400 }
    );
  }
  const lengthError = checkLengths({
    Subject: { value: subject, max: MAX_LEN.short },
    Message: { value: message, max: MAX_LEN.text },
  });
  if (lengthError) {
    return NextResponse.json({ ok: false, error: lengthError }, { status: 400 });
  }

  let sentCount = 0;
  let failedCount = 0;
  let warning: string | undefined;

  if (channel === 'whatsapp') {
    const whatsappConfigured = !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    if (!whatsappConfigured) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'WhatsApp is not connected — set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID before sending campaigns.',
        },
        { status: 400 }
      );
    }

    // Meta only delivers free-form text to a recipient who messaged the
    // business within the last 24 hours — a marketing blast is almost always
    // outside that window, so it gets silently rejected. An approved template
    // (WHATSAPP_CAMPAIGN_TEMPLATE) is the only way to reliably deliver a
    // proactive campaign; without one we still attempt free-form text (it may
    // reach recently-active customers) but warn the admin why the rest fail.
    const templateName = process.env.WHATSAPP_CAMPAIGN_TEMPLATE;
    const templateLang = process.env.WHATSAPP_CAMPAIGN_TEMPLATE_LANG || 'en_US';
    // Static templates (no variable) and Meta's built-in "hello_world" take 0
    // params; set WHATSAPP_CAMPAIGN_TEMPLATE_VARS=0 for those. Default is one
    // {{1}} filled with the personalized message (no newlines — Meta rejects
    // template params containing them — and capped under Meta's limit).
    const templateVars = process.env.WHATSAPP_CAMPAIGN_TEMPLATE_VARS ?? '1';
    if (!templateName) {
      warning =
        'No WHATSAPP_CAMPAIGN_TEMPLATE is configured — only customers who messaged you in the last 24 hours ' +
        'will receive this campaign. Set up an approved Meta template and WHATSAPP_CAMPAIGN_TEMPLATE to reach everyone.';
    }

    for (const r of recipients) {
      const phone = normalizePhone(r.phone) || String(r.phone || '').trim();
      if (!phone) {
        failedCount++;
        continue;
      }
      try {
        const personalized = personalize(message, r.name);
        const result = templateName
          ? await sendWhatsAppTemplate(
              phone,
              templateName,
              templateLang,
              templateVars === '0' ? [] : [personalized.replace(/\s+/g, ' ').trim().slice(0, 900)]
            )
          : await sendWhatsAppText(phone, personalized);
        if (result.ok && result.configured) sentCount++;
        else failedCount++;
      } catch {
        failedCount++;
      }
    }
  } else {
    for (const r of recipients) {
      const email = String(r.email || '').trim();
      if (!email) {
        failedCount++;
        continue;
      }
      try {
        const ok = await sendEmail(email, subject, htmlWrap(personalize(message, r.name)));
        if (ok) sentCount++;
        else failedCount++;
      } catch {
        failedCount++;
      }
    }
  }

  const admin = await currentApiAdmin();
  await dbInsertCampaignLog({
    channel,
    subject: channel === 'email' ? subject : undefined,
    message,
    recipientCount: recipients.length,
    sentCount,
    failedCount,
    createdBy: admin?.email,
  });

  await logAudit({
    actorEmail: admin?.email,
    actorRole: admin?.role,
    action: 'campaign_sent',
    metadata: { channel, recipientCount: recipients.length, sentCount, failedCount },
  });

  notify(
    channel === 'whatsapp' ? 'whatsapp_campaign' : 'email_campaign',
    `Sent ${sentCount} of ${recipients.length} — ${failedCount} failed.`,
    { priority: failedCount > 0 ? 'high' : 'normal', link: '/admin/campaigns', actorEmail: admin?.email }
  ).catch(() => {});

  return NextResponse.json({ ok: true, sentCount, failedCount, warning });
}
