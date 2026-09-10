#!/usr/bin/env bash
set -euo pipefail

# Reverse proxy untuk topperspediashop (SSL via Certbot).
# Ganti DOMAIN sebelum install.

DOMAIN="${DOMAIN:-example.com}"

cat > "/etc/nginx/sites-available/topperspediashop" <<EOF
upstream topperspediashop_app {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://topperspediashop_app;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
EOF

ln -sf /etc/nginx/sites-available/topperspediashop /etc/nginx/sites-enabled/topperspediashop
nginx -t
systemctl reload nginx

echo "Nginx config installed for ${DOMAIN}"
echo "Next: certbot --nginx -d ${DOMAIN}"
