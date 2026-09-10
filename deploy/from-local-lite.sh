#!/usr/bin/env bash
# Deploy dari mesin lokal — build di sini, VPS hanya jalankan app (cocok 1GB RAM).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
: "${DOMAIN:?Set DOMAIN}"

VPS_PORT="${VPS_PORT:-22}"
REMOTE_DIR="${REMOTE_DIR:-/opt/topperspediashop}"
SSH="ssh -p ${VPS_PORT} -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_HOST}"

echo "==> Build production di mesin lokal"
pnpm build

echo "==> Upload source + build artifacts (tanpa node_modules/.git)"
rsync -az --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .env.local \
  --exclude data-vps.md \
  -e "ssh -p ${VPS_PORT} -o StrictHostKeyChecking=accept-new" \
  "$ROOT/" "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "==> Generate .env di server"
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
DATABASE_URL=postgresql://topperspediashop:\${DB_PASS}@127.0.0.1:5432/topperspediashop
ENV
else
  sed -i "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=https://${DOMAIN}|" .env
  sed -i "s|^NEXT_PUBLIC_BETTER_AUTH_URL=.*|NEXT_PUBLIC_BETTER_AUTH_URL=https://${DOMAIN}|" .env
  set -a; source .env; set +a
fi
export POSTGRES_PASSWORD="\$(grep ^POSTGRES_PASSWORD= .env | cut -d= -f2- | tr -d '\"')"
export POSTGRES_PASSWORD
EOF

echo "==> Setup VPS lite"
$SSH "cd ${REMOTE_DIR} && export POSTGRES_PASSWORD=\$(grep ^POSTGRES_PASSWORD= .env | cut -d= -f2- | tr -d '\"') && sudo -E bash deploy/setup-vps-lite.sh"

echo "==> Migrasi database via tunnel (dari lokal, tanpa build di VPS)"
$SSH -f -N -L 15432:127.0.0.1:5432 "${VPS_USER}@${VPS_HOST}" || true
sleep 2
set -a; source .env.local 2>/dev/null || true; set +a
REMOTE_DB_URL="$($SSH "grep ^DATABASE_URL= ${REMOTE_DIR}/.env | cut -d= -f2- | tr -d '\"'")"
export DATABASE_URL="postgresql://topperspediashop:$(echo "$REMOTE_DB_URL" | sed -n 's|.*://topperspediashop:\([^@]*\)@.*|\1|p')@127.0.0.1:15432/topperspediashop"
pnpm db:push
node scripts/db-migrate-sql.mjs
pkill -f "ssh -p ${VPS_PORT}.*15432:127.0.0.1:5432" 2>/dev/null || true

echo "==> Start app dengan PM2"
$SSH "bash ${REMOTE_DIR}/deploy/start-pm2.sh"

echo "==> Nginx"
$SSH "cd ${REMOTE_DIR} && sudo DOMAIN=${DOMAIN} bash deploy/nginx/install.sh"

echo ""
echo "Deploy lite selesai."
echo "Manual: pastikan DNS A record ${DOMAIN} -> ${VPS_HOST}, lalu:"
echo "  ssh ${VPS_USER}@${VPS_HOST} 'certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m admin@${DOMAIN}'"
