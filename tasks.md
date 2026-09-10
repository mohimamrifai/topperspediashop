## Seed Akun (Development)
- Super Admin: Username `superadmin`, Password `Password123`, Akses `/admin/dashboard`
- Admin Leader: Username `adminleader`, Password `Password123`, Akses `/admin/dashboard`
- Admin Staff: Username `adminstaff`, Password `Password123`, Akses `/admin/dashboard` (+ referral code `STAFF001`)
- Member: Username `member`, Password `Password123`, Akses `/profil` (saldo awal Rp30.000)
- Member test: Username `rinasyah`, Password `jika123` (referral `STAFF001`, sandi penarikan `123456`)

## Seed Demo Semua Staff (terpisah)
Jalankan setelah seed utama: `pnpm db:seed:staff`
- Menambah `demo_leader`, `demo_staff_1..3`, member demo, deposit/penarikan bulan ini & bulan lalu
- Untuk uji filter periode di `/admin/staff` sebagai `superadmin` atau `adminleader`
- Set IP duplikat demo untuk `/admin/member-ip` (`demo_member_a1` + `demo_member_a2`, serta `member` + `rinasyah`)
