// Management Digital Hosting — server-side secrets loader.
// SEMUA NILAI DIAMBIL DARI ENVIRONMENT VARIABLES (jangan pernah hardcode API key di sini).
// Set env vars ini di Vercel Project Settings → Environment Variables (lihat README.md).

function env(name, fallback = "") {
  return process.env[name] ?? fallback;
}

export const KEYS = {
  nevapedia: {
    apikey: env("NEVAPEDIA_APIKEY"),
    baseUrl: env("NEVAPEDIA_BASEURL", "https://app.nevapedia.com/api"),
  },

  pterodactyl: {
    domain: env("PTERO_DOMAIN"), // contoh: https://app.panel-legaldanzx.my.id
    apiKey: env("PTERO_APPKEY"), // Application API key (ptla_...), BUKAN client key
    egg: Number(env("PTERO_EGG", "15")),
    nestId: Number(env("PTERO_NEST", "1")),
    locationId: Number(env("PTERO_LOCATION", "1")),
  },

  telegram: {
    botToken: env("TELEGRAM_BOT_TOKEN"), // token bot kamu (sama seperti di settings.js bot Telegram)
    adminChatId: env("TELEGRAM_ADMIN_ID"), // chat id admin yang akan menerima notifikasi order
  },
};

// DEMO_MODE:
// - Kalau env var DEMO_MODE diisi eksplisit ("true"/"false"), itu yang dipakai.
// - Kalau TIDAK diisi sama sekali: otomatis DEMO (true) selama belum ada NEVAPEDIA_APIKEY,
//   supaya website ini langsung bisa dijalankan tanpa setting apapun dulu.
//   Begitu NEVAPEDIA_APIKEY diisi, otomatis pindah ke mode produksi tanpa perlu ubah kode.
const _demoRaw = process.env.DEMO_MODE;
export const DEMO_MODE =
  _demoRaw !== undefined && _demoRaw !== ""
    ? String(_demoRaw).toLowerCase() === "true"
    : !env("NEVAPEDIA_APIKEY");
