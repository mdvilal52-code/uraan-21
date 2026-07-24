# syntax=docker/dockerfile:1
# Hosting-agnostic production image built on the Next.js standalone output.
# Runs anywhere Docker does (VPS, DigitalOcean, AWS, Azure, GCP, Coolify, …)
# with no platform adapter. Build:  docker build -t om-gauri-putra .
# Run:    docker run -p 3000:3000 --env-file .env om-gauri-putra

# ---- deps: install production-resolvable node_modules once, cached ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the app to a self-contained server ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runner: minimal runtime image (only the traced standalone bundle) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# The standalone output already contains a minimal server + only the
# node_modules it actually traced, so the final image stays small.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
