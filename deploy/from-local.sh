#!/usr/bin/env bash
# Deploy dari mesin lokal ke VPS via rsync + SSH.
# Usage:
#   VPS_HOST=1.2.3.4 VPS_USER=root DOMAIN=shop.example.com bash deploy/from-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
: "${DOMAIN:?Set DOMAIN}"

VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/topperspediashop}"
SSH="ssh -p ${VPS_PORT} -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_HOST}"
RSYNC="rsync -az --delete --exclude node_modules --exclude .next --exclude .git --exclude .env.local -e \"ssh -p ${VPS_PORT} -o StrictHostKeyChecking=accept-new\""

echo "==> Test SSH"
$SSH "echo ok && uname -a"

echo "==> Upload project"
eval $RSYNC "\"$ROOT/\"" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "==> Generate production .env on server (if missing)"
$SSH "bash -s" <<EOF
set -euo pipefail
cd ${REMOTE_DIR}
if [[ ! -f .env ]]; then
  SECRET=\$(openssl rand -base64 32)
  DB_PASS=\$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
  cat > .env <<ENV
POSTGRES_PASSWORD=\${DB_PASS}
BETTER_AUTH_SECRET=\${SECRET}
BETTER_AUTH_URL=https://${DOMAIN}
NEXT_PUBLIC_BETTER_AUTH_URL=https://${DOMAIN}
DATABASE_URL=postgresql://topperspediashop:\${DB_PASS}@localhost:5432/topperspediashop
ENV
  echo "Created ${REMOTE_DIR}/.env"
else
  echo ".env already exists — keeping current secrets"
  # Pastikan URL auth mengikuti domain terbaru
  sed -i "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://${DOMAIN}|" .env
  sed -i "s|^NEXT_PUBLIC_BETTER_AUTH_URL=.*|NEXT_PUBLIC_BETTER_AUTH_URL=https://${DOMAIN}|" .env
fi
EOF

echo "==> Setup VPS (Docker, Nginx, firewall) — idempotent"
$SSH "cd ${REMOTE_DIR} && sudo bash deploy/setup-vps.sh"

echo "==> Deploy app + database"
$SSH "cd ${REMOTE_DIR} && bash deploy/deploy.sh"

echo "==> Nginx reverse proxy"
$SSH "cd ${REMOTE_DIR} && sudo DOMAIN=${DOMAIN} bash deploy/nginx/install.sh"

echo "==> Seed admin accounts"
$SSH "cd ${REMOTE_DIR} && docker compose --profile tools run --rm migrate sh -lc 'corepack enable && pnpm install --frozen-lockfile && pnpm db:seed'"

echo ""
echo "Deploy selesai (HTTP)."
echo "Manual: arahkan DNS A record ${DOMAIN} -> ${VPS_HOST}, lalu jalankan:"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}'"
