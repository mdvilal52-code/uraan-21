// Transactional email via Resend (REST API — no SDK needed). Dormant until
// RESEND_API_KEY is set, so every send is a safe no-op until then. Used for
// security alerts and email OTP. Never throws.
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.SECURITY_EMAIL_FROM || 'Om Gauri Putra Security <security@omgauriputra.com>';

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
