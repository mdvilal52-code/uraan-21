import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/adminSession';
import { requestSecurityContext } from '@/lib/security/request';
import { getGeo, geoLabel } from '@/lib/security/geo';
import { verifyOtp } from '@/lib/security/otp';
import { approveDevice } from '@/lib/security/devices';
import { sendEmail, isEmailConfigured } from '@/lib/email';
import { loginAlertEmail } from '@/lib/security/emails';
import { logSecurityEvent } from '@/lib/audit';

// Verifies the emailed new-device code (#4) and approves this device (#6).
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const { ip, userAgent, device, fingerprint } = requestSecurityContext(request);
  const ok = await verifyOtp(admin.email, 'new_device', String(body.code || ''));
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid or expired code.' }, { status: 400 });
  }

  await approveDevice(admin.email, fingerprint);
  await logSecurityEvent({ type: 'device_approved', severity: 'info', email: admin.email, ip, userAgent });

  if (isEmailConfigured()) {
    const { subject, html } = loginAlertEmail({
      device: `${device.browser} · ${device.os} · ${device.deviceType}`,
      location: geoLabel(getGeo(request)),
      ip,
      time: new Date().toLocaleString('en-IN'),
    });
    await sendEmail(admin.email, subject, html);
  }

  return NextResponse.json({ ok: true });
}
