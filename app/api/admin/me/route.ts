import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE, ADMIN_EMAIL, adminSessionToken } from '@/lib/adminAuth';
import { getCurrentAdmin } from '@/lib/adminSession';
import { passwordAge } from '@/lib/security/passwordHistory';

// Returns the currently signed-in admin + role, for role-aware UI. Legacy
// break-glass login is treated as the Owner.
export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (token && token === (await adminSessionToken())) {
    return NextResponse.json({ ok: true, admin: { email: ADMIN_EMAIL, role: 'owner', via: 'legacy' } });
  }

  const admin = await getCurrentAdmin();
  if (admin) {
    const age = await passwordAge(admin.email);
    return NextResponse.json({
      ok: true,
      admin: {
        ...admin,
        via: 'supabase',
        passwordExpired: age?.expired ?? false,
        passwordChangedAt: age?.changedAt ?? null,
      },
    });
  }
  return NextResponse.json({ ok: false }, { status: 401 });
}
