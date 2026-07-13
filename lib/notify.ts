// Best-effort admin-notification creator, called from the real event points
// that already exist in this app (order placed, payment verified, etc). Never
// throws — a notification failing to save must never break the action that
// triggered it (mirrors lib/whatsappServer.ts's fail-safe pattern).
import { dbCreateNotification } from './notificationsDb';
import { NOTIFICATION_TITLES, type NotificationPriority, type NotificationType } from './notifications';

export async function notify(
  type: NotificationType,
  message: string,
  opts: { priority?: NotificationPriority; link?: string; actorEmail?: string; title?: string } = {}
): Promise<void> {
  try {
    await dbCreateNotification({
      title: opts.title || NOTIFICATION_TITLES[type],
      message,
      type,
      priority: opts.priority,
      link: opts.link,
      actorEmail: opts.actorEmail,
    });
  } catch (err) {
    console.error('[notify]', type, err);
  }
}
