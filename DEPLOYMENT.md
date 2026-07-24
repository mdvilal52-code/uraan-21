# Deployment & Setup Guide

This is the step-by-step guide to put the **Om Gauri Putra** store live and
turn on the admin panel, CRM, WhatsApp and database. No prior DevOps knowledge
needed — follow the steps in order.

The site works the moment you deploy it. Each integration below is optional and
**activates only when you add its keys** — until then the site falls back to
safe demo behaviour, so nothing ever breaks.

---

## 1. Put the website live (pick any host)

This is a standard Next.js application. It runs on any hosting platform that
supports Node.js. Choose the option that suits you:

### Option A — Managed platforms (zero server admin)

| Platform | Steps |
|----------|-------|
| **Railway** | Push repo to GitHub → New Project → Deploy from GitHub → pick repo → done |
| **Render** | New Web Service → Connect repo → Build: `npm run build` → Start: `npm start` |
| **Coolify** | Add resource → Public/Private repo → build pack: Nixpacks or Docker → deploy |
| **DigitalOcean App Platform** | Create App → GitHub repo → auto-detect Next.js → deploy |

### Option B — VPS / Docker (full control)

```bash
# 1. Clone and install
git clone <your-repo-url> app && cd app
npm ci

# 2. Create your env file
cp .env.example .env.local
# Edit .env.local and fill in your values

# 3. Build
npm run build

# 4. Start (keep alive with PM2)
npm install -g pm2
pm2 start "npm start" --name om-gauri-putra
pm2 save && pm2 startup
```

Reverse-proxy with **Nginx** (recommended):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then obtain TLS with `certbot --nginx -d yourdomain.com`.

### Option C — Docker

```dockerfile
# Dockerfile (place at repo root)
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t om-gauri-putra .
docker run -p 3000:3000 --env-file .env.local om-gauri-putra
```

### Option D — Hostinger VPS / cPanel

1. SSH into your VPS and run the same steps as **Option B** above.
2. Use the Nginx config above as a virtual host.
3. Alternatively, use Hostinger's Node.js app manager if available.

---

## 2. Set your environment variables

Copy `.env.example` to `.env.local` (development) or configure the same keys
in your host's environment variable panel. All variables are listed in
[`.env.example`](./.env.example) with explanations.

**Required at minimum:**
- `NEXT_PUBLIC_SITE_URL` — your live domain (e.g. `https://yourdomain.com`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` — change before going live

---

## 3. Secure the admin panel (do this before going live)

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

## 4. Turn on the database (Supabase) — real orders & leads

This makes orders and CRM leads save permanently and show in the admin from any
device.

1. Create a free project at **https://supabase.com**.
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → set as `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → set as
     `SUPABASE_SERVICE_ROLE_KEY`
4. Add both to your environment variables and redeploy.

Now the admin **Orders**, **CRM / Leads** and **Products** pages show a green
**"Database"** badge and store live data. Without it, they show sample/bundled
data.

**Load your catalogue:** open **Admin → Products**. The first time, click
**"Import catalogue"** to copy the bundled demo products into your database.
After that, any product you **add / edit / delete** in the admin shows on the
live website for all visitors.

**Product image uploads:** in Supabase → **Storage**, click **New bucket**, name
it exactly `product-images`, and tick **Public**. Now the **Upload** button on
the product form works.

---

## 5. Payments (Razorpay) — take real money

Real card / UPI / netbanking / wallet payments at checkout.

1. Create an account at **https://razorpay.com** and complete the KYC.
2. **Dashboard → Settings → API Keys → Generate Key.**
3. Add to your environment variables and redeploy:
   - **Key Id** → `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`

Payments are verified server-side, so only genuine payments confirm an order.
Until these keys are set, checkout still works but places the order **without**
taking an online payment (handy for testing and Cash-on-Delivery).

---

## 6. WhatsApp

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

## 7. Abandoned-cart reminders (scheduled cron)

The route `GET /api/cron/abandoned-cart-reminders` sends WhatsApp nudges to
customers who left items in their cart. You need to call it on a schedule
(every 2 hours is recommended) with an `Authorization: Bearer <CRON_SECRET>`
header.

Set `CRON_SECRET` to any long random string, then schedule a recurring HTTP
request using whichever tool fits your stack:

| Tool | Example |
|------|---------|
| **GitHub Actions** | `schedule: cron: '0 */2 * * *'` + a `curl` step |
| **VPS crontab** | `0 */2 * * * curl -H "Authorization: Bearer $CRON_SECRET" https://yourdomain.com/api/cron/abandoned-cart-reminders` |
| **Railway / Render / Coolify** | Built-in cron job UI pointing to the same URL |
| **EasyCron / cron-job.org** | Add the URL + Authorization header |

Also requires `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` to be set.

---

## 8. CRM (HubSpot, optional)

Website enquiries already save to your Supabase database (step 4) and show in
**CRM / Leads**. To *also* push them to HubSpot, set `HUBSPOT_PORTAL_ID` and
`HUBSPOT_FORM_GUID` (see `.env.example`).

---

## 9. Instagram feed (optional)

Set `INSTAGRAM_ACCESS_TOKEN` to show your live Instagram grid on the homepage,
and `NEXT_PUBLIC_INSTAGRAM_URL` for the "Follow" button.

---

## Quick checklist

- [ ] Deployed (VPS / Docker / Railway / Render / Coolify / DigitalOcean / etc.)
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your live domain
- [ ] Changed `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`
- [ ] Ran `supabase/schema.sql` and added `SUPABASE_*` keys
- [ ] Created the public `product-images` Storage bucket
- [ ] Imported the catalogue (Admin → Products → Import)
- [ ] Added Razorpay keys (`NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`)
- [ ] Set `NEXT_PUBLIC_WHATSAPP_NUMBER`
- [ ] (optional) Set `CRON_SECRET` + configure a scheduler for abandoned-cart reminders
- [ ] (optional) WhatsApp Cloud API, HubSpot, Instagram keys

All variable names and hints live in [`.env.example`](./.env.example).

> **Product catalogue:** with the database connected and the catalogue imported
> (step 4), products are fully managed from **Admin → Products** — add, edit and
> delete show on the live site for everyone. Until then the site serves the
> bundled demo catalogue so it's never empty.
