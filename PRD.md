Rangkuman Teknis Proyek
Overview
Nama proyek: E-Commerce Dropship Multi-Role & E-Wallet Manual
Referensi: reviewup.shop (branding mirip Tokopedia, UI diminta mirip tapi fungsionalitas bisa dikustomisasi)
Stack disebutkan di awal: React, Next.js, Laravel, WordPress (belum dikonfirmasi stack final yang dipakai)
Tanpa: payment gateway, tanpa integrasi pihak ketiga (Tokopedia dll)
Arsitektur Role & Akses (RBAC)
4 tingkat hierarki:

Super Admin — kontrol penuh sistem, approve/reject deposit & withdraw, membuat akun Leader
Admin Leader — dashboard monitoring performa tim Staf di bawahnya
Admin Staf — dashboard kelola member yang mendaftar via kode referal miliknya
Member (Dropshipper) — katalog produk, proses pesanan, riwayat mutasi saldo, ajukan deposit/withdraw

Modul & Logika Fungsional
1. Registrasi & Referal

Kode referal unik & statis per Admin Staf
Member yang daftar via kode tsb otomatis terkunci permanen di bawah staf bersangkutan
Bonus saldo awal otomatis Rp30.000 saat registrasi member baru

2. Alur Transaksi Pesanan

Member ambil tugas dari katalog → Admin Staf input harga manual per pesanan → sistem potong saldo e-wallet internal member
Jika saldo tidak cukup → sistem wajib block/redirect ke alur deposit dulu
Setelah dikonfirmasi selesai → sistem hitung otomatis & kredit komisi ke saldo member

3. Sistem Tiering & Kalkulasi Komisi Otomatis
Sistem harus membaca akumulasi jumlah transaksi sukses member untuk auto-update level:
LevelRange TransaksiKomisiClassic1–520% dari harga produkSilver6–1530% dari harga produkPlatinum16–20+35% dari harga produk
Level & skor kredit member juga harus bisa diedit manual oleh admin.
4. Modul E-Wallet (buku kas manual, non payment gateway)

Deposit: member lihat no. rekening di web → transfer manual → isi form konfirmasi + upload bukti transfer → status "Pending" → Super Admin/Staf ubah status "Disetujui" → saldo (angka fiktif) bertambah otomatis
Withdraw: member ajukan nominal → saldo langsung terpotong dengan status "Diproses" → admin transfer manual via m-banking → admin ubah status jadi "Selesai"
Perlu fitur reject dengan alasan manual (misal rekening tidak valid)

5. Modul Admin Tools yang Perlu Dibangun

Dashboard: ringkasan total member daftar, deposit, penarikan per hari
Tools Anggota: lihat saldo, edit level, edit skor kredit, edit saldo manual (tambah/kurang), reset password member, reset password penarikan
Tools Tugas: input/assign harga pesanan ke member
Tools Deposit & Penarikan: approve/reject dengan upload bukti & alasan
Tools Rekening: lihat & edit data rekening/e-wallet member
Tools Produk: CRUD produk (gambar + harga)
Tools Chat → diubah jadi "Layanan Pelanggan": admin input link eksternal (WA/Telegram); di sisi member muncul tombol akses layanan pelanggan

Fitur Tambahan (Requested Mid-Project)

Custom filter tanggal di dashboard: agar total member/deposit/penarikan tidak reset otomatis per hari, tapi bisa ditarik historinya berdasarkan rentang tanggal custom

Milestone Teknis
MilestoneCakupanM1 (Minggu 1)Struktur database, sistem login multi-role, sistem registrasi + referal staf, halaman katalog depan, form deposit manualM2 (Minggu 2)Logika transaksi dropship, kalkulasi komisi otomatis (3 tier), fitur withdraw manual, testing sistem, handover source code

---

## Tambahan Requirement (Klien - 2026-07-16)

### Pembuatan Akun Admin
- **Tidak ada registrasi publik untuk admin** (Leader & Staff). Akun admin HANYA dibuat oleh Super Admin lewat panel `/admin/team`.
- Akun admin baru langsung memiliki:
  - Username & password (acak, bisa di-reset)
  - Role (`admin_leader` atau `admin_staff`)
  - Referral code otomatis (khusus staff) — format `STAFF-XXXXX`
