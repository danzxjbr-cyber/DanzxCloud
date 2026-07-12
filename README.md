# Management Digital Hosting (By Danzx Official)

Website 1-page: Panel Pterodactyl • Reseller • Partner — checkout QRIS otomatis, deploy sebagai Vercel Serverless Functions.

Desain mengikuti identitas logo asli (hitam + hijau neon + chrome), dan datanya sudah disinkronkan dengan bot Telegram per 11-07-2026.

## Struktur
- `index.html` — hero + "access ladder" (Panel → Reseller → Partner) + produk + checkout
- `styles.css` — desain custom (bukan Tailwind), tema charcoal-blue dengan aksen per-tier
- `source/config.js` — brand & katalog produk/harga (AMAN untuk browser, TIDAK ada secret)
- `source/app.js` — semua logic render & checkout
- `source/payment.js` — client wrapper ke endpoint serverless
- `api/` — endpoint serverless yang pegang semua secret

## Harga (disinkronkan dari bot, edit di `source/config.js` kalau mau ubah)
**Panel** (aktif 30 hari/pembelian):
2GB Rp3.000 · 3GB Rp4.000 · 4GB Rp5.000 · 5GB Rp6.000 · 6GB Rp7.000 · 7GB Rp8.000 · 8GB Rp9.000 · 9GB Rp10.000 · 10GB Rp11.000 · Unlimited Rp12.000

**Reseller** (durasi akses, bisa dipakai join baru maupun perpanjang):
30 Hari Rp10.000 · 60 Hari Rp20.000 · 90 Hari Rp30.000 · 120 Hari Rp40.000 · 150 Hari Rp50.000

**Partner**:
Join Partner Rp50.000 (langsung aktif). Perpanjangan Rp10.000/30 hari — cuma keterangan, dihubungi admin manual, bukan tombol beli terpisah.

## ✅ Kredensial sudah diisi
File `.env` di folder ini sudah saya isi dengan API key Nevapedia & Pterodactyl kamu (nest `5`, egg `15`, location `1`). File ini sudah masuk `.gitignore`, jadi **tidak akan ikut ter-upload** kalau kamu push ke GitHub — aman.

Karena Vercel **tidak otomatis membaca file `.env`** saat deploy dari GitHub, kamu tetap perlu **copy-paste tiap baris di `.env` ke Vercel → Project Settings → Environment Variables** satu-satu (nama variable + isinya), baru redeploy. Setelah itu situs otomatis jalan di mode produksi (banner demo hilang sendiri).

> Catatan: Client API key Pterodactyl (`ptlc_...`) tidak dipakai di website ini — yang dipakai cuma Application API key (`ptla_...`) buat bikin user & server otomatis.

## 🚀 Jalan langsung tanpa setting apapun (zero-config demo)
Website ini **otomatis jalan di mode demo** kalau kamu belum isi `NEVAPEDIA_APIKEY` — jadi tinggal deploy, tanpa perlu isi Environment Variables sama sekali dulu.

Saat mode demo aktif (ada banner kuning otomatis muncul di website):
- QR dibuat dari string demo (bukan QRIS asli — jangan discan untuk bayar sungguhan)
- Status transaksi otomatis jadi **paid** ±20 detik setelah invoice dibuat (dihitung dari timestamp order ID)
- Produk **Panel** akan "dibuat" secara simulasi (tidak memanggil Pterodactyl beneran)
- Produk **Reseller/Partner** langsung menampilkan pesan konfirmasi manual

Begitu kamu isi `NEVAPEDIA_APIKEY` di Environment Variables, website **otomatis pindah ke mode produksi** — tidak perlu ubah kode atau matikan apapun secara manual. Kalau mau paksa salah satu mode secara eksplisit, isi `DEMO_MODE=true` atau `DEMO_MODE=false`.

## Environment Variables untuk mode PRODUKSI

### Nevapedia (QRIS)
| Variable | Keterangan |
|---|---|
| `NEVAPEDIA_APIKEY` | API key dari dashboard Nevapedia kamu |
| `NEVAPEDIA_BASEURL` | Opsional, default `https://app.nevapedia.com/api` |

> Pakai API key Nevapedia **milikmu sendiri** — semua dana QRIS masuk ke akun pemilik API key tersebut.

### Pterodactyl (fulfillment otomatis produk Panel)
| Variable | Keterangan |
|---|---|
| `PTERO_DOMAIN` | Domain panel Pterodactyl, contoh `https://app.panel-legaldanzx.my.id` (tanpa trailing slash) |
| `PTERO_APPKEY` | **Application API key** (Admin Area → Application API), BUKAN client key |
| `PTERO_EGG` | ID egg default (default `15`) |
| `PTERO_NEST` | ID nest tempat egg berada (default `1`, sesuaikan dengan panel kamu) |
| `PTERO_LOCATION` | ID location/node tempat server dibuat (default `1`) |

> Reseller & Partner tidak diprovision otomatis (butuh keputusan admin) — sistem cuma konfirmasi pembayaran & tampilkan pesan bahwa admin akan mengaktifkan aksesnya. Isi `LINKS.partnerGroupFallback` / `resellerGroupFallback` di `source/config.js` kalau ada link grup Telegram khusus supaya tombolnya otomatis muncul setelah bayar. (Grup reseller & partner kamu sudah saya isi di config.)

### Notifikasi order ke Telegram (opsional, tapi disarankan)
Supaya kamu gak ketinggalan order — apalagi untuk Reseller/Partner yang aktivasinya manual — website ini bisa kirim notifikasi ke Telegram kamu tiap ada pembayaran sukses.

| Variable | Keterangan |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token bot — pakai yang sama seperti di `settings.js` bot Telegram kamu (`token`) |
| `TELEGRAM_ADMIN_ID` | Chat ID kamu — sama seperti `adminId` di `settings.js` bot kamu |

Kalau dua variable ini tidak diisi, website tetap jalan normal — cuma notifikasi Telegram-nya tidak aktif (dan otomatis tidak aktif juga selama masih di mode demo, supaya kamu gak kebanjiran notifikasi order simulasi).

⚠️ Jangan taruh API key apapun di `source/config.js` atau file frontend lain — semua secret HARUS lewat Environment Variables server (`api/_keys.js` membaca dari `process.env`, tidak ada yang di-hardcode).

## Cara deploy ke Vercel (paling cepat, tanpa isi apapun dulu)
1. Upload folder ini ke GitHub (repo kamu sendiri) — atau pakai [Vercel CLI](https://vercel.com/docs/cli): jalankan `vercel` di dalam folder project ini
2. Kalau lewat GitHub: buka https://vercel.com/new → Import repo tersebut → Deploy (Environment Variables boleh dikosongkan, nanti otomatis jalan mode demo)
3. Selesai — website langsung bisa diakses & dicoba dari link yang diberikan Vercel
4. Setelah siap kredensial asli, tambahkan `NEVAPEDIA_APIKEY` dkk di Project Settings → Environment Variables → redeploy

## Catatan soal Nevapedia
Dokumentasi endpoint invoice Nevapedia yang dipakai di sini: `GET /api/invoice` (create) dan `GET /api/invoice/status` (cek status), keduanya butuh `apikey`. Nevapedia **tidak** punya endpoint cancel invoice — makanya tombol "Batalkan" di website cuma menyembunyikan transaksi di sisi tampilan; invoice-nya sendiri expired otomatis di sistem Nevapedia. Kalau format respons API mereka berubah/beda dari yang diasumsikan di `api/qris-create.js` & `api/qris-detail.js`, sesuaikan bagian `pick(...)` di file tersebut sesuai field asli yang dikembalikan.
