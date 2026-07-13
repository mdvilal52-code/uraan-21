// Per-user order history stored in localStorage, keyed by the signed-in
// user's email. Lets the profile page show real orders placed at checkout.

import { getCurrentUser } from './auth';

export interface StoredOrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface StoredOrder {
  id: string;
  date: string;
  items: StoredOrderItem[];
  amount: number;
  payment: string;
  status: string;
  address: string;
}

function keyFor(email: string): string {
  return `ogp_orders_${email}`;
}

export function getUserOrders(): StoredOrder[] {
  const user = getCurrentUser();
  if (!user) return [];
  try {
    return JSON.parse(localStorage.getItem(keyFor(user.email)) || '[]');
  } catch {
    return [];
  }
}

export function saveOrder(order: StoredOrder): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  const existing = getUserOrders();
  localStorage.setItem(keyFor(user.email), JSON.stringify([order, ...existing]));
  return true;
}

export function userOrderStats(): { count: number; spent: number } {
  const orders = getUserOrders();
  return {
    count: orders.length,
    spent: orders.reduce((sum, o) => sum + o.amount, 0),
  };
}
