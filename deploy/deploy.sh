#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Buat file .env dulu (salin dari .env.example)."
  exit 1
fi

echo "==> Build & start containers"
docker compose up -d --build

echo "==> Wait for database"
until docker compose exec -T db pg_isready -U topperspediashop -d topperspediashop >/dev/null 2>&1; do
  sleep 2
done

echo "==> Database migrate (schema + SQL files)"
docker compose --profile tools run --rm migrate

echo "==> Restart app"
docker compose up -d app

echo "Deploy selesai. App listen di 127.0.0.1:3000"
echo "Pastikan Nginx sudah di-setup (deploy/nginx/install.sh) dan SSL aktif."
