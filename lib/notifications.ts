// Shared types for the admin notification feed (the bell in the topbar).
export type NotificationType =
  | 'new_order'
  | 'new_customer'
  | 'payment_received'
  | 'order_cancelled'
  | 'low_stock'
  | 'out_of_stock'
  | 'new_review'
  | 'contact_form'
  | 'newsletter_subscriber'
  | 'admin_login'
  | 'failed_login'
  | 'crm_sync'
  | 'whatsapp_campaign'
  | 'email_campaign'
  | 'backup_completed'
  | 'system_error'
  | 'deployment_completed';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  link?: string;
  actorEmail?: string;
  createdAt: string;
  updatedAt: string;
};

/** "2 minutes ago" / "3 hours ago" / "5 days ago", falling back to a date. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function formatUnreadCount(count: number): string {
  if (count <= 0) return '';
  return count > 99 ? '99+' : String(count);
}

export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  new_order: 'New Order',
  new_customer: 'New Customer',
  payment_received: 'Payment Received',
  order_cancelled: 'Order Cancelled',
  low_stock: 'Low Stock',
  out_of_stock: 'Product Out Of Stock',
  new_review: 'New Review',
  contact_form: 'Contact Form',
  newsletter_subscriber: 'Newsletter Subscriber',
  admin_login: 'Admin Login',
  failed_login: 'Failed Login Attempt',
  crm_sync: 'CRM Sync',
  whatsapp_campaign: 'WhatsApp Campaign',
  email_campaign: 'Email Campaign',
  backup_completed: 'Backup Completed',
  system_error: 'System Error',
  deployment_completed: 'Deployment Completed',
};
