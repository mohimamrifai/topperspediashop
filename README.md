# Toppers Pedia Shop

Platform dropship dengan panel admin multi-role (Super Admin, Leader, Staff) dan aplikasi member.

## Stack

- Next.js 16 (App Router)
- PostgreSQL + Drizzle ORM
- Better Auth
- Tailwind CSS

## Setup Lokal

1. Install dependency:

```bash
pnpm install
```

2. Salin environment:

```bash
cp .env.example .env.local
```

3. Isi `DATABASE_URL`, `BETTER_AUTH_SECRET`, dan URL auth di `.env.local`.

4. Jalankan migrasi database:

```bash
pnpm db:migrate
```

5. (Opsional) Seed data awal:

```bash
pnpm db:seed
```

6. Jalankan development server:

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts Penting

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Development server |
| `pnpm build` | Build production |
| `pnpm start` | Jalankan build production |
| `pnpm db:migrate` | Jalankan migrasi Drizzle |
| `pnpm db:seed` | Seed akun & data dasar |

## Struktur Singkat

- `app/` — halaman Next.js (member & admin)
- `lib/` — business logic, auth, database, actions
- `drizzle/` — schema & migrasi database
- `public/` — asset statis
