import axios from "axios";
import { KEYS, DEMO_MODE } from "./_keys.js";

function pick(obj, keys) {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k];
  }
  return undefined;
}

function extractTimestampFromOrderId(orderId) {
  // Format order id dari frontend: DZ-<timestamp>-XXXX
  const m = String(orderId || "").match(/-(\d{10,})-/);
  return m ? Number(m[1]) : 0;
}

/**
 * GET /api/qris-detail?orderId=...&amount=...
 */
export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount } = req.query || {};
    if (!orderId || !amount) return res.status(400).json({ error: "orderId & amount required" });

    if (DEMO_MODE) {
      const ts = extractTimestampFromOrderId(orderId);
      const elapsed = ts ? Date.now() - ts : 999999;
      const status = elapsed > 20000 ? "paid" : "pending";
      return res.status(200).json({ demo: true, transaction: { order_id: orderId, amount: Number(amount), status } });
    }

    if (!KEYS.nevapedia.apikey) {
      return res.status(500).json({
        error: "Nevapedia belum dikonfigurasi",
        detail: "Set NEVAPEDIA_APIKEY di Environment Variables, atau aktifkan DEMO_MODE=true untuk testing.",
      });
    }

    // Catatan: id invoice Nevapedia bisa berbeda dari order_id kita sendiri kalau
    // Nevapedia meng-generate id-nya sendiri saat create. Untuk konsistensi, kita
    // simpan order_id kita sebagai id yang dikirim ke Nevapedia saat create (lihat qris-create.js),
    // jadi order_id di sini seharusnya valid dipakai langsung ke endpoint status.
    let r;
    try {
      r = await axios.get(`${KEYS.nevapedia.baseUrl}/invoice/status`, {
        params: { apikey: KEYS.nevapedia.apikey, id: orderId },
        timeout: 10000,
      });
    } catch (e) {
      return res.status(502).json({ error: "Gagal cek status Nevapedia", detail: e?.response?.data || e.message });
    }

    const body = r.data || {};
    const d = body.data || body.result || body;
    const status = String(pick(d, ["status", "state"]) || pick(body, ["status", "state"]) || "unknown").toLowerCase();

    return res.status(200).json({ transaction: { order_id: orderId, amount: Number(amount), status } });
  } catch (err) {
    return res.status(500).json({ error: "Failed to get invoice status", detail: err?.response?.data || String(err) });
  }
}
