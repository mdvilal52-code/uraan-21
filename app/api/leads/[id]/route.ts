import { NextResponse } from 'next/server';
import { dbUpdateLeadStatus, dbDeleteLead } from '@/lib/leadsDb';
import { LEAD_STATUSES, type LeadStatus } from '@/lib/leads';

// PATCH → update a lead's status.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const status = String(body.status || '') as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: 'Invalid status.' }, { status: 400 });
  }

  const ok = await dbUpdateLeadStatus(params.id, status);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not update lead.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}

// DELETE → remove a lead.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ok = await dbDeleteLead(params.id);
  if (!ok) return NextResponse.json({ ok: false, error: 'Could not delete lead.' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
