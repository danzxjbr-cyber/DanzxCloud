// Danzx Cloud — Client Config (AMAN untuk browser, TIDAK ada secret di sini)
// Data harga disamakan dengan bot Telegram (CpanelDanzxbot) per 11-07-2026.

export const BRAND = {
  name: "Danzx Cloud",
  tagline: "Panel • Reseller • Partner",
  contactUrl: "https://t.me/Danzx_JBR",
  channelUrl: "https://t.me/InformationDanzxJBR",
};

export const CURRENCY = "IDR";

// Link grup yang ditampilkan otomatis setelah pembayaran sukses (opsional, isi null kalau tidak ada)
export const LINKS = {
  resellerGroupFallback: "https://t.me/+wk-rd8m444AwZWFl",
  partnerGroupFallback: "https://t.me/+s-QvbVdKQE01ZTdl",
};

// Rank/tier accent — dipakai konsisten di badge, kartu, dan ladder diagram
export const TIERS = {
  panel:    { label: "Panel",    color: "#4FD1C5", order: 1 },
  reseller: { label: "Reseller", color: "#F5A623", order: 2 },
  partner:  { label: "Partner",  color: "#B98CFF", order: 3 },
};

export const PRODUCTS = [
  {
    key: "panel",
    tier: "panel",
    title: "Panel Pterodactyl",
    subtitle: "Sewa panel hosting bot/server. Aktif 30 hari per pembelian.",
    requires: { name: true },
    nameLabel: "Username panel (huruf kecil, tanpa spasi)",
    namePlaceholder: "contoh: danzxuser",
    plans: [
      { key: "panel-2gb",  label: "2GB",  price: 3000,  spec: "2048MB RAM • 20% CPU" },
      { key: "panel-3gb",  label: "3GB",  price: 4000,  spec: "3072MB RAM • 30% CPU" },
      { key: "panel-4gb",  label: "4GB",  price: 5000,  spec: "4096MB RAM • 40% CPU" },
      { key: "panel-5gb",  label: "5GB",  price: 6000,  spec: "5120MB RAM • 50% CPU" },
      { key: "panel-6gb",  label: "6GB",  price: 7000,  spec: "6144MB RAM • 60% CPU" },
      { key: "panel-7gb",  label: "7GB",  price: 8000,  spec: "7168MB RAM • 70% CPU" },
      { key: "panel-8gb",  label: "8GB",  price: 9000,  spec: "8192MB RAM • 80% CPU" },
      { key: "panel-9gb",  label: "9GB",  price: 10000, spec: "9216MB RAM • 90% CPU" },
      { key: "panel-10gb", label: "10GB", price: 11000, spec: "10240MB RAM • 100% CPU" },
      { key: "panel-unli", label: "Unlimited", price: 12000, spec: "Request-based • Fair use", badge: "Populer" },
    ],
    notes: [
      "Panel aktif 30 hari sejak dibuat — perpanjang kapan saja lewat bot/admin.",
      "Server dibuat otomatis begitu pembayaran QRIS terkonfirmasi.",
    ],
  },

  {
    key: "reseller",
    tier: "reseller",
    title: "Reseller",
    subtitle: "Jual ulang panel dengan hargamu sendiri. Pilih masa aktif akses reseller.",
    requires: { name: true },
    nameLabel: "Username / ID Telegram kamu",
    namePlaceholder: "contoh: @danzxuser",
    plans: [
      { key: "reseller-30",  label: "30 Hari",  price: 10000, spec: "Akses reseller 30 hari", dot: "#22C55E" },
      { key: "reseller-60",  label: "60 Hari",  price: 20000, spec: "Akses reseller 60 hari", dot: "#3B82F6" },
      { key: "reseller-90",  label: "90 Hari",  price: 30000, spec: "Akses reseller 90 hari", dot: "#A855F7" },
      { key: "reseller-120", label: "120 Hari", price: 40000, spec: "Akses reseller 120 hari", dot: "#F97316" },
      { key: "reseller-150", label: "150 Hari", price: 50000, spec: "Akses reseller 150 hari", dot: "#EF4444" },
    ],
    notes: [
      "Semua paket bisa dipakai untuk join baru maupun perpanjang (tambah hari dari sisa aktif).",
      "Setelah bayar, akses reseller kamu diaktifkan otomatis oleh admin.",
    ],
  },

  {
    key: "partner",
    tier: "partner",
    title: "Partner",
    subtitle: "Level tertinggi — benefit & akses lebih luas dari reseller.",
    requires: { name: true },
    nameLabel: "Username / ID Telegram kamu",
    namePlaceholder: "contoh: @danzxuser",
    plans: [
      { key: "partner-join-reseller", label: "Join Partner", price: 30000, spec: "Khusus buat kamu yang sudah Reseller aktif", badge: "Termurah" },
      { key: "partner-join-langsung", label: "Join Partner Langsung", price: 50000, spec: "Tanpa perlu jadi Reseller dulu" },
      { key: "partner-renew", label: "Perpanjang Partner", price: 10000, spec: "Per 30 hari, untuk Partner aktif" },
    ],
    notes: [
      "Sudah Reseller aktif? Pilih 'Join Partner' harga lebih murah (Rp30.000).",
      "Belum Reseller? Pilih 'Join Partner Langsung' (Rp50.000), lanjut aktif tanpa reseller.",
      "Habis masa aktif? Pilih 'Perpanjang Partner' Rp10.000/30 hari.",
    ],
  },
];

export const UX = {
  autoPollMs: 8000,
};
