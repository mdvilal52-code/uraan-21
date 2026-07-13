# Deployment & Setup Guide

This is the step-by-step guide to put the **Om Gauri Putra** store live and
turn on the admin panel, CRM, WhatsApp and database. No prior DevOps knowledge
needed — follow the steps in order.

The site works the moment you deploy it. Each integration below is optional and
**activates only when you add its keys** — until then the site falls back to
safe demo behaviour, so nothing ever breaks.

---

## 1. Put the website live on Vercel (required)

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Go to **https://vercel.com** → sign in with GitHub → **Add New… → Project**.
3. Pick this repository and click **Deploy**. That's it — your site is live at
   `https://<your-project>.vercel.app`.
4. To add a custom domain: Vercel → your project → **Settings → Domains**.

You change all the settings below in:
**Vercel → your project → Settings → Environment Variables**
(add each key + value, then **Redeploy** from the Deployments tab).

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
4. Add both to Vercel env vars and **Redeploy**.

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
3. Add to Vercel env vars and **Redeploy**:
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

- [ ] Deployed on Vercel
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
