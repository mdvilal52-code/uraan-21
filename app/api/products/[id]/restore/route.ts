import { NextResponse } from 'next/server';
import { dbRestoreProduct } from '@/lib/productsDb';
import { isAdminRequest } from '@/lib/adminApi';
import { logAudit } from '@/lib/audit';
import { currentApiAdmin } from '@/lib/security/guard';

// POST → restore a soft-deleted product (admin only).
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }
  const ok = await dbRestoreProduct(params.id);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Could not restore product.' }, { status: 502 });
  }

  const admin = await currentApiAdmin();
  await logAudit({ actorEmail: admin?.email, actorRole: admin?.role, action: 'product_restored', target: params.id });

  return NextResponse.json({ ok: true });
}
