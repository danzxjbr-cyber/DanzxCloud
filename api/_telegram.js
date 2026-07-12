import axios from "axios";
import { KEYS, DEMO_MODE } from "./_keys.js";

// Kirim notifikasi order ke admin via Telegram Bot API.
// Dilewati (no-op) kalau token/chat id belum diisi, atau saat DEMO_MODE
// (biar admin gak kebanjiran notifikasi order simulasi).
export async function notifyAdmin(text) {
  if (DEMO_MODE) return { skipped: "demo-mode" };
  const { botToken, adminChatId } = KEYS.telegram;
  if (!botToken || !adminChatId) return { skipped: "not-configured" };

  try {
    await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      { chat_id: adminChatId, text, parse_mode: "Markdown", disable_web_page_preview: true },
      { timeout: 10000 }
    );
    return { sent: true };
  } catch (e) {
    // Gagal kirim notifikasi tidak boleh menggagalkan proses fulfillment utama.
    return { sent: false, error: e?.response?.data || e.message };
  }
}
