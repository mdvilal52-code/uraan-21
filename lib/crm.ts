// Server-side HubSpot CRM integration. Runs only in API routes, so the
// HubSpot credentials never reach the browser. Uses the HubSpot Forms
// Submissions API, which creates/updates a contact (lead) and stores the
// submitted fields — name, email, phone, message — with automatic
// de-duplication by email. Falls back gracefully when not configured so
// the site never breaks before credentials are added.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   HUBSPOT_PORTAL_ID  — your HubSpot account/portal id
//   HUBSPOT_FORM_GUID  — the guid of a HubSpot form with name/email/phone/message fields
// To use Zoho instead, swap the fetch below for Zoho's Leads API; the
// route contract (LeadInput / LeadResult) stays the same.

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
}

export interface LeadResult {
  ok: boolean;
  configured: boolean;
  error?: string;
}

export async function submitLead(input: LeadInput): Promise<LeadResult> {
  // Configured values fall back to the connected HubSpot account so the
  // integration works out of the box; override via env vars in Vercel.
  const portalId = process.env.HUBSPOT_PORTAL_ID || '246494562';
  const formGuid = process.env.HUBSPOT_FORM_GUID || '25e94130-48a1-4969-acd3-74db1bd5e557';

  // Not wired up yet: accept the lead so the form works, but flag it.
  if (!portalId || !formGuid) {
    console.warn('[CRM] HubSpot not configured — lead not sent:', {
      name: input.name,
      email: input.email,
    });
    return { ok: true, configured: false };
  }

  const parts = input.name.trim().split(/\s+/);
  const firstname = parts[0] || input.name;
  const lastname = parts.slice(1).join(' ');

  const fields = [
    { name: 'firstname', value: firstname },
    { name: 'lastname', value: lastname },
    { name: 'email', value: input.email },
    { name: 'phone', value: input.phone || '' },
    { name: 'message', value: input.message || '' },
  ].filter((f) => f.value);

  try {
    const res = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${portalId}/${formGuid}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields,
          context: { pageName: input.source || 'Website Enquiry' },
        }),
      }
    );

    if (res.ok) return { ok: true, configured: true };

    const detail = await res.text();
    console.error('[CRM] HubSpot submission failed:', res.status, detail);
    return { ok: false, configured: true, error: `CRM error (${res.status})` };
  } catch (err) {
    console.error('[CRM] HubSpot request error:', err);
    return { ok: false, configured: true, error: 'Could not reach CRM' };
  }
}
