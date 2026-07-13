// Browser-persisted return/exchange (RMA) store (localStorage), so the admin
// panel's returns CRUD survives a page refresh without a backend — the same
// demo-friendly pattern used by lib/coupons.ts.

export type ReturnType = 'return' | 'exchange';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'refunded' | 'replaced';

export type Return = {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  reason: string;
  type: ReturnType;
  status: ReturnStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
};

const KEY = 'ogp_returns';

const seedReturns: Return[] = [
  {
    id: 'RMA0001',
    orderId: 'OGP10023456',
    customerName: 'Priya Sharma',
    customerPhone: '9876543210',
    customerEmail: 'priya@example.com',
    reason: 'Size did not fit as expected.',
    type: 'exchange',
    status: 'approved',
    adminNotes: 'Exchanging for a larger size.',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-21T09:00:00.000Z',
  },
  {
    id: 'RMA0002',
    orderId: 'OGP10023890',
    customerName: 'Anjali Mehta',
    customerPhone: '9812345678',
    reason: 'Changed my mind.',
    type: 'return',
    status: 'requested',
    createdAt: '2026-07-01T14:30:00.000Z',
    updatedAt: '2026-07-01T14:30:00.000Z',
  },
];

function read(): Return[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Return[]) : null;
  } catch {
    return null;
  }
}

function write(list: Return[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function getReturns(): Return[] {
  const stored = read();
  if (stored) return stored;
  write(seedReturns);
  return seedReturns;
}

export type ReturnInput = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  reason: string;
  type: ReturnType;
};

export function addReturn(input: ReturnInput): Return {
  const list = getReturns();
  const now = new Date().toISOString();
  const record: Return = {
    id: 'RMA' + Date.now().toString(36).toUpperCase(),
    orderId: input.orderId.trim(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail?.trim() || undefined,
    reason: input.reason.trim(),
    type: input.type,
    status: 'requested',
    createdAt: now,
    updatedAt: now,
  };
  write([record, ...list]);
  return record;
}

export function updateReturnStatus(id: string, status: ReturnStatus, adminNotes?: string): void {
  write(
    getReturns().map((r) =>
      r.id === id
        ? {
            ...r,
            status,
            adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
            updatedAt: new Date().toISOString(),
          }
        : r
    )
  );
}

export function getReturnStatusColor(status: ReturnStatus): string {
  const colors: Record<ReturnStatus, string> = {
    requested: 'bg-[#b8893a]/10 text-[#b8893a]',
    approved: 'bg-blue-500/10 text-blue-600',
    rejected: 'bg-gray-500/10 text-gray-600',
    refunded: 'bg-[#3d6b5a]/10 text-[#3d6b5a]',
    replaced: 'bg-[#3d6b5a]/10 text-[#3d6b5a]',
  };
  return colors[status];
}
