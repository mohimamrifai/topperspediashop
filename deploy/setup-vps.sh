#!/usr/bin/env bash
set -euo pipefail

echo "==> Update system"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl git ufw

echo "==> Install Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Install Docker Compose plugin"
apt-get install -y docker-compose-plugin nginx certbot python3-certbot-nginx

echo "==> Enable Docker"
systemctl enable --now docker

echo "==> Firewall (SSH + HTTP/S)"
ufw allow OpenSSH
ufw allow "Nginx Full"
ufw --force enable

echo "Setup VPS selesai."
echo "Langkah berikutnya:"
echo "  1. Clone repo ke /opt/topperspediashop"
echo "  2. cp .env.example .env && edit nilai production"
echo "  3. bash deploy/deploy.sh"
echo "  4. DOMAIN=domain-anda.com bash deploy/nginx/install.sh"
echo "  5. certbot --nginx -d domain-anda.com"
