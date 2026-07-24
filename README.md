# Om Gauri Putra — Jewellery Store

A full-featured Next.js e-commerce storefront with admin panel, CRM, WhatsApp
integration, Razorpay payments, and Supabase database.

## Getting Started (local development)

```bash
npm install
cp .env.example .env.local   # fill in your values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.
Admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

## Deploy

This is a standard Next.js app — deploy it on **any** Node.js-capable host:

- **VPS / Linux server:** `npm ci && npm run build && npm start` (use PM2 + Nginx)
- **Docker:** see `Dockerfile` example in [`DEPLOYMENT.md`](./DEPLOYMENT.md)
- **Railway / Render / Coolify / DigitalOcean App Platform:** connect GitHub repo and deploy

Full step-by-step instructions (including Supabase, Razorpay, WhatsApp, and
scheduled cron setup) are in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Payments:** Razorpay
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth + cookie-based admin sessions
- **Notifications:** WhatsApp Business Cloud API + Resend (email)
- **Shipping:** Shiprocket integration

## Environment Variables

All required and optional variables are documented in [`.env.example`](./.env.example).
