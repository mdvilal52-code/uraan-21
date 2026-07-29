# Deployment & Setup Guide

This is the step-by-step guide to put the **Om Gauri Putra** store live and
turn on the admin panel, CRM, WhatsApp and database. No prior DevOps knowledge
needed — follow the steps in order.

The site works the moment you deploy it. Each integration below is optional and
**activates only when you add its keys** — until then the site falls back to
safe demo behaviour, so nothing ever breaks.

---

## 1. Put the website live (required)

This app is **hosting-agnostic** — it builds to a self-contained Node server
and runs identically on any Ubuntu VPS, Docker host, DigitalOcean, AWS, Azure,
GCP, Hostinger, Coolify, etc. There is no platform lock-in and no adapter to
install. Pick whichever of the three below fits you.

Set your configuration (the keys from the sections below) in the environment
however your host does it: a `.env` file next to the app, your VPS shell
profile, your container's `--env-file`, or your panel's "Environment
variables" screen. `NEXT_PUBLIC_SITE_URL` should be your public origin, e.g.
`https://www.omgauriputra.com`.

**Option A — Node + PM2 on a VPS (recommended for a plain server)**

```bash
npm ci
npm run build
# copy the static assets next to the standalone server (once per build)
cp -r .next/static  .next/standalone/.next/static
cp -r public        .next/standalone/public
pm2 start ecosystem.config.js && pm2 save     # uses the bundled config
```

Then put Nginx (or Apache) in front as a reverse proxy to `127.0.0.1:3000`:

```nginx
server {
  listen 80;
  server_name www.omgauriputra.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

(Add HTTPS with `certbot --nginx`.)

**Option B — Docker**

```bash
docker build -t om-gauri-putra .
docker run -d -p 3000:3000 --env-file .env om-gauri-putra
```

**Option C — any Node host** — run `npm run build`, then start the standalone
server with `node .next/standalone/server.js` (after copying `.next/static`
and `public` as in Option A). `npm start` also works for non-standalone hosts.

**Automatic abandoned-cart reminders:** point any scheduler at the reminder
endpoint once `CRON_SECRET` and the WhatsApp keys (step 5) are set — e.g. a
system crontab entry every 2 hours:

```cron
0 */2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/abandoned-cart-reminders
```

---

## 2. Secure the admin panel (do this before going live)

The admin panel lives at `/admin` and is protected by a login. Set your own
credentials:

| Variable | What to put |
| --- | --- |
| `ADMIN_EMAIL` | the email you'll log in with |
| `ADMIN_PASSWORD` | a strong password |
| `ADMIN_SESSION_SECRET` | any long random string (e.g. mash the keyboard) |

> If you skip this, the defaults are `admin@omgauriputra.com` / `omgauri2024`.
> **Change them** before sharing the site.

Log in at `https://<your-site>/admin/login`.

---

## 3. Turn on the database (Supabase) — real orders & leads

This makes orders and CRM leads save permanently and show in the admin from any
device.

1. Create a free project at **https://supabase.com**.
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → set as `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → set as
     `SUPABASE_SERVICE_ROLE_KEY`
4. Add both to your environment (see step 1) and **restart / redeploy**.

Now the admin **Orders**, **CRM / Leads** and **Products** pages show a green
**“Database”** badge and store live data. Without it, they show sample/bundled
data.

**Load your catalogue:** open **Admin → Products**. The first time, click
**“Import catalogue”** to copy the bundled demo products into your database.
After that, any product you **add / edit / delete** in the admin shows on the
live website for all visitors.

**Product image uploads:** in Supabase → **Storage**, click **New bucket**, name
it exactly `product-images`, and tick **Public**. Now the **Upload** button on
the product form works.

---

## 4. Payments (Razorpay) — take real money

Real card / UPI / netbanking / wallet payments at checkout.

1. Create an account at **https://razorpay.com** and complete the KYC.
2. **Dashboard → Settings → API Keys → Generate Key.**
3. Add to your environment (see step 1) and **restart / redeploy**:
   - **Key Id** → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

Payments are verified server-side, so only genuine payments confirm an order.
Until these keys are set, checkout still works but places the order **without**
taking an online payment (handy for testing and Cash-on-Delivery).

---

## 5. WhatsApp

- **Chat button (works now):** set `NEXT_PUBLIC_WHATSAPP_NUMBER` to your number
  in international format, digits only (e.g. `9188519XXXXX`). All "Chat on
  WhatsApp" buttons use it.
- **Automatic messages + inbound leads (optional):** create a WhatsApp app at
  **https://developers.facebook.com → WhatsApp → API Setup** and set
  `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`. Point
  the webhook to `https://<your-site>/api/whatsapp/webhook` using the same
  verify token. Inbound chats then appear automatically in the CRM.
- **Recommended:** also set `WHATSAPP_APP_SECRET` (your app's secret, under
  **App Settings → Basic**). Without it, anyone who finds the webhook URL
  could POST fake messages that become CRM leads; with it, every inbound
  message's signature is verified before it's trusted.

---

## 5b. Backups (Admin → Backups)

Automated database + Storage backups, restorable from the admin panel.

1. Install `postgresql-client` on the VPS (gives you `pg_dump` / `psql`):
   `apt-get install -y postgresql-client` (Ubuntu/Debian).
2. Supabase → **Project Settings → Database → Connection string** → copy the
   URI and set it as `SUPABASE_DB_URL` (this is different from `SUPABASE_URL`,
   which is the REST API host, not a Postgres connection string).
3. Restart / redeploy. **Admin → Backups** now shows a green "configured"
   banner instead of listing what's missing, and **Backup Now** works.
4. Point a daily cron job at the backup endpoint (reuses `CRON_SECRET` from
   step 1's abandoned-cart-reminder cron):
   ```cron
   0 2 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/backups
   ```
   Each run creates a scheduled backup, then prunes old ones per
   `BACKUP_RETENTION_DAILY` / `BACKUP_RETENTION_MONTHLY` (defaults: 30 daily,
   12 monthly — see `.env.example`).

Every restore automatically takes a fresh safety backup of the current
database first, and every delete removes the backup from disk immediately —
nothing is just hidden.

---

## 6. CRM (HubSpot, optional)

Website enquiries already save to your Supabase database (step 3) and show in
**CRM / Leads**. To *also* push them to HubSpot, set `HUBSPOT_PORTAL_ID` and
`HUBSPOT_FORM_GUID` (see `.env.example`).

---

## 7. Instagram feed (optional)

Set `INSTAGRAM_ACCESS_TOKEN` to show your live Instagram grid on the homepage,
and `NEXT_PUBLIC_INSTAGRAM_URL` for the "Follow" button.

---

## Quick checklist

- [ ] Deployed (VPS + PM2, Docker, or any Node host — see step 1)
- [ ] Changed `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`
- [ ] Ran `supabase/schema.sql` and added `SUPABASE_*` keys
- [ ] Created the public `product-images` Storage bucket
- [ ] Imported the catalogue (Admin → Products → Import)
- [ ] Added Razorpay keys (`NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`)
- [ ] Set `NEXT_PUBLIC_WHATSAPP_NUMBER`
- [ ] (optional) WhatsApp Cloud API, HubSpot, Instagram keys

All variable names and hints live in [`.env.example`](./.env.example).

> **Product catalogue:** with the database connected and the catalogue imported
> (step 3), products are fully managed from **Admin → Products** — add, edit and
> delete show on the live site for everyone. Until then the site serves the
> bundled demo catalogue so it's never empty.
