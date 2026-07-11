// Danzx Cloud — Client Config (AMAN untuk browser)
// ⚠️ Jangan taruh API KEY di sini. Secrets harus di Vercel Environment Variables (lihat api/_keys.js).

export const BRAND = {
  name: "Danzx Cloud",
  tagline: "Panel Hosting • Reseller • Partner Program",
  handle: "@CpanelDanzxbot",
};

export const CURRENCY = "IDR";

export const LINKS = {
  resellerGroupFallback: "",
  partnerGroupFallback: "",
  telegramBot: "https://t.me/CpanelDanzxbot",
};

// Katalog produk & harga (edit bebas)
export const PRODUCTS = [
  {
    key: "panel",
    title: "Panel Pterodactyl",
    subtitle: "Pilih RAM, isi nama panel, bayar QRIS. Server aktif otomatis.",
    icon: "panel",
    kind: "panel",
    requires: { panelName: true, telegram: false },
    plans: [
      { key: "panel-1gb", label: "1 GB", ramGb: 1, price: 2000, badge: "STARTER" },
      { key: "panel-2gb", label: "2 GB", ramGb: 2, price: 3000, badge: "BASIC" },
      { key: "panel-3gb", label: "3 GB", ramGb: 3, price: 5000, badge: "PLUS" },
      { key: "panel-4gb", label: "4 GB", ramGb: 4, price: 7000, badge: "POPULER" },
      { key: "panel-unlimited", label: "UNLIMITED", ramGb: 0, price: 10000, badge: "REQUEST" },
    ],
    notes: [
      "UNLIMITED = request-based, menyesuaikan kapasitas node & fair use.",
      "Nama panel dipakai sebagai username akun Pterodactyl kamu.",
    ],
  },
  {
    key: "reseller",
    title: "Reseller Panel",
    subtitle: "Jual ulang panel dengan harga sendiri. Akses tools reseller di bot.",
    icon: "reseller",
    kind: "role",
    requires: { panelName: false, telegram: true },
    plans: [
      { key: "reseller-join", label: "Join Reseller", period: "1 Bulan", price: 25000, badge: "JOIN", role: "reseller", months: 1 },
      { key: "reseller-extend", label: "Perpanjang Reseller", period: "+1 Bulan", price: 10000, badge: "PERPANJANG", role: "reseller", months: 1, isExtend: true },
    ],
    notes: [
      "Butuh username Telegram aktif — role diaktifkan lewat bot dalam beberapa menit.",
      "Perpanjang dipakai kalau role reseller kamu sudah pernah aktif sebelumnya.",
    ],
  },
  {
    key: "partner",
    title: "Partner Panel",
    subtitle: "Tier tertinggi di bawah Admin. Limit lebih besar, harga lebih murah.",
    icon: "partner",
    kind: "role",
    requires: { panelName: false, telegram: true },
    plans: [
      { key: "partner-join", label: "Join Partner", period: "1 Bulan", price: 50000, badge: "JOIN", role: "partner", months: 1 },
      { key: "partner-extend", label: "Perpanjang Partner", period: "+1 Bulan", price: 10000, badge: "PERPANJANG", role: "partner", months: 1, isExtend: true },
    ],
    notes: [
      "Butuh username Telegram aktif — role diaktifkan lewat bot dalam beberapa menit.",
      "Partner dapat akses & limit di atas Reseller.",
    ],
  },
];

export const UX = {
  autoPollMs: 8000,
};
