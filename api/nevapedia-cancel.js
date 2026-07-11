import axios from "axios";
import { KEYS } from "./_keys.js";

/**
 * POST /api/nevapedia-cancel
 * body: { orderId: string, amount: number }
 *
 * ⚠️ TODO (isi setelah dapat spek Nevapedia): ganti path "/transaction/cancel"
 * sesuai dokumentasi asli.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { orderId, amount } = req.body || {};
    if (!orderId || !amount) return res.status(400).json({ error: "orderId & amount required" });

    if (KEYS.demoMode) {
      return res.status(200).json({ ok: true, order_id: orderId, status: "CANCELED", demo: true });
    }

    const r = await axios.post(
      `${KEYS.nevapedia.baseUrl}/transaction/cancel`,
      { merchant_id: KEYS.nevapedia.merchantId, order_id: orderId, amount },
      { headers: { Authorization: `Bearer ${KEYS.nevapedia.apiKey}` }, timeout: 15000 }
    );

    return res.status(200).json(r.data);
  } catch (err) {
    return res.status(500).json({
      error: "Failed to cancel transaction on Nevapedia",
      detail: err?.response?.data || String(err),
    });
  }
}
