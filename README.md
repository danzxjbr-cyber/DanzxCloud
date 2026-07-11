# Danzx Cloud

Website 1-page order panel Pterodactyl + program Reseller/Partner. QRIS via Nevapedia,
jalan di Vercel Serverless Functions. Desain: dark neon-cyber x neobrutalism.

## Struktur
- `index.html` — Hero (terminal boot) → Produk (Panel / Reseller / Partner) → QRIS ticket
- `tailwind.css` — token warna neon + style neobrutalist (border tebal, hard shadow)
- `source/config.js` — katalog produk & harga (AMAN untuk browser)
- `source/index.js` — semua logic UI (render produk, validasi, checkout)
- `source/nevapedia.js` — client helper ke endpoint serverless
- `api/` — endpoint server (pegang secrets: Nevapedia, Pterodactyl, Telegram)

## ⚠️ Yang WAJIB kamu isi sebelum go-live: Nevapedia

Saya belum punya spek resmi API Nevapedia (base URL, cara auth, endpoint create/detail/cancel,
nama field di response). Jadi `api/nevapedia-create.js`, `nevapedia-detail.js`, dan
`nevapedia-cancel.js` saya buat dengan struktur yang sudah rapi dan siap pakai, tapi endpoint
path & body-nya masih placeholder (ada komentar `TODO` di tiap file, cari 3 titik itu).

Cara isi paling cepat: kirim potongan `payment.js` dari bot `@CpanelDanzxbot` kamu yang sudah
connect ke Nevapedia, saya port persis ke 3 file itu.

Sebelum itu selesai, set `DEMO_MODE=true` (default aktif) supaya QR & status pembayaran
disimulasikan — cukup untuk test alur UI end-to-end tanpa API asli.

## Environment Variables (Vercel)

**Nevapedia:**
- `NEVAPEDIA_BASE_URL`
- `NEVAPEDIA_API_KEY`
- `NEVAPEDIA_MERCHANT_ID`
- `DEMO_MODE` — `true` untuk testing tanpa Nevapedia, `false` untuk production

**Pterodactyl (fulfillment Panel):**
- `PTERODACTYL_DOMAIN` (contoh: `https://panel.domainmu.com`)
- `PTERODACTYL_API_KEY` (Application API key, bukan Client API key)
- `PTERODACTYL_EGG`, `PTERODACTYL_NEST_ID`, `PTERODACTYL_LOCATION_ID`

**Telegram (opsional, notify admin saat ada order Reseller/Partner):**
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`

> Jangan taruh API key apa pun di `source/config.js` atau file frontend lain — semua secret
> lewat `api/_keys.js` + Environment Variables.

## Alur pembelian

**Panel Pterodactyl:** pilih RAM → isi nama panel → klik Beli → QRIS muncul → setelah dibayar,
`api/fulfill.js` otomatis bikin user + server Pterodactyl, dan menampilkan email/password akun
kalau baru dibuat.

**Reseller Panel / Partner Panel:** pilih Join atau Perpanjang → isi username Telegram → bayar
QRIS → setelah dibayar, sistem kirim notifikasi ke grup admin via Telegram Bot API supaya role-nya
diaktifkan lewat `@CpanelDanzxbot` (nyambung ke `partner.json` yang sudah kamu punya). Kalau bot
kamu punya endpoint internal untuk set role langsung, ganti `notifyAdminTelegram()` di
`api/fulfill.js` dengan call langsung ke endpoint itu — lebih otomatis daripada notify manual.

## Harga role (sesuai permintaan)
- Reseller: Join Rp25.000, Perpanjang Rp10.000/bulan
- Partner: Join Rp50.000, Perpanjang Rp10.000/bulan

Edit harga & paket di `source/config.js` → `PRODUCTS`.

## Deploy
1. Upload project ini ke GitHub
2. Import ke Vercel
3. Set semua Environment Variables di atas
4. Deploy, lalu set `DEMO_MODE=false` setelah Nevapedia siap

## Testing tanpa Nevapedia
`DEMO_MODE=true` (default). QR dari string demo, status otomatis `PAID` ~20 detik setelah dibuat
(dihitung dari timestamp di orderId), jadi fulfillment (Pterodactyl / notify Telegram) tetap
bisa dites penuh.
