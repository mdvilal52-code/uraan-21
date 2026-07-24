# Om Gauri Putra

Production storefront + admin panel for the **Om Gauri Putra** jewellery store,
built with [Next.js](https://nextjs.org) (App Router), Supabase and Tailwind CSS.
It is **hosting-agnostic** — it builds to a self-contained Node server and runs
identically on any VPS, Docker host or Node platform, with no vendor lock-in.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site. Edit
`app/page.tsx` (or any file) and the page hot-reloads.

The site works immediately with bundled demo data. Every integration
(Supabase, Razorpay, WhatsApp, Instagram, …) activates only once you add its
keys and stays dormant otherwise, so nothing breaks before it is configured.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build (emits the standalone server) |
| `npm start` | Start the production server |
| `npm run lint` | ESLint |

## Deploy

The production build uses Next.js [standalone output](https://nextjs.org/docs/app/api-reference/next-config-js/output),
so it runs on any Ubuntu VPS, Docker, PM2 + Nginx, DigitalOcean, AWS, Azure,
GCP, Hostinger or Coolify without a platform adapter. A `Dockerfile` and a PM2
`ecosystem.config.js` are included.

See **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** for the full step-by-step guide
(Node/PM2, Docker, environment variables, database, payments and WhatsApp).
