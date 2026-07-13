// Collision-resistant order id — timestamp + random suffix, base36. A plain
// Date.now() (or its last 8 digits) collides whenever two orders land in the
// same millisecond, which a duplicate-key insert then rejects outright.
export function generateOrderId(): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return 'OGP' + Date.now().toString(36).toUpperCase() + rand;
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type Order = {
  id: string;
  customerId: string;
  customer: string;
  email: string;
  phone: string;
  amount: number;
  items: number;
  status: OrderStatus;
  payment: string;
  date: string;
  address?: string;
  paid?: boolean;
  paymentId?: string;
  notes?: string;
  statusHistory?: { status: string; at: string; by: string }[];
  trackingNumber?: string;
  courier?: string;
  refundAmount?: number;
  refundStatus?: 'none' | 'partial' | 'full';
  // Itemized line items (the actual products in the order). `items` above
  // remains a plain COUNT for backwards compatibility with existing table/
  // stat code — this is the additional detail for the order-detail UI.
  lineItems?: { name: string; quantity: number; price: number; image?: string }[];
};

export const orders: Order[] = [];

export function getAllOrders(): Order[] {
  return orders;
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id);
}

export function getOrdersByStatus(status: OrderStatus): Order[] {
  return orders.filter((o) => o.status === status);
}

export function getOrdersByCustomer(customerId: string): Order[] {
  return orders.filter((o) => o.customerId === customerId);
}

export function getTotalRevenue(): number {
  return orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.amount, 0);
}

export function getStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    Pending: 'bg-[#7a2e2e]/10 text-[#7a2e2e]',
    Processing: 'bg-[#b8893a]/10 text-[#b8893a]',
    Shipped: 'bg-blue-500/10 text-blue-600',
    Delivered: 'bg-[#3d6b5a]/10 text-[#3d6b5a]',
    Cancelled: 'bg-gray-500/10 text-gray-600',
  };
  return colors[status];
}