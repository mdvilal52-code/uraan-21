import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminSession';
import { requestSecurityContext } from '@/lib/security/request';
import { getGeo, geoLabel } from '@/lib/security/geo';
import { findDevice, upsertDevice } from '@/lib/security/devices';
import { recordAttempt } from '@/lib/security/rateLimit';
import { createOtp } from '@/lib/security/otp';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { loginAlertEmail, newDeviceEmail } from '@/lib/security/emails';
import { logAudit, logSecurityEvent } from '@/lib/audit';

// Post-login processing for a Supabase Auth sign-in: records the success, the
// device + location, sends a login alert (#24, #25), and — when email is set up
// — requires email-OTP approval for a new device (#5, #6). Returns
// { needsApproval } so the login page can prompt for the code. Dormant-safe:
// with no email provider it never blocks, just records.
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const { ip, userAgent, device, fingerprint } = requestSecurityContext(request);
  const location = geoLabel(getGeo(request));
  const deviceLabel = `${device.browser} · ${device.os} · ${device.deviceType}`;
  const time = new Date().toLocaleString('en-IN');

  await recordAttempt({ email: admin.email, ip, userAgent, success: true });
  await logAudit({
    actorEmail: admin.email,
    actorRole: admin.role,
    action: 'admin_login',
    ip,
    userAgent,
    metadata: { location, via: 'supabase' },
  });

  const known = await findDevice(admin.email, fingerprint);
  const isNewDevice = !known || !known.approved;
  await upsertDevice({ email: admin.email, fingerprint, browser: device.browser, os: device.os, ip });

  // Risk-based step-up (#27): a new device → require email approval (#6).
  if (isNewDevice && isEmailConfigured()) {
    await logSecurityEvent({ type: 'new_device', severity: 'warning', email: admin.email, ip, userAgent, metadata: { location } });
    const code = await createOtp(admin.email, 'new_device');
    if (code) {
      const { subject, html } = newDeviceEmail({ code, device: deviceLabel, location });
      await sendEmail(admin.email, subject, html);
      return NextResponse.json({ ok: true, needsApproval: true });
    }
  }

  // Trusted device (or email off): notify and continue.
  if (isEmailConfigured()) {
    const { subject, html } = loginAlertEmail({ device: deviceLabel, location, ip, time });
    await sendEmail(admin.email, subject, html);
  } else {
    // Without email, the first-seen device is auto-trusted so it isn't
    // re-flagged once email is later enabled.
    await upsertDevice({ email: admin.email, fingerprint, approved: true });
  }

  return NextResponse.json({ ok: true, needsApproval: false });
}
