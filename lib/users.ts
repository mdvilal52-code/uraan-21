export type UserRole = 'customer' | 'admin' | 'staff';

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: UserRole;
  orders: number;
  totalSpent: number;
  joinedOn: string;
  avatar?: string;
};

export const customers: User[] = [];

export const adminUsers: User[] = [
  { id: 'A001', name: 'Admin User', email: 'admin@omgauriputra.com', phone: '+91 98765 00001', city: 'HQ', role: 'admin', orders: 0, totalSpent: 0, joinedOn: '01 Jan 2024' },
  { id: 'S001', name: 'Sales Manager', email: 'sales@omgauriputra.com', phone: '+91 98765 00002', city: 'HQ', role: 'staff', orders: 0, totalSpent: 0, joinedOn: '15 Jan 2024' },
  { id: 'S002', name: 'Support Staff', email: 'support@omgauriputra.com', phone: '+91 98765 00003', city: 'HQ', role: 'staff', orders: 0, totalSpent: 0, joinedOn: '20 Feb 2024' },
];

export function getAllCustomers(): User[] {
  return customers;
}

export function getCustomerById(id: string): User | undefined {
  return customers.find((c) => c.id === id);
}

export function getAllAdminUsers(): User[] {
  return adminUsers;
}

export function getTotalCustomers(): number {
  return customers.length;
}

export function getTotalCustomerRevenue(): number {
  return customers.reduce((sum, c) => sum + c.totalSpent, 0);
}

export function getAverageOrderValue(): number {
  const totalOrders = customers.reduce((sum, c) => sum + c.orders, 0);
  if (totalOrders === 0) return 0;
  return Math.round(getTotalCustomerRevenue() / totalOrders);
}