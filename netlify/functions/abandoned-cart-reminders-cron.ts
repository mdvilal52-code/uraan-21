import { schedule } from '@netlify/functions';

// Netlify Scheduled Function — replaces the Vercel Cron entry that used to
// live in vercel.json. Runs on the same 2-hour cadence and simply re-invokes
// the existing, already-authenticated Next.js route (see
// app/api/cron/abandoned-cart-reminders/route.ts) so the reminder logic
// itself stays in one place instead of being duplicated here.
export const handler = schedule('0 */2 * * *', async () => {
  const secret = process.env.CRON_SECRET;
  const base = process.env.URL || process.env.DEPLOY_PRIME_URL;
  if (!secret || !base) {
    return { statusCode: 401, body: 'CRON_SECRET or site URL not configured.' };
  }

  const res = await fetch(`${base}/api/cron/abandoned-cart-reminders`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  return { statusCode: res.status, body: await res.text() };
});
