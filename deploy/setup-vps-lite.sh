#!/usr/bin/env bash
# Setup VPS ringan untuk 1GB RAM — tanpa Docker.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> Stop Docker (hemat RAM)"
systemctl stop docker docker.socket containerd 2>/dev/null || true
systemctl disable docker docker.socket 2>/dev/null || true

echo "==> Tambah swap 2GB (jika belum ada)"
if ! swapon --show | grep -q '/swapfile'; then
  fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "==> Paket dasar"
apt-get update
apt-get install -y ca-certificates curl git nginx certbot python3-certbot-nginx ufw postgresql postgresql-contrib

echo "==> Node.js 22"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v22* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
corepack enable

echo "==> PM2"
npm install -g pm2

echo "==> PostgreSQL database + user"
DB_PASS="${POSTGRES_PASSWORD:-}"
if [[ -z "$DB_PASS" ]]; then
  echo "POSTGRES_PASSWORD belum di-set. Export dulu sebelum jalankan script ini."
  exit 1
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='topperspediashop'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER topperspediashop WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='topperspediashop'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE topperspediashop OWNER topperspediashop;"

PG_VER="$(basename "$(ls -d /etc/postgresql/*/main 2>/dev/null | head -1 | xargs dirname)")"
mkdir -p "/etc/postgresql/${PG_VER}/main/conf.d"
cat > "/etc/postgresql/${PG_VER}/main/conf.d/topperspediashop.conf" <<'PGCONF'
shared_buffers = 64MB
effective_cache_size = 256MB
work_mem = 4MB
maintenance_work_mem = 32MB
PGCONF
systemctl restart postgresql

echo "==> Firewall"
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo "Setup lite selesai."
