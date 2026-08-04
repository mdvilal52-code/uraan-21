// HTML templates for security email (login alerts, new-device approval).
import { BUSINESS_NAME, BUSINESS_ADDRESS_INLINE } from '@/lib/business';

function wrap(title: string, body: string): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;color:#1a1410;line-height:1.6">
    <p style="color:#b8893a;letter-spacing:2px;text-transform:uppercase;font-size:12px;font-weight:700">${BUSINESS_NAME} · Security</p>
    <h2 style="margin:8px 0 16px">${title}</h2>
    ${body}
    <p style="color:#9a8c75;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:12px">
      If this wasn't you, change your password and use “Sign out all devices” immediately.
    </p>
    <p style="color:#c4b8a3;font-size:11px;margin-top:12px">
      ${BUSINESS_NAME} · ${BUSINESS_ADDRESS_INLINE}
    </p>
  </div>`;
}

export function loginAlertEmail(d: { device: string; location: string; ip: string; time: string }) {
  return {
    subject: 'New sign-in to your admin account',
    html: wrap(
      'New sign-in detected',
      `<p>Device: <b>${d.device}</b></p><p>Location: <b>${d.location}</b></p><p>IP: ${d.ip}</p><p>Time: ${d.time}</p>`
    ),
  };
}

export function passwordResetEmail(d: { link: string; scope?: 'admin' | 'account' }) {
  const label = d.scope === 'account' ? 'account' : 'admin';
  const noun = d.scope === 'account' ? 'your account' : 'your admin account';
  return {
    subject: `Reset your ${label} password — ${BUSINESS_NAME}`,
    html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;color:#1a1410;line-height:1.6">
      <p style="color:#b8893a;letter-spacing:2px;text-transform:uppercase;font-size:12px;font-weight:700">${BUSINESS_NAME}</p>
      <h2 style="margin:8px 0 16px">Reset your ${label} password</h2>
      <p>We received a request to reset the password for ${noun}. Click the button below to choose a new one:</p>
      <p style="margin:24px 0">
        <a href="${d.link}" style="display:inline-block;background:#1a1410;color:#e8d49b;text-decoration:none;padding:14px 28px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700">Reset password</a>
      </p>
      <p style="color:#9a8c75;font-size:12px">This link expires in 1 hour and can be used once. If the button doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break:break-all;font-size:12px;color:#6b5d4c">${d.link}</p>
      <p style="color:#9a8c75;font-size:12px;margin-top:24px;border-top:1px solid #eee;padding-top:12px">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
      <p style="color:#c4b8a3;font-size:11px;margin-top:12px">${BUSINESS_NAME} · ${BUSINESS_ADDRESS_INLINE}</p>
    </div>`,
  };
}

export function newDeviceEmail(d: { code: string; device: string; location: string }) {
  return {
    subject: `Approve a new device — ${BUSINESS_NAME}`,
    html: wrap(
      'Approve a new device',
      `<p>A sign-in from a new device needs approval:</p>
       <p>Device: <b>${d.device}</b></p><p>Location: <b>${d.location}</b></p>
       <p>Enter this code to approve it:</p>
       <p style="font-size:30px;letter-spacing:8px;font-weight:700;color:#1a1410">${d.code}</p>
       <p style="color:#9a8c75;font-size:12px">This code expires in 10 minutes.</p>`
    ),
  };
}
