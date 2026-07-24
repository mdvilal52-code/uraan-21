#!/usr/bin/env bash
# ── Generic Linux VPS setup script ───────────────────────────────────────────
# Tested on: Ubuntu 20.04/22.04/24.04, Debian 11/12, CentOS 7/8,
#            Rocky Linux 8/9, AlmaLinux 8/9, Fedora 38+
#
# What it does:
#   - Installs Node.js 20 LTS via NodeSource
#   - Installs PM2 globally
#   - Clones or updates the app
#   - Installs dependencies and builds
#   - Starts the app with PM2 (or restarts if already running)
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/setup.sh | bash
#   — or —
#   chmod +x scripts/setup.sh && ./scripts/setup.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/home/$(whoami)/om-gauri-putra}"
REPO_URL="${REPO_URL:-}"   # Set to your git remote, e.g. git@github.com:you/repo.git
BRANCH="${BRANCH:-main}"
PORT="${PORT:-3000}"

# ── Detect package manager ────────────────────────────────────────────────────
if command -v apt-get &>/dev/null; then
  PKG_MGR="apt"
elif command -v dnf &>/dev/null; then
  PKG_MGR="dnf"
elif command -v yum &>/dev/null; then
  PKG_MGR="yum"
else
  echo "ERROR: Unsupported Linux distribution. Install Node.js 20 manually." >&2
  exit 1
fi

echo "==> Package manager: $PKG_MGR"

# ── Install Node.js 20 if missing ────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -lt 18 ]]; then
  echo "==> Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null || \
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  if [[ "$PKG_MGR" == "apt" ]]; then
    apt-get install -y nodejs
  else
    ${PKG_MGR} install -y nodejs
  fi
fi

echo "==> Node $(node -v), npm $(npm -v)"

# ── Install PM2 ───────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "==> Installing PM2..."
  npm install -g pm2
fi

# ── Clone or update the repo ──────────────────────────────────────────────────
if [[ -z "$REPO_URL" ]]; then
  echo "==> REPO_URL not set — skipping git clone."
  echo "    Copy your project files to $APP_DIR manually, then re-run."
else
  if [[ -d "$APP_DIR/.git" ]]; then
    echo "==> Updating existing repo in $APP_DIR..."
    git -C "$APP_DIR" fetch origin
    git -C "$APP_DIR" checkout "$BRANCH"
    git -C "$APP_DIR" pull origin "$BRANCH"
  else
    echo "==> Cloning into $APP_DIR..."
    git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
fi

cd "$APP_DIR"

# ── Environment file ──────────────────────────────────────────────────────────
if [[ ! -f .env.local ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env.local
    echo ""
    echo "IMPORTANT: Edit $APP_DIR/.env.local and fill in your values,"
    echo "           then re-run this script to complete the deployment."
    echo ""
  fi
fi

# ── Install and build ─────────────────────────────────────────────────────────
echo "==> Installing dependencies..."
npm ci --legacy-peer-deps

echo "==> Building production bundle..."
npm run build

# ── Create logs directory ─────────────────────────────────────────────────────
mkdir -p logs

# ── Start with PM2 ───────────────────────────────────────────────────────────
echo "==> Starting/restarting with PM2..."
if pm2 list | grep -q "om-gauri-putra"; then
  pm2 restart ecosystem.config.js --env production
else
  pm2 start ecosystem.config.js --env production
fi

pm2 save

echo ""
echo "==> App is running at http://localhost:$PORT"
echo "==> To enable auto-start on reboot, run:"
echo "      pm2 startup"
echo "    and follow the printed command."
echo ""
echo "==> To install Nginx as reverse proxy, see: deploy/nginx.conf"
echo "==> To manage the app: pm2 status | pm2 logs | pm2 restart om-gauri-putra"
