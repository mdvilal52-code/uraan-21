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

export function newDeviceEmail(d: { code: string; device: string; location: string }) {
  return {
    subject: 'Approve a new device — Om Gauri Putra',
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
