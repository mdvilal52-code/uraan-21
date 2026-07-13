# Admin Security

Defense-in-depth for the Om Gauri Putra admin panel, aligned with the OWASP
Top 10. The current credential login is preserved as **break-glass recovery**,
and every database-backed control **fails open / stays dormant** until its keys
are set — so nothing can lock you out or break the live store.

## Activate (one-time)

1. **Run the schema** — Supabase → SQL Editor → run `supabase/schema.sql`
   (idempotent). Creates the security tables: `admin_users`, `login_attempts`,
   `account_locks`, `audit_logs`, `security_events`, `trusted_devices`,
   `password_history`, `auth_sessions`, `email_otps`.
2. **Supabase Auth** — add `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`;
   create your admin in Supabase → Authentication → Users (email must match an
   `admin_users` row; the schema seeds an Owner).
3. **Email (Resend)** — add `RESEND_API_KEY` + `SECURITY_EMAIL_FROM` to enable
   OTP, new-device approval and login/location alerts.

Until step 2/3 are done the panel uses the recovery login and skips the
email/2FA steps.

## Controls (the 50)

| # | Control | How |
| --- | --- | --- |
| 1 | Email + password login | Supabase Auth |
| 2,3 | 2FA / authenticator app | Supabase MFA (TOTP) — `/admin/security` |
| 4 | Email OTP | `lib/security/otp.ts` (Argon2-hashed, 10-min TTL) |
| 5,6 | Device verification / new-device approval | `trusted_devices` + email OTP gate |
| 7 | Password hashing (Argon2) | Argon2id (`hash-wasm`) for history; Supabase bcrypt for the primary secret |
| 8 | Strong password policy | `lib/security/password.ts` (12+, mixed case, number, symbol) |
| 9 | Password history | last 5 Argon2 hashes (`password_history`) |
| 10 | Password expiry | `password_changed_at`, 90-day flag |
| 11,12 | Rate limiting / brute force | `login_attempts` + sliding window |
| 13 | Login attempt monitoring | `/admin/security` activity feed |
| 14,15 | Temp / permanent lockout | `account_locks` |
| 16 | Session timeout | 30-min idle auto sign-out |
| 17,18 | JWT / refresh rotation | Supabase Auth (HttpOnly cookies) |
| 19 | Force logout all devices | Supabase global sign-out |
| 20 | Session dashboard | `/admin/security` |
| 21,22,23 | IP / device fingerprint / browser | captured per request + stored |
| 24,25 | Location alerts / login emails | Vercel geo headers + Resend |
| 26,27 | Suspicious / risk-based auth | new-device + new-context step-up to email OTP |
| 28 | CSRF | same-origin check on all `/api` mutations (middleware) |
| 29 | XSS | React auto-escaping + CSP |
| 30 | SQL injection | parameterized Supabase queries |
| 31 | CSP | `next.config.js` (Report-Only → enforce) |
| 32,33,34 | HSTS / X-Frame-Options / X-Content-Type | security headers |
| 35,36,37 | Secure / HttpOnly / SameSite cookies | login + Supabase cookies |
| 38 | API auth middleware | `lib/adminApi.ts` + `middleware.ts` |
| 39-43 | RBAC (owner/super_admin/admin/staff) | `lib/rbac.ts`, `requireRole`, role-aware nav |
| 44,45 | Audit / security event logs | `audit_logs`, `security_events` |
| 46 | Database encryption | Supabase Postgres — AES-256 at rest (managed) |
| 47 | Backup encryption | Supabase automated backups — encrypted (managed) |
| 48 | Env var protection | secrets server-only; never in the client bundle |
| 49 | Secret key rotation | see below |
| 50 | Production-grade config | headers, `poweredByHeader:false`, fail-safe defaults |
| 51 | Input length limits | `lib/security/validate.ts` — caps every text field (name, message, address, description…) on all write routes so the DB/regex/hashing layer never sees unbounded input |
| 52 | Request size limits | `isBodyTooLarge()` rejects oversized JSON bodies by `Content-Length` on public endpoints (lead, orders, payment, WhatsApp webhook) before parsing |
| 53 | Upload validation | `/api/upload` — 5MB max file size + server-side MIME allowlist (JPEG/PNG/WebP/GIF), never trusts the client's declared type |
| 54 | Webhook signature verification | `/api/whatsapp/webhook` verifies Meta's `X-Hub-Signature-256` HMAC (`WHATSAPP_APP_SECRET`) before turning a POST into a CRM lead |
| 55 | Password length cap | `lib/security/password.ts` — 128-char max stops an oversized password from being hashed with Argon2id (memory-hard KDF) |

## Operational

- **Encryption at rest (#46/#47):** the database and its automated backups are
  encrypted by Supabase (AES-256). Keep Point-in-Time Recovery on for your plan.
- **Secret rotation (#49):** rotate on a schedule or after any suspected leak —
  - `ADMIN_SESSION_SECRET` — rotating it invalidates all recovery sessions.
  - `SUPABASE_SERVICE_ROLE_KEY` / anon key — rotate in Supabase → API, update Vercel.
  - `RESEND_API_KEY`, `RAZORPAY_KEY_SECRET` — rotate at the provider, update Vercel.
  After rotating, redeploy. Never commit secrets; all live in Vercel env vars.
- **Lost authenticator / lockout:** sign in via **“Use recovery login”** with
  `ADMIN_EMAIL` / `ADMIN_PASSWORD`. To clear a permanent lock, delete the row
  from `account_locks` for that email.

## Single-threaded runtime note

This app deploys to **Vercel** (`DEPLOYMENT.md` step 1), where each API route
runs as an isolated serverless function invocation rather than one long-lived
Node.js process. An unhandled error in one request does not take down other
visitors' requests, so a PM2/cluster-manager-style guardrail (relevant for a
traditional always-on Node server) is not needed here. If this app is ever
self-hosted on a persistent Node process instead, run it under PM2 or an
auto-restarting process manager.

## Reporting

Found a vulnerability? Email the address in `SECURITY_EMAIL_FROM`. Please do not
open a public issue.
