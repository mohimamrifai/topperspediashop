#!/usr/bin/env bash
# Start/restart app di VPS (PM2, tanpa Docker).
set -euo pipefail
cd /opt/topperspediashop

set -a
source .env
set +a

mkdir -p .next/standalone/.next
rsync -a .next/static/ .next/standalone/.next/static/
rsync -a public/ .next/standalone/public/

cd .next/standalone
pm2 delete topperspediashop 2>/dev/null || true
PORT=3000 HOSTNAME=127.0.0.1 pm2 start server.js --name topperspediashop
pm2 save
echo "PM2 running on 127.0.0.1:3000"