- Setelah akun admin dibuat, sistem otomatis insert profile di tabel `public.profiles` lewat trigger (sama seperti register member).
- **Tidak ada bonus saldo** untuk admin.

### Fitur Admin Staff — Penugasan Manual
- Di `/admin/task`, harus tersedia tombol **"Tambah Tugas"** (form modal):
  - Pilih member (dropdown dari daftar member yang direferral staff tersebut)
  - Pilih produk (dropdown dari tabel `products`)
  - Input harga pesanan manual (numeric)
  - Sistem otomatis hitung komisi dasar berdasar level member saat itu
  - Status awal: `menunggu`
- Member akan melihat tugas baru ini di `/order` dan bisa memilihnya.

### Penarikan — Alasan Reject & Lock Member
- Field `notes` di tabel `withdrawals` WAJIB diisi saat admin reject withdrawal (alasan: mis. "rekening tidak valid").
- Saat withdrawal di-reject dengan alasan "rekening tidak valid" / "penipuan" / "akun mencurigakan":
  - Sistem otomatis set `status = 'banned'` di `profiles` untuk member tersebut.
  - Member yang dibanned tidak bisa: ambil tugas baru, ajukan withdraw, login (opsional - periksa).
- Admin (super/leader/staff) bisa **unlock** member dari `/admin/users` (tombol toggle status).

### Form Penarikan Member
- Sudah ada field "Nomor ponsel cadangan" di form tambah rekening (`/bank`) — dipakai untuk konfirmasi saat ada masalah.
- Form penarikan (`/withdraw`) tetap: pilih rekening, nominal, sandi penarikan. Tidak ada field alasan dari sisi member.

### E-Wallet — Edit Saldo Manual
- Tools anggota di `/admin/users` sudah mendukung edit saldo `+` / `-` (sudah ada).
- **Tidak perlu field alasan di form edit saldo** (kebijakan klien: alasan cukup diisi di withdrawal, bukan di mutasi saldo internal).
- Audit log tetap merekam setiap perubahan saldo manual (siapa, berapa, kapan).

### Bug yang Dilaporkan Klien (2026-07-16)
- **"Setelah menambahkan nomor rekening, saldo di profil hilang"** — tampilan saldo di `/profil` tidak update setelah aksi di `/bank`. Root cause: server action `addBankAccount`/`updateBankAccount` tidak memanggil `revalidatePath('/profil')`. Fix: tambahkan revalidation.

---

## Role Matrix (Ringkasan Hak Akses)

| Aksi                                          | Super Admin | Admin Leader | Admin Staff | Member |
|-----------------------------------------------|:-----------:|:------------:|:-----------:|:------:|
| Lihat dashboard statistik                    | ✅ semua tim | ✅ tim sendiri | ✅ tim sendiri | — |
| Create akun admin (leader/staff)             | ✅          | ❌           | ❌          | ❌     |
| Lihat/manage semua admin                     | ✅          | ❌           | ❌          | ❌     |
| Lihat/manage member di bawah referral        | ✅ semua    | ✅ staff di bawahnya | ✅ member sendiri | — |
| Create tugas baru untuk member               | ✅ semua    | ✅ staff di bawahnya | ✅ member sendiri | ❌ |
| Update status tugas (selesai / batal)        | ✅          | ✅           | ✅         | ❌     |
| Approve/reject deposit                       | ✅          | ✅           | ✅         | ❌     |
| Approve/reject withdrawal                    | ✅          | ✅           | ✅         | ❌     |
| Edit saldo / level / credit score member     | ✅          | ✅           | ✅         | ❌     |
| Reset password login member                  | ✅          | ✅           | ✅         | ❌     |
| Reset password penarikan member              | ✅          | ✅           | ✅         | ❌     |
| Lock / unlock member (status banned)         | ✅          | ✅           | ✅         | ❌     |
| CRUD produk                                  | ✅          | ✅           | ✅         | ❌     |
| CRUD channel pelayanan                       | ✅          | ✅           | ✅         | ❌     |
| Lihat audit log                              | ✅          | ❌           | ❌         | ❌     |
| Register akun baru                           | ❌ (hanya via `createAdminUser`) | ❌ | ❌ | ✅ (member) |
| Lihat katalog produk                         | ✅          | ✅           | ✅         | ✅     |
| Ambil tugas                                  | ❌          | ❌           | ❌         | ✅     |
| Ajukan deposit                               | ❌          | ❌           | ❌         | ✅     |
| Ajukan withdrawal                            | ❌          | ❌           | ❌         | ✅     |
| CRUD rekening bank sendiri                   | ❌          | ❌           | ❌         | ✅     |

