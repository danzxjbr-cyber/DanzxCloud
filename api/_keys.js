// Danzx Cloud — Server secrets.
// ⚠️ Di production, JANGAN hardcode di sini. Set semua ini sebagai
// Vercel Environment Variables (Project Settings → Environment Variables),
// lalu baca lewat process.env seperti di bawah.

export const KEYS = {
  // === Nevapedia (payment gateway) ===
  // Struktur ini SEMENTARA mengikuti pola umum gateway QRIS Indonesia
  // (create → detail → cancel), sama seperti Pakasir di project sebelah.
  // ⚠️ BELUM final — ganti baseUrl/paths & field mapping di
  // api/nevapedia-create.js, nevapedia-detail.js, nevapedia-cancel.js
  // begitu kamu kasih spek API Nevapedia asli dari bot @CpanelDanzxbot kamu.
  nevapedia: {
    baseUrl: process.env.NEVAPEDIA_BASE_URL || "https://api.nevapedia.example/v1",
    apiKey: process.env.NEVAPEDIA_API_KEY || "",
    merchantId: process.env.NEVAPEDIA_MERCHANT_ID || "",
  },

  // DEMO_MODE=true → endpoint tidak call Nevapedia sama sekali, QR dibuat
  // dari string demo, dan status otomatis jadi PAID ~20 detik setelah dibuat.
  // Berguna buat test UI end-to-end sebelum API asli siap.
  demoMode: String(process.env.DEMO_MODE || "true").toLowerCase() === "true",

  pterodactyl: {
    domain: process.env.PTERODACTYL_DOMAIN || "https://",
    apiKey: process.env.PTERODACTYL_API_KEY || "",
    egg: Number(process.env.PTERODACTYL_EGG || 15),
    nestId: Number(process.env.PTERODACTYL_NEST_ID || 5),
    locationId: Number(process.env.PTERODACTYL_LOCATION_ID || 1),
  },

  // Opsional: notifikasi Telegram ke grup admin saat ada order Reseller/Partner
  // yang sudah dibayar, supaya bisa cepat diaktifkan lewat @CpanelDanzxbot
  // (atau kamu sambungkan langsung ke endpoint internal bot kamu di sini).
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || "",
  },
};
