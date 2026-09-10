# Deploy topperspediashop ke VPS

Panduan ini memakai **Docker Compose** + **Nginx** + **Certbot (SSL)**. Cocok untuk Ubuntu/Debian VPS.

## Prasyarat VPS

- Ubuntu 22.04+ / Debian 12+
- Domain sudah diarahkan ke IP VPS (A record)
- Akses SSH sebagai root atau user dengan sudo

## 1. Setup awal VPS (sekali)

SSH ke VPS, lalu:

```bash
git clone <URL_REPO_ANDA> /opt/topperspediashop
cd /opt/topperspediashop
sudo bash deploy/setup-vps.sh
```

Script ini menginstall Docker, Nginx, Certbot, dan firewall dasar.

## 2. Konfigurasi environment

```bash
cd /opt/topperspediashop
cp .env.example .env
nano .env
```

Isi minimal:

```env
POSTGRES_PASSWORD=<password-kuat>
BETTER_AUTH_SECRET=<hasil: openssl rand -base64 32>
BETTER_AUTH_URL=https://domain-anda.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://domain-anda.com
```

**Penting:** `BETTER_AUTH_URL` dan `NEXT_PUBLIC_BETTER_AUTH_URL` harus sama persis dengan URL publik (termasuk `https://`).

## 3. Deploy aplikasi

```bash
cd /opt/topperspediashop
bash deploy/deploy.sh
```

Yang dilakukan script:

1. Build image Next.js (standalone)
2. Start PostgreSQL + app di port `127.0.0.1:3000`
3. Sync schema database (`pnpm db:push`)
4. Jalankan migrasi SQL incremental

## 4. Nginx reverse proxy

```bash
cd /opt/topperspediashop
sudo DOMAIN=domain-anda.com bash deploy/nginx/install.sh
sudo certbot --nginx -d domain-anda.com
```

Setelah SSL aktif, buka `https://domain-anda.com`.

## 5. Seed akun admin (opsional, production)

Hanya jika database masih kosong dan Anda perlu akun awal:

```bash
docker compose --profile tools run --rm migrate sh -lc \
  "corepack enable && pnpm install --frozen-lockfile && pnpm db:seed"
```

Akun dev default ada di `tasks.md` (ganti password setelah login pertama).

## Update versi baru

```bash
cd /opt/topperspediashop
git pull
bash deploy/deploy.sh
```

## Deploy tanpa Docker (alternatif)

Jika VPS sudah punya PostgreSQL & Node 22:

```bash
cd /opt/topperspediashop
cp .env.example .env
# set DATABASE_URL ke Postgres existing

corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm db:push
pnpm db:migrate:sql
pnpm start
```

Jalankan `pnpm start` dengan process manager (PM2/systemd). Nginx tetap proxy ke `127.0.0.1:3000`.

### Contoh systemd

Buat `/etc/systemd/system/topperspediashop.service`:

```ini
[Unit]
Description=topperspediashop
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/topperspediashop
EnvironmentFile=/opt/topperspediashop/.env
ExecStart=/usr/bin/corepack pnpm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Troubleshooting

| Gejala | Solusi |
|--------|--------|
| Login gagal / cookie error | Pastikan `BETTER_AUTH_URL` = URL browser (https + domain benar) |
| 502 Bad Gateway | Cek `docker compose ps`, app harus running di port 3000 |
| DB connection error | Cek `POSTGRES_PASSWORD` di `.env` konsisten |
| IP member salah | Nginx sudah set `X-Forwarded-For`; pastikan tidak ada proxy ganda |

## Port & keamanan

- PostgreSQL **tidak** exposed ke internet (hanya internal Docker network)
- App bind ke `127.0.0.1:3000` — hanya bisa diakses via Nginx
- Buka firewall: SSH (22), HTTP (80), HTTPS (443)