---

## Definisi "Tim" per Role
- **Super Admin**: semua admin + semua member di seluruh sistem.
- **Admin Leader**: semua admin_staff yang `leader_id` (FK ke profiles) menunjuk ke leader ini + semua member yang direferral oleh staff-staf tersebut.
- **Admin Staff**: hanya member yang `referredBy` menunjuk ke staff ini.
- **Member**: hanya diri sendiri.

---

## Tambahan Requirement (Klien - 2026-07-16 lanjutan)

### Admin Leader

#### Menu Semua Staff
- Leader bisa melihat **jumlah anggota** dan **aktivitas** dari tiap staff di bawahnya.
- Tampilan: daftar staff dengan ringkasan (jumlah member aktif, total deposit, total withdrawal, total komisi bulan ini).
- Akses halaman: `/admin/staff` (route baru, hanya leader + super admin).

#### Detail Staff
- Klik salah satu staff di daftar → buka halaman detail staff (`/admin/staff/[id]`).
- Menampilkan **total pencapaian anggota staff tersebut per bulan** (jumlah tugas selesai, total komisi dihasilkan, total deposit, dll).
- Default: data **bulan berjalan**. Bisa pilih **custom tanggal** untuk lihat data bulan lalu.
- Data tidak di-cache — dihitung real-time via query aggregate.

#### Tools Deposit (sama dengan staff, aggregate ke seluruh tim)
- Sudah tersedia via `/admin/rechargelist` (sudah di-scope `getScope` untuk leader = aggregate tim).

#### Tools Penarikan — Dropdown Alasan Otomatis
- Saat admin reject withdrawal di `/admin/withdrawlist`, tersedia **dropdown alasan otomatis** (tidak hanya free text):
  - `Rekening tidak valid`
  - `Nama pemilik rekening tidak sesuai`
  - `Aktivitas mencurigakan`
  - `Saldo tidak cukup`
  - `Lainnya` (munculkan input free text)
- Tetap tercatat di `withdrawals.notes` dan `audit_logs`.

#### Minimal Penarikan Member
- **Batas minimal withdrawal: Rp 50.000**.
- Jika saldo member `< 50.000`:
  - Form penarikan di `/withdraw` **otomatis terkunci / tidak bisa diisi** (disabled state, tampilkan notice "Saldo minimal Rp 50.000 untuk melakukan penarikan.").
  - Server action `submitWithdrawal` wajib return error jika amount < 50.000.
- Berlaku untuk semua role (member).

#### Nomor HP Member
- Kolom `phone` di tabel `profiles` WAJIB ditampilkan di:
  - Halaman `/admin/users` (admin staff)
  - Halaman detail staff (admin leader)
  - Halaman `/admin/account` (rekening — sudah ada, tapi pastikan konsisten)
- Jika belum diisi, tampilkan placeholder "—".

#### Tujuan Bank untuk Deposit (KHUSUS Leader + Super Admin)
- Leader & Super Admin bisa **menambahkan rekening tujuan deposit** yang ditampilkan ke member di halaman `/recharge`.
- TIDAK ada di admin staff.
- Schema: tabel `deposit_bank_accounts` (terpisah dari `bank_accounts` member):
  - `id`, `bankName`, `accountName`, `accountNumber`, `notes`, `isActive`, `createdBy`, `createdAt`.
- Halaman admin: `/admin/deposit-bank` (CRUD) — leader + super admin only.
- Halaman `/recharge` (member) membaca rekening aktif dari `deposit_bank_accounts` (bukan hardcoded lagi).
- Default `accountName` & `bankName` per klien: Bank MNC a.n VENDA FAISHA ANANTA (saat ini hardcoded di `app/recharge/page.tsx`).

