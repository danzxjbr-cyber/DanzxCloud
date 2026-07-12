// Management Digital Hosting — Client Config (AMAN untuk browser, TIDAK ada secret di sini)
// Data harga disamakan dengan bot Telegram per 11-07-2026. By Danzx Official.

export const BRAND = {
  name: "Management Digital Hosting",
  shortName: "Management Digital",
  byline: "By Danzx Official",
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

// Rank/tier accent — satu keluarga hijau neon mengikuti warna asli logo
export const TIERS = {
  panel:    { label: "Panel",    color: "#39E65B", order: 1 },
  reseller: { label: "Reseller", color: "#A8E619", order: 2 },
  partner:  { label: "Partner",  color: "#39FFC2", order: 3 },
};

export const PRODUCTS = [
  {
    key: "panel",
    tier: "panel",
    title: "Panel Pterodactyl",
    subtitle: "Server sendiri, aktif dalam hitungan detik setelah bayar. Cocok buat bot, web, atau aplikasi apa pun yang butuh nyala 24/7.",
    requires: { name: true },
    nameLabel: "Username panel (huruf kecil, tanpa spasi)",
    namePlaceholder: "contoh: danzxuser",
    plans: [
      { key: "panel-2gb",  label: "2GB",  price: 3000,  spec: "2048MB RAM • 20% CPU" },
      { key: "panel-3gb",  label: "3GB",  price: 4000,  spec: "3072MB RAM • 30% CPU" },
      { key: "panel-4gb",  label: "4GB",  price: 5000,  spec: "4096MB RAM • 40% CPU", badge: "Rekomendasi" },
      { key: "panel-5gb",  label: "5GB",  price: 6000,  spec: "5120MB RAM • 50% CPU" },
      { key: "panel-6gb",  label: "6GB",  price: 7000,  spec: "6144MB RAM • 60% CPU" },
      { key: "panel-7gb",  label: "7GB",  price: 8000,  spec: "7168MB RAM • 70% CPU" },
      { key: "panel-8gb",  label: "8GB",  price: 9000,  spec: "8192MB RAM • 80% CPU" },
      { key: "panel-9gb",  label: "9GB",  price: 10000, spec: "9216MB RAM • 90% CPU" },
      { key: "panel-10gb", label: "10GB", price: 11000, spec: "10240MB RAM • 100% CPU" },
      { key: "panel-unli", label: "Unlimited", price: 12000, spec: "Request-based • Fair use", badge: "Populer" },
    ],
    notes: [
      "Harga paling ramah di kantong: mulai Rp3.000 saja, tanpa syarat ribet.",
      "Panel aktif 30 hari sejak dibuat. Mau perpanjang? Tinggal chat admin, prosesnya cepat.",
      "Server langsung jadi otomatis begitu QRIS kamu terkonfirmasi — nggak perlu nunggu balesan admin.",
    ],
  },

  {
    key: "reseller",
    tier: "reseller",
    title: "Reseller",
    subtitle: "Jual ulang panel dengan hargamu sendiri, untungnya buat kamu. Tinggal pilih masa aktif, kami bantu urus sisanya.",
    requires: { name: true },
    nameLabel: "Username / ID Telegram kamu",
    namePlaceholder: "contoh: @danzxuser",
    plans: [
      { key: "reseller-30",  label: "30 Hari",  price: 10000, spec: "Cocok buat coba-coba dulu", dot: "#22C55E" },
      { key: "reseller-60",  label: "60 Hari",  price: 20000, spec: "Waktu lebih longgar buat jualan", dot: "#3B82F6" },
      { key: "reseller-90",  label: "90 Hari",  price: 30000, spec: "Paling banyak dipilih", dot: "#A855F7", badge: "Rekomendasi" },
      { key: "reseller-120", label: "120 Hari", price: 40000, spec: "Lebih hemat per harinya", dot: "#F97316" },
      { key: "reseller-150", label: "150 Hari", price: 50000, spec: "Paling hemat, minim urus ulang", dot: "#EF4444" },
    ],
    notes: [
      "Sekali join langsung aktif — kamu bisa mulai jualan panel hari itu juga.",
      "Perpanjangan cukup Rp10.000 untuk tambah 30 hari, tinggal hubungi admin kapan saja masa aktifmu mau habis.",
      "Setelah bayar, akses reseller kamu diaktifkan admin secepatnya + kamu masuk grup khusus reseller.",
    ],
  },

  {
    key: "partner",
    tier: "partner",
    title: "Partner",
    subtitle: "Level paling atas di Management Digital Hosting — benefit lebih luas, prioritas support, dan akses paling lengkap.",
    requires: { name: true },
    nameLabel: "Username / ID Telegram kamu",
    namePlaceholder: "contoh: @danzxuser",
    plans: [
      { key: "partner-join", label: "Join Partner", price: 50000, spec: "Langsung aktif, akses penuh sebagai Partner", badge: "Rekomendasi" },
    ],
    notes: [
      "Satu kali join, langsung dapat semua benefit Partner — nggak perlu jenjang ribet.",
      "Masa aktif habis? Perpanjangan cuma Rp10.000/30 hari — hubungi admin, prosesnya sebentar.",
      "Setelah bayar, kamu langsung masuk grup khusus Partner.",
    ],
  },
];

export const UX = {
  autoPollMs: 8000,
};