#### Tools Staff — Create Admin Staff (Leader)
- Leader bisa **membuat akun admin staff baru** dari panel `/admin/team` (saat ini hanya super admin).
- Leader hanya bisa buat role `admin_staff` (tidak bisa buat admin_leader lain).
- Field `leader_id` otomatis ter-set ke leader.id saat create.
- Super admin tetap bisa buat role apa pun.

#### Menu Komisi
- Halaman baru `/admin/commission` (leader + super admin) — melihat **pendapatan staff**:
  - Per staff: total komisi yang masuk ke member di bawahnya (akibat tugas selesai)
  - Filter: rentang tanggal, per staff
- **Persentase komisi** (saat ini hardcoded 20% di `lib/levels.ts` `LEVEL_RATE_PERCENT`):
  - Hanya super admin yang bisa **mengubah** persentase (per level).
  - Tabel setting baru: `commission_settings` (level, percent) — single row per level.
  - Halaman `/admin/commission/settings` — super admin only (form edit).

### Admin Super

#### Kontrol Penuh (Standar)
- Sudah mencakup semua fitur leader + tambahan khusus super admin (lihat Role Matrix).

#### Pengaturan Izin Akses
- Super admin bisa **mengatur/memberikan izin akses kontrol penuh** kepada leader atau staff tertentu.
- Mekanisme: tambahkan kolom `access_overrides` (JSON) di `profiles` untuk admin — flag:
  - `full_access: boolean` — bypass scope filter (lihat semua member/transaksi)
  - `can_create_staff: boolean` — boleh create admin_staff
  - `can_create_leader: boolean` (khusus super admin yang override staff)
  - `commission_edit: boolean` — boleh edit persentase komisi
  - `deposit_bank_crud: boolean`
- Default semua `false` (ikut role bawaan).
- UI: halaman `/admin/permissions` — super admin only, pilih target admin, toggle izin.
- Helper `lib/access.ts` membaca `access_overrides` dan gabungkan ke `Scope`:
  - `full_access: true` → `unrestricted: true`
  - dll.

---

## Update Role Matrix

| Aksi                                          | Super Admin | Admin Leader | Admin Staff | Member |
|-----------------------------------------------|:-----------:|:------------:|:-----------:|:------:|
| Lihat menu Semua Staff (jumlah/aktivitas)    | ✅          | ✅           | ❌          | ❌     |
| Lihat Detail Staff (per bulan / custom)      | ✅          | ✅           | ❌          | ❌     |
| Lihat Menu Komisi (pendapatan staff)         | ✅          | ✅           | ❌          | ❌     |
| Ubah persentase komisi (per level)           | ✅          | ❌           | ❌          | ❌     |
| CRUD rekening tujuan deposit                 | ✅          | ✅           | ❌          | ❌     |
| Create admin_staff baru                      | ✅          | ✅           | ❌          | ❌     |
| Dropdown alasan otomatis saat reject WD      | ✅          | ✅           | ✅         | ❌     |
| Set izin akses override (full_access, dll)   | ✅          | ❌           | ❌          | ❌     |
| Validasi minimal penarikan Rp 50.000          | ✅          | ✅           | ✅         | ✅ (otomatis) |

---

## Skema / Tabel Baru yang Diperlukan

1. `deposit_bank_accounts` — rekening tujuan deposit (untuk member lihat di `/recharge`).
2. `commission_settings` — persentase komisi per level (single row per level).
3. `profiles.access_overrides` (JSON nullable) — izin akses custom per admin (override default role).

---

## Batasan & Aturan

- Minimal penarikan Rp 50.000: hard-rule di client (disabled form) + server (return error). Berlaku semua role.
- Dropdown alasan withdrawal: nilai enum tersimpan di `lib/constants/withdrawal-reasons.ts` — konsisten dipakai di admin & audit log.
- Tujuan bank deposit: jika tabel kosong, `/recharge` tampilkan pesan "Rekening tujuan belum tersedia, hubungi staff." (tidak ada fallback hardcode).
- Izin override `full_access: true` hanya relevan untuk admin (leader/staff) — super admin selalu unrestricted.